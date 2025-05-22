import { Module } from '@nestjs/common';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Patient } from 'src/patient/patient.entity';
import { MedicalExamination } from 'src/medical-examination/medical-examination.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { User } from 'src/user/user.entity';
import { Invite } from 'src/invite/invite.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      MedicalExamination,
      Doctor,
      User,
      Invite,
    ]),
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
