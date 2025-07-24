import { MedicalDetection } from '../medical-detection.entity';
import { MedicalDetectionDTO } from './medical-detection.dto';

export interface MedicalDetectionsResponse {
  total: number;
  detections: MedicalDetectionDTO[];
}
