import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from 'src/session/session.entity';
import { Repository } from 'typeorm';
import { UserItem } from 'src/common/types/userItem';
import { Doctor } from 'src/doctor/doctor.entity';
import { Patient } from 'src/patient/patient.entity';
import { UserRoles } from 'src/common/enum/roles.enum';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,

    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    //console.log('AuthMiddleware attivato su:', req.path);

    const accessToken = req.cookies?.jwt;
    const refreshToken = req.cookies?.refreshToken;

    try {
      const payload = jwt.verify(
        accessToken,
        this.configService.get<string>('JWT_SECRET', 'defaultSecret'),
      ) as jwt.JwtPayload;

      req.user = await this.fetchUser(payload.sessionId);

      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });

      //console.log('AccessToken Valido');

      return next();
    } catch (err) {
      // se jwt scaduto e ho il refreshToken provo a fare il refresh
      if (err.name === 'TokenExpiredError' && refreshToken) {
        try {
          const newAccessToken =
            await this.authService.refreshToken(refreshToken);

          const decoded = jwt.decode(newAccessToken) as jwt.JwtPayload;
          if (!decoded?.sessionId) {
            throw new UnauthorizedException('Invalid token payload');
          }

          res.cookie('jwt', newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
          });

          req.user = await this.fetchUser(decoded.sessionId);

          // console.log(
          //   'AccessToken scaduto ma tranquillo cucciolo hai il RefreshToken v',
          // );
          return next();
        } catch (refreshErr) {
          //console.error('Errore durante il refresh:', refreshErr);
          //console.log('AccessToken scaduto e anche RefreshToken sei cuicinato');

          return res
            .status(401)
            .json({ message: 'Unauthorixed anche refresh scaduto' });
        }
      }

      return res.status(401).json({ message: 'Unauthorized tutto scaduto' });
    }
  }

  private async fetchUser(sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });

    if (!session || !session.user) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.expiresAt < new Date()) {
      await this.sessionRepository.delete(session.id); // cleanup
      throw new UnauthorizedException('Session expired');
    }

    const user: UserItem = session.user;

    console.log('Session user: ', session.user);

    if (user.role === UserRoles.DOCTOR) {
      const doctor = await this.doctorRepository.findOne({
        where: { user: user },
        relations: ['user'],
      });

      if (doctor) {
        user.doctor = doctor;
      }
    } else if (user.role === UserRoles.PATIENT) {
      const patient = await this.patientRepository.findOne({
        where: { user: user },
        relations: ['doctor', 'user'],
      });

      if (patient) {
        user.patient = patient;
      }
    }

    //console.log('Utente finale:', user);

    return user;
  }
}
