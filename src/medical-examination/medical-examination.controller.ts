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
  async postMedicalExamination(
    @GetUser() user: UserItem,
    @Param('reservationId') reservationId: string,
    @Body() medicalExamination: MedicalExaminationDTO,
  ) {
    if (!user.doctor) throw new UnauthorizedException();

    return await this.medicalExaminationService.addMedicalExamination(
      user,
      reservationId,
      medicalExamination,
    );
  }

  @Get('/:patientId')
  @Roles(UserRoles.DOCTOR)
  async getMedicalExaminations(
    @GetUser() user: UserItem,
    @Param('patientId') patientId: string,
    @Query('limit') limit: number = 3,
    @Query('cursor') cursor?: string,
  ) {
    if (!user.doctor) {
      throw new UnauthorizedException();
    }

    return this.medicalExaminationService.getMedicalDetections(
      user.id,
      patientId,
      limit,
      cursor,
    );
  }
}
