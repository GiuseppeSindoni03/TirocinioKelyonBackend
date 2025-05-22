import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserService } from './user.service';
import { GetUser } from 'src/auth/get-user-decorator';

@Controller('user')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  getMe(@GetUser() user, @Req() req) {
    // console.log(user);
    // console.log(req.user);

    // console.log('COOKIES:', req.cookies);
    // console.log('USER:', user);
    return this.userService.getMe(user.id);
  }
}
