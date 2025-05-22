import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from './availability.entity';
import { Doctor } from 'src/doctor/doctor.entity';
import { DoctorService } from 'src/doctor/doctor.service';
import { DoctorModule } from 'src/doctor/doctor.module';

@Module({
  imports: [TypeOrmModule.forFeature([Availability, Doctor]), DoctorModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
})
export class AvailabilityModule {}
