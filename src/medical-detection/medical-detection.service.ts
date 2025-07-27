import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalDetection } from './medical-detection.entity';
import { Repository } from 'typeorm';
import { UserItem } from 'src/common/types/userItem';
import { MedicalDetectionType } from './type/medical-detection-type.enum';
import { MedicalDetectionQueryFilter } from './medical-detection.controller';
import { date } from 'joi';
import { MedicalDetectionDTO } from './type/medical-detection.dto';
import { Patient } from 'src/patient/patient.entity';
import { MedicalDetectionsResponse } from './type/medical-detection-response';

@Injectable()
export class MedicalDetectionService {
  public constructor(
    @InjectRepository(MedicalDetection)
    private readonly medicalDetectionRepository: Repository<MedicalDetection>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async getMedicalDetections(
    patientId: string,
    type: MedicalDetectionQueryFilter,
    startDate?: string,
    endDate?: string,
  ): Promise<MedicalDetectionsResponse> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      console.log('Bruh il paziente non esiste');
      throw new NotFoundException();
    }

    // console.log('Patient: ', patient);

    const query = this.medicalDetectionRepository
      .createQueryBuilder('d')
      .where('d.patientId = :id', { id: patientId });

    if (type !== MedicalDetectionQueryFilter.ALL) {
      query.andWhere('d.type = :type', { type: type });
    }

    if (startDate) {
      query.andWhere('d.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('d.date <= :endDate', { endDate });
    }

    query.orderBy('d.date', 'ASC');

    const [detections, total] = await query.getManyAndCount();

    // console.log('StartDate:', startDate);
    // console.log('EndDate:', endDate);
    // console.log('Type: ', type);

    // console.log('Detections: ', detections);

    if (total === 0)
      throw new NotFoundException(`There arent't detections for ${type}`);

    const detectionsResponse = detections.map((d, index) => {
      return {
        value: d.value,
        type: d.type,
        date: d.date,
      };
    });

    const response: MedicalDetectionsResponse = {
      total: total,
      detections: detectionsResponse,
    };

    return response;
  }

  async getLastDetection(user: UserItem, type: MedicalDetectionType) {
    if (!user.patient) throw new UnauthorizedException();

    const query = this.medicalDetectionRepository
      .createQueryBuilder('d')
      .where('d.patientId = :id', { id: user.patient.id })
      .andWhere('d.type = :type', { type: type })
      .orderBy('d.date', 'DESC')
      .limit(1);

    const detection = await query.getOne();

    if (!detection)
      throw new NotFoundException(`There arent't detections for ${type}`);

    return {
      detection: {
        value: detection.value,
        type: detection.type,
        date: detection.date,
      },
    };
  }

  async postMedicalDetection(user: UserItem, dto: MedicalDetectionDTO) {
    if (!user.patient) {
      throw new UnauthorizedException();
    }

    if (!dto) throw new BadRequestException();

    const detection = this.medicalDetectionRepository.create({
      patient: user.patient,
      type: dto.type,
      value: dto.value,
      date: dto.date,
    });

    await this.medicalDetectionRepository.save(detection);

    return {
      message: 'Detection saved correctly',
    };
  }
}
