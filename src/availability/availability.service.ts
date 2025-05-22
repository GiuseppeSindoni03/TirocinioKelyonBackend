import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { Doctor } from 'src/doctor/doctor.entity';
import { GroupedAvailabilities } from 'src/availability/types/grouped-availabilities';
import { endOfDay, format, isBefore, startOfDay } from 'date-fns';
import { AvailabilitySlotDto } from './dto/availability-slot.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async createAvailability(
    createAvailability: CreateAvailabilityDto,
    doctorId: string,
  ): Promise<Availability> {
    const doctor = await this.findDoctorOrThrow(doctorId);

    const { startTime, endTime } =
      this.validateAndParseDates(createAvailability);

    await this.checkNoOverlappingSlots(doctor.userId, startTime, endTime);

    const availability = this.availabilityRepository.create({
      startTime,
      endTime,
      doctor,
    });

    return this.availabilityRepository.save(availability);
  }

  async getAvailabilities(doctor: Doctor): Promise<GroupedAvailabilities[]> {
    const allSlots = await this.availabilityRepository.find({
      where: { doctor },
      order: { startTime: 'ASC' },
    });

    const grouped = allSlots.reduce(
      (acc, slot) => {
        const dateKey = format(slot.startTime, 'yyyy-MM-dd'); // giorno come chiave

        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }

        acc[dateKey].push({
          id: slot.id,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
        });

        return acc;
      },
      {} as Record<string, AvailabilitySlotDto[]>,
    );

    return Object.entries(grouped).map(([date, slots]) => ({
      date,
      slots,
    }));
  }

  async getAvailabiltiesByDate(
    doctor: Doctor,
    date: string,
  ): Promise<Availability[]> {
    const start = startOfDay(new Date(date));
    const end = endOfDay(new Date(date));

    return this.availabilityRepository
      .createQueryBuilder('a')
      .where('a.doctorId = :doctorId', { doctorId: doctor.userId })
      .andWhere('a.startTime BETWEEN :start AND :end', { start, end })
      .orderBy('a.startTime', 'ASC')
      .getMany();
  }

  private async findDoctorOrThrow(doctorId: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { userId: doctorId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  private async checkNoOverlappingSlots(
    userId: string,
    startTime: Date,
    endTime: Date,
  ) {
    const overlappingSlot = await this.availabilityRepository
      .createQueryBuilder('a')
      .where('a.doctor.userId = :doctorId', { doctorId: userId })
      .andWhere('a.startTime < :end')
      .andWhere('a.endTime > :start')
      .setParameters({
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      })
      .getOne();

    if (overlappingSlot) {
      throw new ConflictException(
        'Time slot overlaps with an existing reservation.',
      );
    }
  }

  private validateAndParseDates(dto: CreateAvailabilityDto): {
    startTime: Date;
    endTime: Date;
  } {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }

    if (!isBefore(start, end)) {
      throw new BadRequestException('Start time must be before end time');
    }

    return {
      startTime: start,
      endTime: end,
    };
  }
}
