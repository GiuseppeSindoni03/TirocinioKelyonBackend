import { PatientItem } from 'src/common/types/patientItem';

export interface PatientsResponse {
  data: PatientItem[];
  total: number;
  page: number;
  limit: number;
}
