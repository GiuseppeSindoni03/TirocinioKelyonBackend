import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
import { Session } from '../session/session.entity';
import { Doctor } from 'src/doctor/doctor.entity';
import { Patient } from 'src/patient/patient.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Doctor, Session, Patient]),
    // PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: 3600,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    //JwtStrategy
  ],
  controllers: [AuthController],
  exports: [AuthService, TypeOrmModule],
})
export class AuthModule {}
