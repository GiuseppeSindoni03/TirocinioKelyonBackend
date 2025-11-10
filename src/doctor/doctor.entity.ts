import { User } from '../user/user.entity';
import { MedicalExamination } from '../medical-examination/medical-examination.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Availability } from '../availability/availability.entity';
import { Reservation } from '../reservation/reservation.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Doctor {
  @PrimaryColumn('uuid')
  userId: string;

  @Column()
  specialization: string;

  @Column()
  medicalOffice: string;

  @Column()
  registrationNumber: string;

  @Column()
  orderProvince: string;

  @Column({ type: 'date' })
  orderDate: Date;

  @Column()
  orderType: string;

  @OneToMany(
    () => MedicalExamination,
    (medicalExamination) => medicalExamination.doctor,
  )
  medicalExaminations: MedicalExamination[];

  @OneToOne(() => User, (user) => user.id, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  @Exclude()
  user?: User;

  @OneToMany(() => Availability, (availability) => availability.doctor)
  availabilities: Availability[];

  @OneToMany(() => Reservation, (reservation) => reservation.doctor)
  reservations: Reservation[];
}
