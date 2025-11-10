import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { MedicalExamination } from '../medical-examination/medical-examination.entity';
import { Doctor } from '../doctor/doctor.entity';
import { Reservation } from '../reservation/reservation.entity';
import { PatientLevel } from './types/patient-level.enum';
import { Exclude } from 'class-transformer';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'float' })
  weight: number;

  @Column({ type: 'float' })
  height: number;

  @Column()
  bloodType: string;

  @Column({
    type: 'enum',
    enum: PatientLevel,
    default: PatientLevel.BEGINNER,
  })
  level: PatientLevel;

  @Column()
  sport: string;

  @Column('text', { array: true })
  pathologies: string[];

  @Column('text', { array: true })
  medications: string[];

  @Column('text', { array: true })
  injuries: string[];

  @OneToMany(() => Reservation, (reservation) => reservation.doctor)
  reservations: Reservation[];

  @OneToMany(
    () => MedicalExamination,
    (medicalExamination) => medicalExamination.patient,
    { nullable: true },
  )
  medicalExaminations: MedicalExamination[];

  @ManyToOne(() => Doctor, (doctor) => doctor.userId, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @OneToOne(() => User, (user) => user.id, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  @Exclude()
  user?: User;
}
