// dto/complete-registration.dto.ts
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from 'src/auth/dto/gender-enum';
import { IsCodiceFiscale } from 'src/auth/validators/codiceFiscale.validator';

export class AcceptInviteDto {
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
  @IsEnum(['Uomo', 'Donna', 'Altro'])
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
  @IsStrongPassword()
  password: string;
}
