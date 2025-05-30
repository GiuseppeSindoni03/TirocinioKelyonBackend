import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
} from 'class-validator';
import { Gender } from 'src/auth/dto/gender-enum';
import { IsCodiceFiscale } from 'src/auth/validators/codiceFiscale.validator';
import { Doctor } from 'src/doctor/doctor.entity';
import { PatientLevel } from 'src/patient/types/patient-level.enum';

export class CreateInviteDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  surname: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsCodiceFiscale()
  cf: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  birthDate: Date;

  @IsNotEmpty()
  @IsEnum(['Uomo', 'Donna', 'Altro'], {
    message: 'Il genere deve essere Uomo, Donna o Altro',
  })
  gender: Gender;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  phone: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(5)
  cap: string;

  @IsNotEmpty()
  @IsString()
  province: string;

  @IsNotEmpty()
  @IsNumber()
  weight: number;

  @IsNotEmpty()
  @IsNumber()
  height: number;

  @IsNotEmpty()
  @IsEnum(PatientLevel, {
    message: 'The level must be ADVANCED, INTERMEDIATE or BEGINNER',
  })
  level: PatientLevel;

  @IsNotEmpty()
  @IsString()
  sport: string;

  @IsNotEmpty()
  @IsString()
  bloodType: string;

  @IsArray()
  patologies: string[];

  @IsArray()
  medications: string[];

  @IsArray()
  injuries: string[];
}
