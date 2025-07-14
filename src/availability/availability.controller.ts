import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseDatePipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserItem } from 'src/common/types/userItem';
import { GetUser } from 'src/auth/get-user-decorator';
import { UserRoles } from 'src/common/enum/roles.enum';
import { IsUUID } from 'class-validator';

@Controller('doctor/availability')
@UseGuards(RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async createAvailability(
    @Body() body: CreateAvailabilityDto,
    @GetUser() user: UserItem,
  ) {
    const doctor = this.getDoctorOrThrow(user);
    return this.availabilityService.createAvailability(body, doctor.userId);
  }

  @Get()
  @Roles(UserRoles.DOCTOR, UserRoles.ADMIN)
  async getAvailabilities(
    @GetUser() user: UserItem,
    @Query('start', new ParseDatePipe()) start: Date,
    @Query('end', new ParseDatePipe()) end: Date,
  ) {
    const doctor = this.getDoctorOrThrow(user);
    return this.availabilityService.getAvailabilities(doctor, start, end);
  }

  @Delete(':id')
  @Roles(UserRoles.DOCTOR)
  async deleteAvailability(@GetUser() user: UserItem, @Param('id') id: string) {
    return this.availabilityService.deleteAvailability(user, id);
  }

  // PRIVATE

  private getDoctorOrThrow(user: UserItem) {
    if (!user.doctor) {
      throw new UnauthorizedException(
        'You must be a doctor to perform this action',
      );
    }
    return user.doctor;
  }
}
