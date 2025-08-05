import { IsOptional } from 'class-validator';
import { Gender } from 'src/auth/dto/gender-enum';
import { Doctor } from 'src/doctor/doctor.entity';
import { Patient } from 'src/patient/patient.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column()
  email: string;

  @Column()
  cf: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  cap: string;

  @Column()
  province: string;

  @Column({ type: 'float' })
  weight: number;

  @Column({ type: 'float' })
  height: number;

  @Column()
  bloodType: string;

  @Column()
  level: string;

  @Column()
  sport: string;

  @Column('text', { array: true })
  @IsOptional()
  pathologies: string[];

  @Column('text', { array: true })
  @IsOptional()
  medications: string[];

  @Column('text', { array: true })
  @IsOptional()
  injuries: string[];

  @Column({ default: false })
  used: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // @Column({ type: 'timestamp', nullable: true })
  // expiresAt: Date;

  @ManyToOne((type) => Doctor, (doctor) => doctor.userId, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  doctor: Doctor;

  @OneToOne(() => Patient, (patient) => patient.id, {})
  @JoinColumn()
  patient: Patient;
}
