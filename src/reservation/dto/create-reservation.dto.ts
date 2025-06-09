import { IsEnum, IsISO8601, IsNotEmpty } from 'class-validator';
import { IsSameDay } from 'src/common/validators/IsSameDayAndValidRange';
import { VisitTypeEnum } from '../types/visit-type.enum';
import { Type } from 'class-transformer';

export class CreateReservationDto {
  @IsNotEmpty()
  @IsISO8601()
  startTime: Date;

  @IsNotEmpty()
  @IsISO8601()
  endTime: Date;

  @IsNotEmpty()
  @IsEnum(VisitTypeEnum)
  visitType: VisitTypeEnum;

  // @IsSameDay()
  // boolean: boolean;
}
