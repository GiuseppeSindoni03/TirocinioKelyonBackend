import { IsEnum, IsISO8601, IsNotEmpty } from 'class-validator';
import { VisitTypeEnum } from '../types/visit-type.enum';
import { Transform, Type } from 'class-transformer';

export class CreateReservationDto {
  @IsNotEmpty()
  @IsISO8601()
  startTime: Date;

  @IsNotEmpty()
  @IsISO8601()
  endTime: Date;

  @IsNotEmpty()
  @IsEnum(VisitTypeEnum)
  @Transform(({ value }) => value.toString())
  visitType: VisitTypeEnum;
}
