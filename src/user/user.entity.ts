import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['email', 'cf', 'phone'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  cf: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column()
  gender: string;

  @Column()
  phone: string;

  @Column()
  role: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  cap: string;

  @Column()
  province: string;
}
