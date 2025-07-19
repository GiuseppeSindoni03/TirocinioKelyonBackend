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
import {
  MedicalDetectionDTO,
  MedicalDetectionQueryFilter,
} from './medical-detection.controller';
import { date } from 'joi';

@Injectable()
export class MedicalDetectionService {
  public constructor(
    @InjectRepository(MedicalDetection)
    private readonly medicalDetectionRepository: Repository<MedicalDetection>,
  ) {}

  async getMedicalDetections(
    user: UserItem,
    type: MedicalDetectionQueryFilter,
    startDate?: string,
    endDate?: string,
  ) {
    if (!user.patient) throw new UnauthorizedException();

    const query = this.medicalDetectionRepository
      .createQueryBuilder('d')
      .where('d.patientId = :id', { id: user.patient.id });

    if (type !== MedicalDetectionQueryFilter.ALL) {
      query.andWhere('d.type = :type', { type: type });
    }

    if (startDate) {
      query.andWhere('d.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('d.date <= :endDate', { endDate });
    }

    query.orderBy('d.date', 'DESC');

    const [detections, total] = await query.getManyAndCount();

    if (total === 0)
      throw new NotFoundException(`There arent't detections for ${type}`);

    return {
      total: total,
      detections: detections.map((d, index) => {
        return {
          value: d.value,
          type: d.type,
          date: d.date,
        };
      }),
    };
  }

  async getLastDetection(user: UserItem, type: MedicalDetectionType) {
    if (!user.patient) throw new UnauthorizedException();

    const query = this.medicalDetectionRepository
      .createQueryBuilder('d')
      .where('d.patientId = :id', { id: user.patient.id })
      .andWhere('d.type = :type', { type: type })
      .orderBy('d.date', 'ASC')
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
      date: new Date(),
    });

    await this.medicalDetectionRepository.save(detection);

    return {
      message: 'Detection saved correctly',
    };
  }
}
