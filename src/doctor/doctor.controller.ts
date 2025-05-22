import { Controller, Get, UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserRoles } from 'src/common/enum/roles.enum';
import { GetUser } from 'src/auth/get-user-decorator';
import { UserItem } from 'src/common/types/userItem';

@Controller('doctor')
@UseGuards(RolesGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('/patients')
  @Roles(UserRoles.DOCTOR)
  getPatients(@GetUser() user: UserItem) {
    return this.doctorService.getPatients(user.id);
  }
  @Get('/me')
  @Roles(UserRoles.DOCTOR)
  getMe(@GetUser() user: UserItem) {
    return this.doctorService.getDoctorByUserId(user.id);
  }
}
