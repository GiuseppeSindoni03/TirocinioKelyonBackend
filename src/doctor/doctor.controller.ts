import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserRoles } from 'src/common/enum/roles.enum';
import { GetUser } from 'src/auth/get-user-decorator';
import { UserItem } from 'src/common/types/userItem';
import { User } from 'src/user/user.entity';
import { MedicalExaminationDTO } from 'src/invite/dto/medical-examination.dto';
import { Reservation } from 'src/reservation/reservation.entity';

@Controller('doctor')
@UseGuards(RolesGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('/patients')
  @Roles(UserRoles.DOCTOR)
  getPatients(
    @GetUser() user: UserItem,
    @Query('page') page = 1,
    @Query('limit') limit = 12,
    @Query('search') search = undefined,
  ) {
    return this.doctorService.getPatients(user.id, page, limit, search);
  }

  @Get('/patients/:id')
  @Roles(UserRoles.DOCTOR)
  getPatientById(@GetUser() user: UserItem, @Param('id') patientId: string) {
    return this.doctorService.getPatientById(patientId);
  }

  @Get('/me')
  @Roles(UserRoles.DOCTOR)
  getMe(@GetUser() user: UserItem) {
    return this.doctorService.getDoctorByUserId(user.id);
  }
}
