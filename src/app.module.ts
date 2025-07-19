import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configValidationSchema } from './config.schema';
import { PatientModule } from './patient/patient.module';
import { DoctorModule } from './doctor/doctor.module';
import { MedicalExaminationModule } from './medical-examination/medical-examination.module';
import { UserModule } from './user/user.module';
import { InviteModule } from './invite/invite.module';
import { AvailabilityModule } from './availability/availability.module';
import { ReservationModule } from './reservation/reservation.module';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { MedicalDetectionModule } from './medical-detection/medical-detection.module';
// import { BaseUserInterceptor } from './transform.interceptor';
// import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.${process.env.STAGE}`],
      validationSchema: configValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        autoLoadEntities: true,
        synchronize: true,
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        //logging: 'all',
      }),
    }),
    AuthModule,
    PatientModule,
    DoctorModule,
    MedicalExaminationModule,
    UserModule,
    InviteModule,
    AvailabilityModule,
    ReservationModule,
    MedicalDetectionModule,
  ],
  controllers: [],
  // providers: [{ useClass: BaseUserInterceptor, provide: APP_INTERCEPTOR }],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/check/email/:email', method: RequestMethod.GET },
        { path: 'auth/check/phone/:phone', method: RequestMethod.GET },
        { path: 'auth/check/cf/:cf', method: RequestMethod.GET },
        { path: 'auth/signup', method: RequestMethod.POST },
        { path: 'auth/signin', method: RequestMethod.POST },
        { path: 'invite/:id', method: RequestMethod.GET },
        { path: 'invite/:id/accept', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
