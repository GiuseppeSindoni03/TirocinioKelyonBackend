import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserService } from './user.service';
import { GetUser } from 'src/auth/get-user-decorator';
import { BaseUserInterceptor } from 'src/transform.interceptor';

@Controller('user')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(BaseUserInterceptor)
  @Get('/me')
  async getMe(@GetUser() user, @Req() req) {
    return this.userService.getMe(user.id);
  }
}
