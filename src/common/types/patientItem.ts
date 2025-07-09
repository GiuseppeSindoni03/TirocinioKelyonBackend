import { UserWithoutPassword } from './doctorItem';

export interface PatientItem {
  id: string;
  weight: number;
  height: number;
  bloodType: string;
  level: string;
  sport: string;
  pathologies: string[];
  medications: string[];
  injuries: string[];
  inviteId?: string;
  user: UserWithoutPassword;
}
