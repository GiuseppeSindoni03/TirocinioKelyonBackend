import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { MedicalExamination } from 'src/medical-examination/medical-examination.entity';
import { Doctor } from 'src/doctor/doctor.entity';
import { Reservation } from 'src/reservation/reservation.entity';
import { PatientLevel } from './types/patient-level.enum';
import { Exclude } from 'class-transformer';

@Entity()
export class Patient {
  @PrimaryColumn('uuid')
  userId: string;

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
  patologies: string[];

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
  @JoinColumn({ name: 'userId' })
  @Exclude()
  user: User;
}
