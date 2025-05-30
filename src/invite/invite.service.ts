import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Invite } from './invite.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Doctor } from 'src/doctor/doctor.entity';
import { User } from 'src/user/user.entity';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { Patient } from 'src/patient/patient.entity';
import * as bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';
import { UserRoles } from 'src/common/enum/roles.enum';
import { UserItem } from 'src/common/types/userItem';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async createInvite(
    createInviteDto: CreateInviteDto,
    userId: string,
  ): Promise<Invite> {
    const doctor = await this.findDoctorOrThrow(userId);

    const { email, cf, phone } = createInviteDto;

    const found = await this.inviteRepository
      .createQueryBuilder('invite')
      .where(
        'invite.cf = :cf OR invite.phone =:phone OR invite.email = :email',
        {
          cf,
          phone,
          email,
        },
      )
      .getOne();

    console.log('Found: ', found);

    if (found)
      throw new BadRequestException('Invito per tale paziente già esiste');

    const patient = await this.createPatient(createInviteDto, doctor);

    console.log('Patient created: ', patient);

    return this.createAndSaveInvite(createInviteDto, doctor, patient);
  }

  async acceptInvite(
    data: AcceptInviteDto,
    inviteId: string,
    //user: UserItem,
  ): Promise<{ message: string }> {
    const invite = await this.findAndValidate(inviteId);

    console.log(invite);

    const hashedPassword = await this.hashPassword(data.password);
    const user = await this.createUserPatient(data, hashedPassword);

    await this.assignPatientToUser(
      invite.doctor.userId,
      invite.patient.id,
      user,
    );

    await this.markInviteAsUsed(inviteId);

    return {
      message: 'Invite accept successfully',
    };
  }

  // -- PRIVATE HELPERS

  private async findDoctorOrThrow(userId: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!doctor) throw new UnauthorizedException('Doctor not found');
    return doctor;
  }

  private async createPatient(
    createInviteDto: CreateInviteDto,
    doctor: Doctor,
  ) {
    const patient = this.patientRepository.create({
      weight: createInviteDto.weight,
      height: createInviteDto.height,
      bloodType: createInviteDto.bloodType,
      level: createInviteDto.level,
      sport: createInviteDto.sport,
      patologies: createInviteDto.patologies,
      medications: createInviteDto.medications,
      injuries: createInviteDto.injuries,
      doctor: doctor,
    });

    return await this.patientRepository.save(patient);
  }

  private async createAndSaveInvite(
    createInviteDto: CreateInviteDto,
    doctor: Doctor,
    patient: Patient,
  ) {
    const invite = this.inviteRepository.create({
      ...createInviteDto,
      doctor: doctor,
      patient: patient,
      // expiresAt: addDays(new Date(), 7),
    });

    return this.inviteRepository.save(invite);
  }

  private async findAndValidate(inviteId: string) {
    const invite = await this.inviteRepository.findOne({
      where: { id: inviteId },
      relations: ['doctor', 'patient'],
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.used) {
      throw new BadRequestException('Invite already used');
    }

    // if (invite.expiresAt < new Date()) {
    //   throw new BadRequestException('Invite expired');
    // }

    return invite;
  }

  private async hashPassword(password: string) {
    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      throw new Error('There is a problem to hash the password');
    }
  }

  private async createUserPatient(
    info: AcceptInviteDto,
    hashedPassword: string,
  ): Promise<User> {
    const exist = await this.findUser(info.email, info.phone, info.cf);

    if (exist) throw new ConflictException('User already exist');

    const user = this.userRepository.create({
      email: info.email,
      password: hashedPassword,
      name: info.name,
      surname: info.surname,
      cf: info.cf,
      birthDate: info.birthDate,
      phone: info.phone,
      gender: info.gender,
      address: info.address,
      city: info.city,
      cap: info.cap,
      province: info.province,
      role: UserRoles.PATIENT,
    });

    return this.userRepository.save(user);
  }

  private async assignPatientToUser(
    doctorId: string,
    patientId: string,
    newUser: User,
  ) {
    const patient = await this.patientRepository.findOne({
      where: { doctor: { userId: doctorId }, id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    patient.user = newUser;
    await this.patientRepository.save(patient);
  }

  private async markInviteAsUsed(inviteId: string): Promise<void> {
    await this.inviteRepository.update({ id: inviteId }, { used: true });
  }

  private async findUser(email: string, phone: string, cf: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email OR user.phone = :phone OR user.cf = :cf', {
        email,
        phone,
        cf,
      })
      .getOne();
  }
}
