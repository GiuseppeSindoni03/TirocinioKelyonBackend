import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Gender } from './gender-enum';
import { PatientLevel } from 'src/patient/types/patient-level.enum';

export class UpdatePatientDto {
  // Dati utente (se esiste un user associato)
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  cf?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  cap?: string;

  @IsOptional()
  @IsString()
  province?: string;

  // Dati specifici del paziente
  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsEnum(PatientLevel)
  level?: PatientLevel;

  @IsOptional()
  @IsString()
  sport?: string;

  @IsOptional()
  pathologies?: string[];

  @IsOptional()
  medications?: string[];

  @IsOptional()
  injuries?: string[];
}
