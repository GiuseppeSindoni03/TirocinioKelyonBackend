import { Expose, Transform, Type } from 'class-transformer';
import { DoctorResponseDto } from './doctor-response.dto';
import { PatientResponseDto } from './patient-response.dto';
import { format } from 'date-fns';

export class InviteResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() surname: string;
  @Expose() email: string;
  @Expose() cf: string;
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  birthDate: string;

  @Expose() gender: string;
  @Expose() phone: string;
  @Expose() address: string;
  @Expose() city: string;
  @Expose() cap: string;
  @Expose() province: string;
  @Expose() weight: number;
  @Expose() height: number;
  @Expose() bloodType: string;
  @Expose() level: string;
  @Expose() sport: string;
  @Expose() pathologies: string[];
  @Expose() medications: string[];
  @Expose() injuries: string[];
  @Expose() used: boolean;
  @Expose()
  @Transform(({ value }) => {
    try {
      return format(new Date(value), 'yyyy-MM-dd');
    } catch {
      return value;
    }
  })
  createdAt: string;

  @Expose()
  @Type(() => DoctorResponseDto)
  doctor?: DoctorResponseDto;

  @Expose()
  @Type(() => PatientResponseDto)
  patient?: PatientResponseDto;
}
