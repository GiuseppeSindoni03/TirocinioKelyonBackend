import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { GetSlot } from './dto/get-slot.dto';
import { GetUser } from 'src/auth/get-user-decorator';
import { UserItem } from 'src/common/types/userItem';
import { UserRoles } from 'src/common/enum/roles.enum';
import { VisitType } from './visit-type.entity';
import { VisitTypeEnum } from './types/visit-type.enum';

@Controller('reservations')
@UseGuards(RolesGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get()
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async getReservations(@GetUser() user: UserItem) {
    if (!user.doctor) {
      throw new UnauthorizedException('You are not a doctor');
    }

    return this.reservationService.getReservations(user.doctor);
  }

  @Post()
  @Roles(UserRoles.PATIENT, UserRoles.ADMIN)
  async createReservation(
    @GetUser() user: UserItem,
    @Body() body: CreateReservationDto,
  ) {
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
    @Query('visitType') visitType: VisitTypeEnum,
  ) {
    const patient = user.patient;

    if (!patient) throw new UnauthorizedException('You are not a patient');

    return this.reservationService.getReservationSlots(
      patient.doctor,
      date,
      visitType,
    );
  }
}
