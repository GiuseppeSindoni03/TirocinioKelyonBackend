import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InviteService } from './invite.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Invite } from './invite.entity';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { AcceptInviteDto } from '../invite/dto/accept-invite.dto';
import { GetUser } from 'src/auth/get-user-decorator';
import { UserItem } from 'src/common/types/userItem';
import { UserRoles } from 'src/common/enum/roles.enum';
import { plainToInstance } from 'class-transformer';
import { InviteResponseDto } from './dto/invite-response.dto';

@Controller('invite')
@UseGuards(RolesGuard)
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post('/create')
  @Roles(UserRoles.DOCTOR)
  async createInvite(
    @GetUser() user: UserItem,
    @Body() inviteDto: CreateInviteDto,
  ): Promise<{ patientId: string }> {
    console.log('CREAZIONE INVITO: ', inviteDto);
    return this.inviteService.createInvite(inviteDto, user.id);
  }

  @Post('/:id/accept')
  //@Roles(UserRoles.PATIENT)
  async acceptInvite(
    @Param('id', new ParseUUIDPipe()) inviteId: string,
    //@GetUser() user: UserItem,
    @Body() acceptInviteDto: AcceptInviteDto,
  ) {
    return this.inviteService.acceptInvite(
      acceptInviteDto,
      inviteId,
      //,user
    );
  }

  @Get('/:id')
  async getInvite(
    @Param('id', new ParseUUIDPipe())
    inviteId: string,
  ) {
    const invite = await this.inviteService.getInvite(inviteId);

    console.log('Invite Controller: ', invite);
    return plainToInstance(InviteResponseDto, invite, {
      excludeExtraneousValues: true,
    });
  }
}
