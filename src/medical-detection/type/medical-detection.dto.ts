import { IsEnum, IsISO8601, IsNotEmpty, IsNumberString } from 'class-validator';
import { MedicalDetectionType } from './medical-detection-type.enum';

export class MedicalDetectionDTO {
  @IsNotEmpty()
  value: number;

  @IsNotEmpty()
  @IsEnum(MedicalDetectionType)
  type: MedicalDetectionType;

  @IsNotEmpty()
  @IsISO8601({}, { message: 'La data deve essere in formato ISO8601' })
  date: Date;
}
