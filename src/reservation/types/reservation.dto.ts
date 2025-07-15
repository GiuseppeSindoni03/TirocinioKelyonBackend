export interface ReservationsDTO extends ReservationPatientDTO {
  patient: {
    id: string;
    name: string;
    surname: string;
    cf: string;
    gender: string;
  };
}

export interface ReservationPatientDTO {
  id: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  status: string;
  visitType: string;
}
