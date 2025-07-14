import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation } from './reservation.entity';
import { Repository } from 'typeorm';
import { ReservationStatus } from './types/reservation-status-enum'; // Adjust the path if necessary
import { Doctor } from 'src/doctor/doctor.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Patient } from 'src/patient/patient.entity';
import { Availability } from 'src/availability/availability.entity';
import { GetSlot } from './dto/get-slot.dto';
import { endOfDay, startOfDay } from 'date-fns';
import { TimeSlot } from './types/time-slot.interface';
import { OccupiedSlot } from './types/occupied-slot.interface';
import { VisitType } from './visit-type.entity';
import { VisitTypeEnum } from './types/visit-type.enum';
import { ReservationsDTO } from './types/reservation.dto';
import { UserItem } from 'src/common/types/userItem';
import { ReservationResponse } from './dto/reservation-response.dto';

@Injectable()
export class ReservationService {
  public constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,

    @InjectRepository(VisitType)
    private readonly visitTypeRepository: Repository<VisitType>,
  ) {}

  async isFirstVisit(patient: Patient) {
    const reservation = await this.reservationRepository.findOne({
      where: { patient: patient },
    });

    if (!reservation) return true;

    return false;
  }

  async getNextReservations(
    user: UserItem,
  ): Promise<ReservationResponse[] | null> {
    if (!user.patient) throw new UnauthorizedException();

    const reservations = await this.reservationRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.visitType', 'visitType')
      .where('r.patientId = :id', { id: user.patient.id })
      .andWhere('r.startDate > :now', { now: new Date() })
      .andWhere('r.status = :confirmed', {
        confirmed: ReservationStatus.CONFIRMED,
      })
      .orderBy('r.startDate', 'ASC')
      .getMany();

    console.log('Reservation: ', reservations);

    // if (!reservation) return null;

    if (!reservations)
      throw new NotFoundException('Nessuna prenotazione trovata!');

    const reservationsResponse: ReservationResponse[] = reservations.map(
      (r) => {
        return {
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          endTime: r.endDate.toISOString(),
          startTime: r.startDate.toISOString(),
          visitType: r.visitType.name,
          status: r.status,
        };
      },
    );

    return reservationsResponse;
  }

  async getHowManyPendingReservations(
    doctor: Doctor,
  ): Promise<{ total: number }> {
    const count = await this.reservationRepository.count({
      where: {
        doctor: doctor,
        status: ReservationStatus.PENDING,
      },
    });

    return { total: count };
  }

  async getPastReservationsPatient(
    doctor: Doctor,
    status: string,
    patient: Patient,
  ): Promise<ReservationResponse[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = this.reservationRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.visitType', 'visitType')
      .where('r.doctorUserId = :doctor', { doctor: doctor.userId })
      .andWhere('r.patientId = :patientId', { patientId: patient.id });
    // .andWhere('r.startDate <= :now', { now: today });

    const normalizedStatus = status?.toUpperCase?.();

    console.log('Status: ', status);
    console.log(normalizedStatus === ReservationStatus.PENDING);

    if (normalizedStatus === ReservationStatus.CONFIRMED) {
      query.andWhere('r.status = :status', {
        status: ReservationStatus.CONFIRMED,
      });
    } else if (normalizedStatus === ReservationStatus.PENDING) {
      query.andWhere('r.status = :status', {
        status: ReservationStatus.PENDING,
      });
    } else if (normalizedStatus === ReservationStatus.DECLINED) {
      query.andWhere('r.status = :status', {
        status: ReservationStatus.DECLINED,
      });
    } else if (normalizedStatus === ReservationStatus.ALL) {
      query.andWhere('r.status != :status', {
        status: ReservationStatus.DECLINED,
      });
    }

    const reservations = await query.orderBy('r.startDate', 'DESC').getMany();

    console.log('Prenotazioni: ', reservations);

    return reservations.map((reservation) => ({
      id: reservation.id,
      startTime: reservation.startDate.toISOString(),
      endTime: reservation.endDate.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
      status: reservation.status,
      visitType: reservation.visitType.name,
    }));
  }

  async getReservations(
    doctor: Doctor,
    status: string,
    start: Date,
    end: Date,
  ): Promise<{ date: string; reservations: ReservationsDTO[] }[]> {
    const query = this.reservationRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('r.visitType', 'visitType')
      .where('r.doctorUserId = :doctor', { doctor: doctor.userId });

    const normalizedStatus = status?.toUpperCase?.();

    if (normalizedStatus === ReservationStatus.CONFIRMED) {
      query.andWhere('r.status = :status', {
        status: ReservationStatus.CONFIRMED,
      });
    } else if (normalizedStatus === ReservationStatus.ALL) {
      query.andWhere('r.status != :status', {
        status: ReservationStatus.DECLINED,
      });
    } else {
      query.andWhere('r.status = :status', {
        status: ReservationStatus.PENDING,
      });
    }

    if (start && end) {
      query.andWhere('(r.startDate < :end AND r.endDate > :start)', {
        start,
        end,
      });
    }

    const reservations = await query.orderBy('r.startDate', 'DESC').getMany();

    const grouped: Record<string, ReservationsDTO[]> = {};

    reservations.forEach((reservation) => {
      const dateKey = reservation.startDate.toISOString().split('T')[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      const reservationDTO: ReservationsDTO = {
        id: reservation.id,
        startTime: reservation.startDate.toISOString(),
        endTime: reservation.endDate.toISOString(),
        createdAt: reservation.createdAt.toISOString(),
        status: reservation.status,
        visitType: reservation.visitType.name,
        patient: {
          name: reservation.patient.user!!.name,
          surname: reservation.patient.user!!.surname,
          id: reservation.patient.id,
          gender: reservation.patient.user!!.gender,
          cf: reservation.patient.user!!.cf,
        },
      };

      grouped[dateKey].push(reservationDTO);
    });

    return Object.entries(grouped).map(([date, reservations]) => ({
      date,
      reservations,
    }));
  }

  // RETURN ALL THE RESERVATIONS OF A SPECIFIC DATE
  async getReservationsByDay(
    doctorId: string,
    date: Date,
  ): Promise<Reservation[]> {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    return this.reservationRepository
      .createQueryBuilder('r')
      .where('r.doctorUserId = :doctorId', { doctorId })
      .andWhere('r.startDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('r.startDate', 'ASC')
      .getMany();
  }

  async createReservation(
    doctor: Doctor,
    patient: Patient,
    createReservationDto: CreateReservationDto,
  ) {
    console.log('CreateReservationDTO: ', createReservationDto);
    const { startTime, endTime, visitType } = createReservationDto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    await this.ensureSlotNotBooked(doctor, start);

    await this.findValidAvailabilityOrThrow(doctor, start, end);

    const visitTypeEntity = await this.findVisitTypeOrThrow(visitType);

    if (visitTypeEntity.name == VisitTypeEnum.FIRST_VISIT)
      await this.checkExistOtherVisits(doctor, patient);

    await this.checkVisitDuration(visitTypeEntity.durationMinutes, start, end);

    const reservation = this.reservationRepository.create({
      startDate: startTime,
      endDate: endTime,
      doctor,
      patient,
      status: ReservationStatus.PENDING,
      createdAt: new Date(),
      visitType: visitTypeEntity,
    });

    const savedReservation = await this.reservationRepository.save(reservation);

    console.log('Prenotazione creata con successo!', savedReservation);

    return {
      ...savedReservation,
      visitType: savedReservation.visitType.name, // Restituisci solo il nome
    };
  }

  async acceptReservation(reservationId: string, doctor: Doctor) {
    const reservation = await this.getPendingReservationById(
      doctor,
      reservationId,
    );

    if (!reservation)
      throw new BadRequestException("Reservation doesn't exist");

    reservation.doctor = doctor;

    await this.checkConflictReservation(reservation);

    reservation.status = ReservationStatus.CONFIRMED;

    return await this.reservationRepository.save(reservation);
  }

  async declineReservation(reservationId: string, doctor: Doctor) {
    const reservation = await this.getPendingReservationById(
      doctor,
      reservationId,
    );

    if (!reservation)
      throw new BadRequestException("Reservation doesn't exist");

    reservation.status = ReservationStatus.DECLINED;

    return await this.reservationRepository.save(reservation);
  }

  async getReservationSlots(
    doctor: Doctor,
    dateDto: string,
    visitType: VisitTypeEnum,
  ): Promise<TimeSlot[]> {
    const date = this.parseDateOrThrow(dateDto);

    const [availabilities, confirmedReservations, visitTypeEntity] =
      await Promise.all([
        this.getAvailabilitiesOrThrow(doctor.userId, date),
        this.findConfirmedReservations(doctor.userId, date),
        this.findVisitTypeOrThrow(visitType),
      ]);

    const occupiedSlots: OccupiedSlot[] = confirmedReservations.map((r) => ({
      startTime: r.startDate.getTime(),
      endTime: r.endDate.getTime(),
    }));

    const availableSlots: TimeSlot[] = [];

    for (const availability of availabilities) {
      const slots = this.generateSlotsWithinAvailability(
        availability.startTime,
        availability.endTime,
        visitTypeEntity.durationMinutes,
      );

      for (const slot of slots) {
        if (!this.isSlotOccupied(slot, occupiedSlots)) {
          availableSlots.push(slot);
        }
      }
    }

    return availableSlots;
  }

  // PRIVATE

  private async checkExistOtherVisits(doctor: Doctor, patient: Patient) {
    const reservation = await this.reservationRepository.findOne({
      where: {
        doctor: doctor,
        patient: patient,
      },
    });

    if (reservation) {
      console.log("This reservation can't be a first visit");
      throw new BadRequestException("This reservation can't be a first visit");
    }
  }

  private async checkConflictReservation(reservation: Reservation) {
    const overlappingReservations = await this.reservationRepository
      .createQueryBuilder('r')
      .where('r.doctorUserId = :doctorId', {
        doctorId: reservation.doctor.userId,
      })
      .andWhere('r.startDate < :end')
      .andWhere('r.endDate > :start')
      .setParameters({
        start: reservation.startDate,
        end: reservation.endDate,
      })
      .andWhere('r.status = :status', { status: ReservationStatus.CONFIRMED })

      .getOne();

    if (overlappingReservations)
      throw new ConflictException(
        'Impossible confirm that reservation, another confirmed reservation already exists',
      );
  }

  private async ensureSlotNotBooked(doctor: Doctor, startTime: Date) {
    const found = await this.reservationRepository.findOne({
      where: {
        doctor: doctor,
        startDate: startTime,
        status: ReservationStatus.CONFIRMED,
      },
    });

    if (found) {
      console.log("This slot has been booked' ", found);
      throw new ConflictException('This slot has been booked');
    }
  }

  private async findValidAvailabilityOrThrow(
    doctor: Doctor,
    startTime: Date,
    endTime: Date,
  ) {
    startTime.setMilliseconds(0);
    endTime.setMilliseconds(0);

    const start = startOfDay(new Date(startTime));
    const end = endOfDay(new Date(startTime));

    const availabilities = await this.availabilityRepository
      .createQueryBuilder('a')
      .where('a.doctorUserId = :doctorId', { doctorId: doctor.userId })
      .andWhere('a.startTime BETWEEN :start AND :end', { start, end })
      .orderBy('a.startTime', 'ASC')
      .getMany();

    console.log('Disponibilita: ', availabilities);

    const validAvailability = await this.availabilityRepository
      .createQueryBuilder('a')
      .where('a.doctorUserId = :doctorId', { doctorId: doctor.userId })
      .andWhere('a.startTime <= :startTime', { startTime: startTime })
      .andWhere('a.endTime >= :endTime', { endTime: endTime })
      .getOne();

    console.log(validAvailability);

    if (!validAvailability) {
      console.log(
        'The reservation must be within an available time slot for the doctor.',
      );
      throw new BadRequestException(
        'The reservation must be within an available time slot for the doctor.',
      );
    }
  }

  private async getPendingReservationById(
    doctor: Doctor,
    reservationId: string,
  ) {
    return await this.reservationRepository
      .createQueryBuilder('r')
      .where('r.id = :reservationId', { reservationId })
      .andWhere('r.doctorUserId = :doctorId', { doctorId: doctor.userId })
      .andWhere('r.status = :reservationStatus', {
        reservationStatus: ReservationStatus.PENDING,
      })
      .getOne();
  }

  private async getAvailabilitiesOrThrow(doctorId: string, date: Date) {
    const availabilities = await this.availabilityRepository
      .createQueryBuilder('a')
      .where('a.doctorUserId = :doctorId', { doctorId: doctorId })
      .andWhere('DATE(a.startTime) = :date', { date })
      .orderBy('a.startTime')
      .getMany();

    // if (availabilities.length === 0) {
    //   throw new NotFoundException(`There aren t availability for ${date}`);
    // }

    return availabilities;
  }

  private parseDateOrThrow(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    return date;
  }

  private generateSlotsWithinAvailability(
    start: Date,
    end: Date,
    durationMinutes: number,
  ): { startTime: Date; endTime: Date }[] {
    const slots: TimeSlot[] = [];
    let slotStart = new Date(start);

    while (slotStart.getTime() + durationMinutes * 60000 <= end.getTime()) {
      slots.push({
        startTime: new Date(slotStart),
        endTime: new Date(slotStart.getTime() + durationMinutes * 60000),
      });
      slotStart = new Date(slotStart.getTime() + durationMinutes * 60000);
    }

    return slots;
  }

  private isSlotOccupied(
    slot: TimeSlot,
    occupiedSlots: OccupiedSlot[],
  ): boolean {
    return occupiedSlots.some(
      (res) =>
        slot.startTime.getTime() < res.endTime &&
        slot.endTime.getTime() > res.startTime,
    );
  }

  private async findVisitTypeOrThrow(visitType: VisitTypeEnum) {
    const visitTypeEntity = await this.visitTypeRepository.findOne({
      where: {
        name: visitType,
      },
    });

    if (!visitTypeEntity) {
      console.log(`The type of visit ${visitType} doesn't exist`);
      throw new BadRequestException(
        `The type of visit ${visitType} doesn't exist`,
      );
    }

    return visitTypeEntity;
  }

  private async checkVisitDuration(
    visitDuration: number,
    startTime: Date,
    endTime: Date,
  ) {
    const durationInMinutes =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (visitDuration !== durationInMinutes) {
      console.log(`The duration of slot doesn't match the type of visit`);
      throw new BadRequestException(
        `The duration of slot doesn't match the type of visit`,
      );
    }
  }

  private async findConfirmedReservations(doctorId: string, date: Date) {
    const confirmedReservations = (
      await this.getReservationsByDay(doctorId, date)
    ).filter((r) => r.status === ReservationStatus.CONFIRMED);

    return confirmedReservations;
  }
}
