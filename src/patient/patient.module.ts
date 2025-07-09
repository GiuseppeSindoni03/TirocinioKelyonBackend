import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { IsCodiceFiscaleConstraint } from 'src/auth/validators/codiceFiscale.validator';
import { User } from 'src/user/user.entity';
import { Doctor } from 'src/doctor/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, User, Doctor])],
  providers: [PatientService, IsCodiceFiscaleConstraint],
  controllers: [PatientController],
  exports: [],
})
export class PatientModule {}
