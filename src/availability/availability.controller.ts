import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserItem } from 'src/common/types/userItem';
import { GetUser } from 'src/auth/get-user-decorator';
import { UserRoles } from 'src/common/enum/roles.enum';

@Controller('doctor/availability')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async createAvailability(
    @Body() body: CreateAvailabilityDto,
    @GetUser() user: UserItem,
  ) {
    const doctor = this.getDoctorOrThrow(user);
    return this.availabilityService.createAvailability(body, doctor.userId);
  }

  // mi immagino serva tipo quando compare l'intero calendario
  @Get()
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async getAvailabilities(@GetUser() user: UserItem) {
    const doctor = this.getDoctorOrThrow(user);
    return this.availabilityService.getAvailabilities(doctor);
  }

  //qui invece immagino serva quando hai focus su un giorno specifico del calendario
  @Get('/date')
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async getAvailabilitiesDate(
    @GetUser() user: UserItem,
    @Query('date') date?: string,
  ) {
    const doctor = this.getDoctorOrThrow(user);

    if (date) {
      return this.availabilityService.getAvailabiltiesByDate(doctor, date);
    }

    return this.availabilityService.getAvailabilities(doctor);
  }

  // PRIVATE

  private getDoctorOrThrow(user: UserItem) {
    if (!user.doctor) {
      throw new UnauthorizedException(
        'You must be a doctor to perform this action',
      );
    }
    return user.doctor;
  }
}
