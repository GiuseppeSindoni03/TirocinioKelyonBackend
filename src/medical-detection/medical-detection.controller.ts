import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
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
import { UserItem } from 'src/common/types/userItem';
import { MedicalDetectionType } from './type/medical-detection-type.enum';
import { MedicalDetectionDTO } from './type/medical-detection.dto';

export enum MedicalDetectionQueryFilter {
  WEIGHT = 'WEIGHT',
  SPO2 = 'SPO2',
  HR = 'HR',
  TEMPERATURE = 'TEMPERATURE',
  ALL = 'ALL',
}

@Controller('medical-detection')
@UseGuards(RolesGuard)
export class MedicalDetectionController {
  public constructor(
    private readonly medicalDetectionService: MedicalDetectionService,
  ) {}

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

    const d = await this.medicalDetectionService.getMedicalDetections(
      user.patient.id,
      type,
      startDate,
      endDate,
    );

    console.log('Result:', d);

    return d;
  }

  @Get('patient/:patientId')
  @Roles(UserRoles.DOCTOR)
  async getMedicalDetectionsPatient(
    @GetUser() user: UserItem,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,

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
    if (!user.doctor) {
      console.error('Bruh non hai il dottore');
      throw new UnauthorizedException();
    }

    const d = await this.medicalDetectionService.getMedicalDetections(
      patientId,
      type,
      startDate,
      endDate,
    );

    console.log('Result:', d);

    return d;
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
    console.log(' Sono dentro man');
    if (!user.patient) throw new UnauthorizedException();

    const d = await this.medicalDetectionService.getLastDetection(user, type);

    console.log('Result:', d);

    return d;
  }
}
