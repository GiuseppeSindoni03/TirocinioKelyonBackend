import { Doctor } from 'src/doctor/doctor.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'timestamptz' })
  @Unique(['doctor', 'startTime'])
  startTime: Date;

  @Column({ type: 'timestamptz' })
  @Unique(['doctor', 'endTime'])
  endTime: Date;

  @ManyToOne(() => Doctor, (doctor) => doctor.availabilities, {
    onDelete: 'CASCADE',
  })
  doctor: Doctor;
}
