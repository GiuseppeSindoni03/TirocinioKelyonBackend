import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './dto/jtw-payload.interface';
import { DoctorRegisterDto } from './dto/doctor-register.dto';
import { TokensDto } from './dto/tokens.dto';
import { RefreshDto } from './dto/refresh.dto';
import { User } from 'src/user/user.entity';
import { Session } from 'src/session/session.entity';
import { DeviceInfo } from './utils/deviceInfo';
import { Doctor } from 'src/doctor/doctor.entity';
import { LogoutDto } from './dto/logout.dto';
import { UserRoles } from 'src/common/enum/roles.enum';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    name: string;
    surname: string;
    email: string;
    role: string;
    id: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    private jwtService: JwtService,
  ) {}

  async signUp(
    info: DoctorRegisterDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponse> {
    const existingUser = await this.findUser(info.email, info.phone, info.cf);
    if (existingUser) throw new ConflictException('User already exists');

    const hashedPassword = await this.hashPassword(info.password);

    const doctor = await this.createUserDoctor(info, hashedPassword);
    await this.createDoctorInfo(info, doctor);

    const session = await this.createSession(doctor, deviceInfo);

    const tokens: TokensDto = await this.generateTokens({
      userId: doctor.id,
      sessionId: session.id,
    });

    session.refreshToken = await this.hashToken(tokens.refreshToken);
    await this.sessionRepository.save(session);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        name: info.name,
        surname: info.surname,
        email: info.email,
        role: UserRoles.DOCTOR,
        id: doctor.id,
      },
    };
  }

  async signIn(
    credentials: AuthCredentialsDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponse> {
    const { email, password } = credentials;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = await this.createSession(user, deviceInfo);

    const tokens: TokensDto = await this.generateTokens({
      userId: user.id,
      sessionId: session.id,
    });

    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);

    session.refreshToken = hashedRefreshToken;
    await this.sessionRepository.save(session);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        id: user.id,
      },
    };
  }

  async refreshToken(refreshDto: RefreshDto): Promise<TokensDto> {
    const { refreshToken } = refreshDto;

    const payload = this.verifyToken(refreshToken);

    const session = await this.sessionRepository.findOne({
      where: { id: payload.sessionId },
      relations: ['user'],
    });

    if (
      !session ||
      !(await this.isRefreshTokenValid(refreshToken, session.refreshToken))
    ) {
      throw new UnauthorizedException();
    }

    const tokens: TokensDto = await this.generateTokens({
      userId: session.user.id,
      sessionId: session.id,
    });

    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);

    session.refreshToken = hashedRefreshToken;
    await this.sessionRepository.save(session);

    return tokens;
  }

  async logout(logoutDto: LogoutDto): Promise<void> {
    const { refreshToken } = logoutDto;

    const payload = this.verifyToken(refreshToken);

    const session = await this.sessionRepository.findOne({
      where: { id: payload.sessionId },
    });

    if (
      !session ||
      !(await this.isRefreshTokenValid(refreshToken, session.refreshToken))
    ) {
      throw new UnauthorizedException();
    }

    try {
      await this.sessionRepository.remove(session);
    } catch (err) {
      console.log(err);
      throw err;
    }
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

  private async hashToken(token: string) {
    try {
      const salt = await bcrypt.genSalt();
      return bcrypt.hash(token, salt);
    } catch (err) {
      throw new Error('There is a problem to hashToken');
    }
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

  private async createUserDoctor(
    info: DoctorRegisterDto,
    hashedPassword: string,
  ): Promise<User> {
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
      role: UserRoles.DOCTOR,
    });

    return this.userRepository.save(user);
  }

  private async createDoctorInfo(
    info: DoctorRegisterDto,
    user: User,
  ): Promise<Doctor> {
    const doctor = this.doctorRepository.create({
      medicalOffice: info.medicalOffice,
      registrationNumber: info.registrationNumber,
      orderProvince: info.orderProvince,
      orderDate: info.orderDate,
      orderType: info.orderType,
      specialization: info.specialization,
      user: user,
    });

    return this.doctorRepository.save(doctor);
  }

  private async createSession(
    user: User,
    deviceInfo: DeviceInfo,
  ): Promise<Session> {
    const session = this.sessionRepository.create({
      user: user,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceInfo: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
    });

    return this.sessionRepository.save(session);
  }

  private async generateTokens(payload: JwtPayload): Promise<TokensDto> {
    const accessToken: string = await this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    const refreshToken: string = await this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private verifyToken(refreshToken: string): JwtPayload {
    try {
      return this.jwtService.verify(refreshToken);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async isRefreshTokenValid(
    token: string,
    hashedToken: string,
  ): Promise<boolean> {
    return bcrypt.compare(token, hashedToken);
  }
}
