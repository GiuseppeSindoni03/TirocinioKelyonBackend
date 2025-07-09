import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from 'src/patient/patient.entity';
import { Doctor } from 'src/doctor/doctor.entity';
import { DoctorItem, UserWithoutPassword } from 'src/common/types/doctorItem';
import { PatientItem } from 'src/common/types/patientItem';
import { UserRoles } from 'src/common/enum/roles.enum';
import { UserItem } from 'src/common/types/userItem';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async getMe(userId: string): Promise<UserItem> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.role === UserRoles.PATIENT) {
      return {
        ...user,
        patient: await this.buildPatientItem(userId, user),
        doctor: undefined,
      };
    }

    return {
      ...user,
      patient: undefined,
      doctor: await this.buildDoctorItem(userId, user),
    };
  }

  private async buildPatientItem(userId: string, user: User): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!patient) {
      throw new UnauthorizedException('Patient record not found');
    }

    return patient;
  }

  private async buildDoctorItem(userId: string, user: User): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { userId: userId },
    });

    if (!doctor) {
      throw new UnauthorizedException('Doctor record not found');
    }

    return doctor;
  }

  private mapUserToUserWithoutPassword(user: User): UserWithoutPassword {
    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      cf: user.cf,
      birthDate: user.birthDate,
      gender: user.gender,
      phone: user.phone,
      role: user.role,
      address: user.address,
      city: user.city,
      cap: user.cap,
      province: user.province,
    };
  }
}
