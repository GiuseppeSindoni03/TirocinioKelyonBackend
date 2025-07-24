import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MedicalDetectionType } from './type/medical-detection-type.enum';
import { Patient } from 'src/patient/patient.entity';

@Entity()
export class MedicalDetection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric' })
  value: number;

  @Column()
  type: MedicalDetectionType;

  @ManyToOne(() => Patient, {
    onDelete: 'CASCADE',
  })
  patient: Patient;

  @Column({ type: 'timestamptz' })
  date: Date;
}
