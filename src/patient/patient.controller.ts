import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UserItem } from 'src/common/types/userItem';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserRoles } from 'src/common/enum/roles.enum';
import { plainToInstance } from 'class-transformer';
import {
  DoctorResponseDto,
  DoctorUserDto,
} from 'src/invite/dto/doctor-response.dto';

@Controller('patient')
@UseGuards(RolesGuard)
export class PatientController {
  constructor(private patientService: PatientService) {}

  @Get('/doctor')
  @Roles(UserRoles.PATIENT)
  async getDoctor(@GetUser() user: UserItem) {
    if (!user.patient) throw new UnauthorizedException();

    const doctor = await this.patientService.getDoctor(user.patient.id);

    const doctorUserDto = plainToInstance(DoctorUserDto, doctor.user, {
      excludeExtraneousValues: true,
    });

    const doctorDto = plainToInstance(DoctorResponseDto, doctor, {
      excludeExtraneousValues: true,
    });

    const response = {
      ...doctorDto,
      user: doctorUserDto,
    };

    console.log('Doctor: ', response);

    return response;
  }
}
