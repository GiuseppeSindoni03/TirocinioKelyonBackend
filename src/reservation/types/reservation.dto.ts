import { VisitType } from '../visit-type.entity';

export interface ReservationsDTO {
  id: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  status: string;
  visitType: string;
  patient: {
    id: string;
    name: string;
    surname: string;
    cf: string;
    gender: string;
  };
}
