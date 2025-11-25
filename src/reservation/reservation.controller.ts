import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseDatePipe,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Search,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { GetUser } from 'src/auth/get-user-decorator';
import { UserItem } from 'src/common/types/userItem';
import { UserRoles } from 'src/common/enum/roles.enum';
import { VisitTypeEnum } from './types/visit-type.enum';
import * as moment from 'moment-timezone';
import { stat } from 'fs';

enum ReservationQueryFilter {
  ALL = 'ALL',
  CONFIRMED = 'CONFIRMED',
  PENDING = 'PENDING',
  DECLINED = 'DECLINED',
}

@Controller('reservations')
@UseGuards(RolesGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get()
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async getReservations(
    @GetUser() user: UserItem,
    @Query('start') start: Date,
    @Query('end') end: Date,

    @Query(
      'status',
      new DefaultValuePipe('ALL'),
      new ParseEnumPipe(ReservationQueryFilter),
    )
    status: ReservationQueryFilter,
  ) {
    console.log('Sono dentro GET reservations');

    if (!user.doctor) {
      throw new UnauthorizedException('You are not a doctor');
    }

    console.log('Status:', status);
    console.log('Start:', start);
    console.log('End:', end);
    console.log('Query params:', { start, end, status });
    return this.reservationService.getReservations(
      user.doctor,
      status,
      start,
      end,
    );
  }

  @Get('/patient')
  @Roles(UserRoles.PATIENT)
  async getPastReservationsPatient(
    @GetUser() user: UserItem,
    @Query(
      'status',
      new DefaultValuePipe('ALL'),
      new ParseEnumPipe(ReservationQueryFilter),
    )
    status: ReservationQueryFilter,
  ) {
    if (!user.patient) {
      throw new UnauthorizedException('You are not a patient');
    }

    return this.reservationService.getPastReservationsPatient(
      user.patient.doctor,
      status,
      user.patient,
    );
  }

  @Get('/count')
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async getHowManyPendingReservations(@GetUser() user: UserItem) {
    if (!user.doctor) {
      throw new UnauthorizedException('You are not a doctor');
    }

    console.log('Sono dentro Count');

    return this.reservationService.getHowManyPendingReservations(user.doctor);
  }

  @Post()
  @Roles(UserRoles.PATIENT, UserRoles.ADMIN)
  async createReservation(
    @GetUser() user: UserItem,
    @Body() body: CreateReservationDto,
  ) {
    console.log('Body: ', body);

    if (!user.patient) {
      throw new UnauthorizedException('You are not a patient.');
    }

    if (!user.patient.doctor) {
      throw new BadRequestException('Patient`s doctor doesn`t exist');
    }

    return this.reservationService.createReservation(
      user.patient.doctor,
      user.patient,
      body,
    );
  }

  @Patch('/:reservationId/confirm')
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async acceptReservation(
    @GetUser() user: UserItem,
    @Param('reservationId', new ParseUUIDPipe()) reservationId: string,
  ) {
    const doctor = user.doctor;
    if (!doctor) throw new UnauthorizedException('You are not a doctor');

    await this.reservationService.acceptReservation(reservationId, doctor);

    return {
      message: 'Reservation confirmed successfully',
    };
  }

  @Patch('/:reservationId/decline')
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async rejectReservation(
    @GetUser() user: UserItem,
    @Param('reservationId', new ParseUUIDPipe()) reservationId: string,
  ) {
    const doctor = user.doctor;

    if (!doctor) throw new UnauthorizedException('You are not a doctor');

    await this.reservationService.declineReservation(reservationId, doctor);

    return {
      message: 'Reservation declined successfully',
    };
  }

  @Get('/slots')
  @Roles(UserRoles.PATIENT, UserRoles.ADMIN)
  async getSlots(
    @GetUser() user: UserItem,
    @Query('date') date: string,
    @Query('visitType') visitType: VisitTypeEnum = VisitTypeEnum.CONTROL,
  ) {
    const patient = user.patient;

    if (!patient) throw new UnauthorizedException('You are not a patient');

    const localDate = moment.tz(date, 'YYYY-MM-DD', 'Europe/Rome').format();

    const slots = await this.reservationService.getReservationSlots(
      patient.doctor,
      localDate,
      visitType,
    );

    const localSlots = slots.map((slot) => ({
      startTime: moment(slot.startTime).tz('Europe/Rome').format(),
      endTime: moment(slot.endTime).tz('Europe/Rome').format(),
    }));

    return localSlots;
  }

  @Get('/next-reservation')
  @Roles(UserRoles.PATIENT)
  async getNestReservations(@GetUser() user: UserItem) {
    console.log('1) Sto chiamando next reservations');
    return this.reservationService.getNextReservations(user);
  }

  @Get('/isFirstVisit')
  @Roles(UserRoles.PATIENT)
  async isFirstVisit(@GetUser() user: UserItem) {
    if (!user.patient) throw new UnauthorizedException();

    return this.reservationService.isFirstVisit(user.patient);
  }

  @Get('/:patient')
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async getReservationsPatient(
    @GetUser() user: UserItem,
    @Param('patient', new ParseUUIDPipe()) patientId: string,
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
    @Query('search') search: string,
  ) {
    console.log('Sono dentro GET reservations/:patient');

    if (!user.doctor) {
      throw new UnauthorizedException('You are not a doctor');
    }



    return this.reservationService.getReservationsPatient(
    user.doctor,
    patientId,
    page,
    limit,
    search,
  );
  }
}
