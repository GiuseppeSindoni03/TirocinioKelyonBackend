import { Module } from '@nestjs/common';
import { MedicalDetectionController } from './medical-detection.controller';
import { MedicalDetectionService } from './medical-detection.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from 'src/patient/patient.entity';
import { MedicalDetection } from './medical-detection.entity';

@Module({
  controllers: [MedicalDetectionController],
  providers: [MedicalDetectionService],
  imports: [TypeOrmModule.forFeature([Patient, MedicalDetection])],
})
export class MedicalDetectionModule {}
