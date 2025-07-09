import { Expose, Transform } from 'class-transformer';
import { UserWithoutPassword } from 'src/common/types/doctorItem';

export class DoctorResponseDto {
  @Expose() userId: string;
  @Expose() specialization: string;
  @Expose() medicalOffice: string;
  @Expose() registrationNumber: string;
  @Expose() orderProvince: string;
  @Expose() orderDate: Date;
  @Expose() orderType: string;
}

export class DoctorUserDto implements UserWithoutPassword {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() surname: string;
  @Expose() email: string;
  @Expose() cf: string;

  @Expose()
  birthDate: Date;

  @Expose() gender: string;
  @Expose() phone: string;
  @Expose() role: string;
  @Expose() address: string;
  @Expose() city: string;
  @Expose() cap: string;
  @Expose() province: string;
}
