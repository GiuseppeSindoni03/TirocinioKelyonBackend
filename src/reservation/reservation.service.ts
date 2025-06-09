import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
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

  async getReservations(
    doctor: Doctor,
  ): Promise<{ date: string; reservations: Reservation[] }[]> {
    const reservations = await this.reservationRepository
      .createQueryBuilder('r')
      .where({ doctor })
      .orderBy('r.startDate', 'ASC')
      .getMany();

    const grouped: Record<string, Reservation[]> = {};

    reservations.forEach((reservation) => {
      const dateKey = reservation.startDate.toISOString().split('T')[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(reservation);
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
      .where('r.doctorId = :doctorId', { doctorId })
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
    const { startTime, endTime, visitType } = createReservationDto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    await this.ensureSlotNotBooked(doctor, start);

    await this.findValidAvailabilityOrThrow(doctor, start, end);

    const visitTypeEntity = await this.findVisitTypeOrThrow(visitType);

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

    return this.reservationRepository.save(reservation);
  }

  async acceptReservation(reservationId: string, doctor: Doctor) {
    const reservation = await this.getPendingReservationById(
      doctor,
      reservationId,
    );

    if (!reservation)
      throw new BadRequestException("Reservation doesn't exist");

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

  private async ensureSlotNotBooked(doctor: Doctor, startTime: Date) {
    const found = await this.reservationRepository.findOne({
      where: {
        doctor: doctor,
        startDate: startTime,
        status: ReservationStatus.CONFIRMED,
      },
    });

    if (found) {
      throw new ConflictException('This slot has been booked');
    }
  }

  private async findValidAvailabilityOrThrow(
    doctor: Doctor,
    startTime: Date,
    endTime: Date,
  ) {
    const validAvailability = await this.availabilityRepository
      .createQueryBuilder('a')
      .where('a.doctorUserId = :doctorId', { doctorId: doctor.userId })
      .andWhere('a.startTime <= :startTime')
      .andWhere('a.endTime >= :endTime')
      .setParameters({ startTime, endTime })
      .getOne();

    console.log(validAvailability);

    if (!validAvailability) {
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
      .andWhere('r.doctorId = :doctorId', { doctorId: doctor.userId })
      .andWhere('r.status = :reservationStatus', {
        reservationStatus: ReservationStatus.PENDING,
      })
      .getOne();
  }

  private async getAvailabilitiesOrThrow(doctorId: string, date: Date) {
    const availabilities = await this.availabilityRepository
      .createQueryBuilder('a')
      .where('a.doctorId = :doctorId', { doctorId: doctorId })
      .andWhere('DATE(a.startTime) = :date', { date })
      .getMany();

    if (availabilities.length === 0) {
      throw new NotFoundException(`There aren t availability for ${date}`);
    }

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

    if (!visitTypeEntity)
      throw new BadRequestException(
        `The type of visit ${visitType} doesn't exist`,
      );

    return visitTypeEntity;
  }

  private async checkVisitDuration(
    visitDuration: number,
    startTime: Date,
    endTime: Date,
  ) {
    const durationInMinutes =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (visitDuration !== durationInMinutes)
      throw new BadRequestException(
        `The duration of slot doesn't match the type of visit`,
      );
  }

  private async findConfirmedReservations(doctorId: string, date: Date) {
    const confirmedReservations = (
      await this.getReservationsByDay(doctorId, date)
    ).filter((r) => r.status === ReservationStatus.CONFIRMED);

    return confirmedReservations;
  }
}
