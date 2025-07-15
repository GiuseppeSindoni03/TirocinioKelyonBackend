import { Doctor } from 'src/doctor/doctor.entity';
import { Patient } from 'src/patient/patient.entity';
import { Reservation } from 'src/reservation/reservation.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

// TODO
@Entity()
export class MedicalExamination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column()
  motivation: string;

  @Column()
  note: string;

  @ManyToOne(() => Patient, (patient) => patient.medicalExaminations, {
    onDelete: 'CASCADE',
  })
  patient: Patient;

  @ManyToOne(() => Doctor, (doctor) => doctor.medicalExaminations, {
    onDelete: 'CASCADE',
  })
  doctor: Doctor;

  @OneToOne(() => Reservation, { onDelete: 'CASCADE', cascade: false })
  @JoinColumn()
  reservation: Reservation;
}
