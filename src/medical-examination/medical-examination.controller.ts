import {
  Body,
  Controller,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { GetUser } from 'src/auth/get-user-decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRoles } from 'src/common/enum/roles.enum';
import { UserItem } from 'src/common/types/userItem';
import { MedicalExaminationDTO } from 'src/invite/dto/medical-examination.dto';
import { MedicalExaminationService } from './medical-examination.service';

@Controller('medical-examination')
@UseGuards(RolesGuard)
export class MedicalExaminationController {
  constructor(
    private readonly medicalExaminationService: MedicalExaminationService,
  ) {}

  @Post('/:reservationId')
  @Roles(UserRoles.DOCTOR)
  postMedicalExamination(
    @GetUser() user: UserItem,
    @Param('reservationId') reservationId: string,
    @Body() medicalExamination: MedicalExaminationDTO,
  ) {
    if (!user.doctor) throw new UnauthorizedException();

    return this.medicalExaminationService.addMedicalExamination(
      user,
      reservationId,
      medicalExamination,
    );
  }
}
