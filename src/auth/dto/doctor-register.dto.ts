import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from './gender-enum';
import { Type } from 'class-transformer';
import { IsCodiceFiscale } from '../validators/codiceFiscale.validator';

export class DoctorRegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  surname: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsCodiceFiscale({ message: "Il Codice Fiscale non e' valido." })
  cf: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  birthDate: Date;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  phone: string;

  @IsEnum(Gender, { message: 'Il genere deve essere Uomo, Donna o Altro' })
  gender: Gender;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  cap: string;

  @IsNotEmpty()
  @IsString()
  province: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  medicalOffice: string;

  @IsString()
  @IsNotEmpty()
  registrationNumber: string; // num. iscrizione albo

  @IsString()
  @IsNotEmpty()
  orderProvince: string; // provincia dell'ordine (es: RM)

  @IsDate()
  @Type(() => Date)
  orderDate: Date; // data iscrizione

  @IsString()
  @IsNotEmpty()
  orderType: string;

  @IsNotEmpty()
  @IsString()
  specialization: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
