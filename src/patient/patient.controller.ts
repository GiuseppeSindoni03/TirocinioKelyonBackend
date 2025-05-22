import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PatientService } from './patient.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('patient')
@UseGuards(RolesGuard)
export class PatientController {
  constructor(private patientService: PatientService) {}
}
