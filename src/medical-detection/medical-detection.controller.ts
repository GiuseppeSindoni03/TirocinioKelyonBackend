import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseEnumPipe,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { MedicalDetectionService } from './medical-detection.service';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserRoles } from 'src/common/enum/roles.enum';
import { GetUser } from 'src/auth/get-user-decorator';
import { userInfo } from 'os';
import { UserItem } from 'src/common/types/userItem';
import { MedicalDetectionType } from './type/medical-detection-type.enum';

export interface MedicalDetectionDTO {
  value: number;
  type: MedicalDetectionType;
}

export enum MedicalDetectionQueryFilter {
  WEIGHT = 'WEIGHT',
  SPO2 = 'SPO2',
  HR = 'HR',
  TEMPERAATURE = 'TEMPERATURE',
  ALL = 'ALL',
}

@Controller('medical-detection')
@UseGuards(RolesGuard)
export class MedicalDetectionController {
  public constructor(
    private readonly medicalDetectionService: MedicalDetectionService,
  ) {}

  // Get of my detections { type filter}
  @Get()
  @Roles(UserRoles.PATIENT)
  async getMedicalDetections(
    @GetUser() user: UserItem,
    @Query(
      'type',
      new DefaultValuePipe('ALL'),
      new ParseEnumPipe(MedicalDetectionQueryFilter),
    )
    type,
    @Query('startDate')
    startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!user.patient) throw new UnauthorizedException();

    return this.medicalDetectionService.getMedicalDetections(
      user,
      type,
      startDate,
      endDate,
    );
  }

  @Post()
  @Roles(UserRoles.PATIENT)
  async postMedicalDetection(
    @GetUser() user: UserItem,
    @Body() medicalDetection: MedicalDetectionDTO,
  ) {
    if (!user.patient) throw new UnauthorizedException();

    return this.medicalDetectionService.postMedicalDetection(
      user,
      medicalDetection,
    );
  }

  @Get('last')
  @Roles(UserRoles.PATIENT)
  async getLastDetection(
    @GetUser() user: UserItem,
    @Query('type', new ParseEnumPipe(MedicalDetectionType))
    type: MedicalDetectionType,
  ) {
    if (!user.patient) throw new UnauthorizedException();

    return this.medicalDetectionService.getLastDetection(user, type);
  }
}
