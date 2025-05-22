import { PatientLevel } from 'src/patient/types/patient-level.enum';

export class PatientResponseDto {
  userId: string;
  weight: number;
  height: number;
  bloodType: string;
  level: PatientLevel;
  sport: string;
  patologies: string[];
  medications: string[];
  injuries: string[];
}
