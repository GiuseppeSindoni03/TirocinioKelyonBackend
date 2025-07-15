import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalExamination } from './medical-examination.entity';
import { Repository } from 'typeorm';
import { UserItem } from 'src/common/types/userItem';
import { Reservation } from 'src/reservation/reservation.entity';
import { MedicalExaminationDTO } from 'src/invite/dto/medical-examination.dto';

@Injectable()
export class MedicalExaminationService {
  constructor(
    @InjectRepository(MedicalExamination)
    private readonly medicalExaminationRepository: Repository<MedicalExamination>,

    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async addMedicalExamination(
    user: UserItem,
    reservationId: string,
    dto: MedicalExaminationDTO,
  ) {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
    });

    if (!reservation) throw new NotFoundException();

    const medicalExamination = this.medicalExaminationRepository.create({
      date: reservation.startDate,
      doctor: reservation.doctor,
      motivation: dto.motivation,
      note: dto.note,
      patient: reservation.patient,
      reservation: reservation,
    });

    return this.medicalExaminationRepository.save(medicalExamination);
  }
}
