import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { Doctor } from 'src/doctor/doctor.entity';
import { User } from 'src/user/user.entity';
import { UserItem } from 'src/common/types/userItem';
import { DoctorItem } from 'src/common/types/doctorItem';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  async getDoctor(patientId: string): Promise<DoctorItem> {
    const patient = await this.patientRepository.findOne({
      where: {
        id: patientId,
      },

      relations: ['doctor'],
    });

    if (!patient) throw new NotFoundException();

    const doctor = await this.doctorRepository.findOne({
      where: { userId: patient.doctor.userId },
      relations: ['user'],
    });

    if (!doctor || !doctor.user) throw new NotFoundException();

    const { password, ...safeUser } = doctor.user;

    return {
      ...doctor,
      user: safeUser,
    };
  }
}
