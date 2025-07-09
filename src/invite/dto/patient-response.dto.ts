import { Expose } from 'class-transformer';

export class PatientResponseDto {
  @Expose() id: string;
  @Expose() weight: number;
  @Expose() height: number;
  @Expose() bloodType: string;
  @Expose() level: string;
  @Expose() sport: string;
  @Expose() pathologies: string[];
  @Expose() medications: string[];
  @Expose() injuries: string[];
}
