import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { Repository } from 'typeorm';
import { Patient } from 'src/patient/patient.entity';
import { User } from 'src/user/user.entity';
import { UserItem } from 'src/common/types/userItem';
import { PatientItem } from 'src/common/types/patientItem';
import { Invite } from 'src/invite/invite.entity';
import { DoctorItem, UserWithoutPassword } from 'src/common/types/doctorItem';
import { PatientsResponse } from 'src/patient/types/patients-response.interface';
import { take } from 'rxjs';
import { UpdatePatientDto } from 'src/auth/dto/update-patient.dto';

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

  async getPatients(
    userId: string,
    page: number,
    limit: number,
    search: string | undefined,
  ): Promise<PatientsResponse> {
    const doctor = await this.getDoctorOrThrow(userId);

    const allPatients = await this.patientRepository.find({
      where: { doctor: { userId: doctor.userId } },
      relations: ['user'],
    });

    const invites = await this.inviteRepository.find({
      where: { doctor: { userId: doctor.userId } },
      relations: ['patient'],
    });

    // console.log('Lista di Pazienti: ', patients);

    const mapped = allPatients.map((patient): PatientItem => {
      if (patient.user) {
        const { password, ...safeUser } = patient.user;

        return {
          ...patient,
          inviteId: undefined,
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
        pathologies: patient.pathologies,
        medications: patient.medications,
        injuries: patient.injuries,
      };
    });
    console.log('Search:', `{ ${search} }`);
    const filtered =
      search && search !== ''
        ? mapped.filter((p) => {
            const user = p.user;
            if (!user) return false;

            const searchLower = search.toLowerCase();
            return (
              user.name?.toLowerCase().includes(searchLower) ||
              user.surname?.toLowerCase().includes(searchLower) ||
              user.email?.toLowerCase().includes(searchLower) ||
              user.cf?.toLowerCase().includes(searchLower)
            );
          })
        : mapped;

    const startIndex = (page - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedData = filtered.slice(startIndex, endIndex);

    console.log('StartIndex: ', startIndex);
    console.log('EndIndex: ', endIndex);
    console.log('Paginates data: ', paginatedData);
    console.log('Filtered: ', filtered[0]);
    console.log('Filtered length: ', filtered.length);
    console.log('Mapped: ', mapped[0]);
    console.log('Mapped.lentgh: ', mapped.length);

    // 5. Il total deve essere basato sui pazienti FILTRATI
    return {
      data: filtered.slice(startIndex, endIndex),
      total: filtered.length, // ← Questo è il fix principale!
      page,
      limit,
    };
  }

  async getPatientById(patientId: string): Promise<PatientItem> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['user'],
    });

    if (!patient) throw new BadRequestException("Patient doesn't exist.");

    if (patient.user) {
      const { password, ...safeUser } = patient.user;

      return {
        ...patient,
        inviteId: undefined,
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
      inviteId: invite.id,
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
      pathologies: patient.pathologies,
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

  async updatePatient(
    userId: string,
    patientId: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<PatientItem> {
    // Verifica che il dottore esista
    const doctor = await this.getDoctorOrThrow(userId);

    // Trova il paziente con le relazioni
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['user', 'doctor'],
    });

    if (!patient) {
      throw new NotFoundException('Paziente non trovato');
    }

    // Verifica che il paziente appartenga al dottore
    if (patient.doctor?.userId !== doctor.userId) {
      throw new ForbiddenException(
        'Non hai i permessi per modificare questo paziente',
      );
    }

    // Aggiorna i dati specifici del paziente
    if (updatePatientDto.weight !== undefined)
      patient.weight = updatePatientDto.weight;
    if (updatePatientDto.height !== undefined)
      patient.height = updatePatientDto.height;
    if (updatePatientDto.bloodType !== undefined)
      patient.bloodType = updatePatientDto.bloodType;
    if (updatePatientDto.level !== undefined)
      patient.level = updatePatientDto.level;
    if (updatePatientDto.sport !== undefined)
      patient.sport = updatePatientDto.sport;
    if (updatePatientDto.pathologies !== undefined)
      patient.pathologies = updatePatientDto.pathologies;
    if (updatePatientDto.medications !== undefined)
      patient.medications = updatePatientDto.medications;
    if (updatePatientDto.injuries !== undefined)
      patient.injuries = updatePatientDto.injuries;

    // Salva le modifiche al paziente
    await this.patientRepository.save(patient);

    // Se il paziente ha un user associato, aggiorna anche quello
    if (patient.user) {
      const user = await this.userRepository.findOne({
        where: { id: patient.user.id },
      });

      if (user) {
        if (updatePatientDto.name !== undefined)
          user.name = updatePatientDto.name;
        if (updatePatientDto.surname !== undefined)
          user.surname = updatePatientDto.surname;
        if (updatePatientDto.email !== undefined)
          user.email = updatePatientDto.email;
        if (updatePatientDto.cf !== undefined) user.cf = updatePatientDto.cf;
        if (updatePatientDto.birthDate !== undefined)
          user.birthDate = new Date(updatePatientDto.birthDate);
        if (updatePatientDto.gender !== undefined)
          user.gender = updatePatientDto.gender;
        if (updatePatientDto.phone !== undefined)
          user.phone = updatePatientDto.phone;
        if (updatePatientDto.address !== undefined)
          user.address = updatePatientDto.address;
        if (updatePatientDto.city !== undefined)
          user.city = updatePatientDto.city;
        if (updatePatientDto.cap !== undefined) user.cap = updatePatientDto.cap;
        if (updatePatientDto.province !== undefined)
          user.province = updatePatientDto.province;

        await this.userRepository.save(user);
      }
    } else {
      // Se non ha un user ma ha un invite, aggiorna l'invite
      const invite = await this.inviteRepository.findOne({
        where: { patient: { id: patientId } },
      });

      if (invite) {
        if (updatePatientDto.name !== undefined)
          invite.name = updatePatientDto.name;
        if (updatePatientDto.surname !== undefined)
          invite.surname = updatePatientDto.surname;
        if (updatePatientDto.email !== undefined)
          invite.email = updatePatientDto.email;
        if (updatePatientDto.cf !== undefined) invite.cf = updatePatientDto.cf;
        if (updatePatientDto.birthDate !== undefined)
          invite.birthDate = new Date(updatePatientDto.birthDate);
        if (updatePatientDto.gender !== undefined)
          invite.gender = updatePatientDto.gender;
        if (updatePatientDto.phone !== undefined)
          invite.phone = updatePatientDto.phone;
        if (updatePatientDto.address !== undefined)
          invite.address = updatePatientDto.address;
        if (updatePatientDto.city !== undefined)
          invite.city = updatePatientDto.city;
        if (updatePatientDto.cap !== undefined)
          invite.cap = updatePatientDto.cap;
        if (updatePatientDto.province !== undefined)
          invite.province = updatePatientDto.province;

        await this.inviteRepository.save(invite);
      }
    }

    // Ritorna il paziente aggiornato
    return this.getPatientById(patientId);
  }

  async deletePatient(
    userId: string,
    patientId: string,
  ): Promise<{ message: string }> {
    // Verifica che il dottore esista
    const doctor = await this.getDoctorOrThrow(userId);

    // Trova il paziente
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['doctor', 'user'],
    });

    if (!patient) {
      throw new NotFoundException('Paziente non trovato');
    }

    // Verifica che il paziente appartenga al dottore
    if (patient.doctor?.userId !== doctor.userId) {
      throw new ForbiddenException(
        'Non hai i permessi per eliminare questo paziente',
      );
    }

    // Elimina gli inviti associati (se esistono)
    const invites = await this.inviteRepository.find({
      where: { patient: { id: patientId } },
    });

    if (invites.length > 0) {
      await this.inviteRepository.remove(invites);
    }

    // Elimina il paziente (cascade dovrebbe gestire le altre relazioni)
    await this.patientRepository.remove(patient);

    return { message: 'Paziente eliminato con successo' };
  }
}
