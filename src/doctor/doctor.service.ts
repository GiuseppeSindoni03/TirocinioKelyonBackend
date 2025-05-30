import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { Repository } from 'typeorm';
import { Patient } from 'src/patient/patient.entity';
import { User } from 'src/user/user.entity';
import { UserItem } from 'src/common/types/userItem';
import { PatientItem } from 'src/common/types/patientItem';
import { Invite } from 'src/invite/invite.entity';
import { DoctorItem, UserWithoutPassword } from 'src/common/types/doctorItem';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
  ) {}

  async getDoctorByUserId(userId: string): Promise<DoctorItem> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor || !user) {
      throw new Error('Doctor not found');
    }

    if (doctor.user) doctor.user.password = '';

    const userWithoutPassword: UserWithoutPassword = {
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

    const doctorItem: DoctorItem = {
      userId: doctor.userId,
      specialization: doctor.specialization,
      medicalOffice: doctor.medicalOffice,
      registrationNumber: doctor.registrationNumber,
      orderProvince: doctor.orderProvince,
      orderDate: doctor.orderDate,
      orderType: doctor.orderType,
      user: userWithoutPassword,
    };

    return doctorItem;
  }

  async getPatients(userId: string): Promise<PatientItem[]> {
    const doctor = await this.getDoctorOrThrow(userId);

    const patients = await this.patientRepository.find({
      where: { doctor: { userId: doctor.userId } },
      relations: ['user'],
    });

    const invites = await this.inviteRepository.find({
      where: { doctor: { userId: doctor.userId } },
      relations: ['patient'],
    });

    // console.log('Lista di Pazienti: ', patients);

    return patients.map((patient): PatientItem => {
      if (patient.user) {
        const { password, ...safeUser } = patient.user;

        return {
          ...patient,
          user: safeUser,
        };
      }
      // console.log('Cerco per invito:');
      const invite = invites.find((inv) => inv.patient.id === patient.id);
      //console.log(invite);

      let userData: any = null;

      if (invite) {
        userData = {
          name: invite.name,
          surname: invite.surname,
          email: invite.email,
          cf: invite.cf,
          birthDate: invite.birthDate,
          gender: invite.gender,
          phone: invite.phone,
          address: invite.address,
          city: invite.city,
          cap: invite.cap,
          province: invite.province,
        };
      }

      return {
        id: patient.id,
        user: userData,
        weight: patient.weight,
        height: patient.height,
        bloodType: patient.bloodType,
        level: patient.level,
        sport: patient.sport,
        patologies: patient.patologies,
        medications: patient.medications,
        injuries: patient.injuries,
      };
    });
  }

  async getPatientById(patientId: string): Promise<PatientItem> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) throw new BadRequestException("Patient doesn't exist.");

    if (patient.user) {
      const { password, ...safeUser } = patient.user;

      return {
        ...patient,
        user: safeUser,
      };
    }

    const invite = await this.inviteRepository.findOne({
      where: { patient: { id: patientId } },
    });

    if (!invite) throw new BadRequestException("Patient doesn't exist.");

    console.log(invite);

    let userData: any = null;

    userData = {
      name: invite.name,
      surname: invite.surname,
      email: invite.email,
      cf: invite.cf,
      birthDate: invite.birthDate,
      gender: invite.gender,
      phone: invite.phone,
      address: invite.address,
      city: invite.city,
      cap: invite.cap,
      province: invite.province,
    };

    return {
      id: patient.id,
      user: userData,
      weight: patient.weight,
      height: patient.height,
      bloodType: patient.bloodType,
      level: patient.level,
      sport: patient.sport,
      patologies: patient.patologies,
      medications: patient.medications,
      injuries: patient.injuries,
    };
  }

  private async getDoctorOrThrow(userId: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    return doctor;
  }
}
