import { MedicalExaminationResponse } from './medical-examination-response.interface';

export interface MedicalExaminationsResponse {
  data: MedicalExaminationResponse[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
  };
}
