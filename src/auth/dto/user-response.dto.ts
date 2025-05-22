import { DoctorResponseDto } from './doctor-response.dto';
import { PatientResponseDto } from './patient-response.dto';

export class UserResponseDto {
  id: string;
  name: string;
  surname: string;
  email: string;
  cf: string;
  birthDate: Date;
  gender: string;
  phone: string;
  role: string;
  address: string;
  city: string;
  cap: string;
  province: string;
  doctor?: DoctorResponseDto;
  patient?: PatientResponseDto;
}
