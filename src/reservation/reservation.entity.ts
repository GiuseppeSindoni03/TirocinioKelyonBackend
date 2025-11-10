import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReservationStatus } from './types/reservation-status-enum';
import { Patient } from '../patient/patient.entity';
import { Doctor } from '../doctor/doctor.entity';
import { VisitType } from './visit-type.entity';

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ReservationStatus })
  status: ReservationStatus;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @ManyToOne(() => Patient, (patient) => patient.reservations)
  patient: Patient;

  @ManyToOne(() => Doctor, (doctor) => doctor.reservations, {
    onDelete: 'CASCADE',
  })
  doctor: Doctor;

  @ManyToOne(() => VisitType, { eager: true })
  visitType: VisitType;
}
