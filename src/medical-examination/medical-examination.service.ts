import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalExamination } from './medical-examination.entity';
import { In, Repository } from 'typeorm';
import { UserItem } from 'src/common/types/userItem';
import { Reservation } from 'src/reservation/reservation.entity';
import { MedicalExaminationDTO } from 'src/invite/dto/medical-examination.dto';
import { Doctor } from 'src/doctor/doctor.entity';
import { MedicalExaminationResponse } from './types/medical-examination-response.interface';
import { MedicalExaminationsResponse } from './types/medical-examinations-response.interface';

@Injectable()
export class MedicalExaminationService {
  constructor(
    @InjectRepository(MedicalExamination)
    private readonly medicalExaminationRepository: Repository<MedicalExamination>,

    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async addMedicalExamination(
    user: UserItem,
    reservationId: string,
    dto: MedicalExaminationDTO,
  ) {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['doctor', 'patient'],
    });

    if (!reservation) throw new NotFoundException();

    console.log('Reservation: ', reservation);

    const medicalExamination = this.medicalExaminationRepository.create({
      date: reservation.startDate,
      doctor: reservation.doctor,
      motivation: dto.motivation,
      note: dto.note,
      patient: reservation.patient,
      reservation: reservation,
    });

    console.log('MedicalExamination: ', medicalExamination);

    return this.medicalExaminationRepository.save(medicalExamination);
  }

  async getMedicalDetections(
    doctorId: string,
    patientId: string,
    limit: number,
    cursor?: string,
  ): Promise<MedicalExaminationsResponse> {
    await this.findDoctor(doctorId);

    const query = this.medicalExaminationRepository
      .createQueryBuilder('m')
      .where('m.patientId = :patientId', { patientId: patientId })
      .andWhere('m.doctorUserId = :doctorId', { doctorId: doctorId })
      .addOrderBy('m.date', 'DESC')
      .addOrderBy('m.id', 'DESC')

      .limit(limit + 1);

    if (cursor) {
      const cursorExamination = await this.medicalExaminationRepository.findOne(
        {
          where: { id: cursor },
        },
      );

      if (cursorExamination) {
        query.andWhere(
          '(m.date < :cursorDate OR (m.date = :cursorDate AND m.id < :cursorId))',
          {
            cursorDate: cursorExamination.date,
            cursorId: cursorExamination.id,
          },
        );
      }
    }

    const medicalExaminations = await query.getMany();

    const medicalExaminationsResponse: MedicalExaminationResponse[] =
      medicalExaminations.map((examination) => {
        return {
          id: examination.id,
          note: examination.note,
          motivation: examination.motivation,
          date: examination.date,
        };
      });

    const hasMore = medicalExaminationsResponse.length > limit;
    const results = hasMore
      ? medicalExaminationsResponse.slice(0, limit)
      : medicalExaminationsResponse;

    const nextCursor =
      hasMore && results.length > 0 ? results[results.length - 1].id : null;

    const response: MedicalExaminationsResponse = {
      data: results,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    };

    console.log('Response: ', response);

    return response;
  }

  private async findDoctor(doctorId: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: doctorId } },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    return doctor;
  }
}
