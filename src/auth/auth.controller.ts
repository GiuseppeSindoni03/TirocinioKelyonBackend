import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthService } from './auth.service';
import { DoctorRegisterDto } from './dto/doctor-register.dto';

import { DeviceInfo } from './utils/deviceInfo';
import { Request, Response } from 'express';

import { BaseUserInterceptor } from 'src/transform.interceptor';
import { UserItem } from 'src/common/types/userItem';
import { GetUser } from './decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/check/email/:email')
  async checkEmailExists(@Param('email') email: string) {
    return this.authService.checkEmailExists(email);
  }

  @Get('/check/phone/:phone')
  async checkPhoneExists(@Param('phone') phone: string) {
    return this.authService.checkPhoneExist(phone);
  }

  @Get('/check/cf/:cf')
  async checkCfExists(@Param('cf') cf: string) {
    return this.authService.checkCfExist(cf);
  }

  @UseInterceptors(BaseUserInterceptor)
  @Post('/signup')
  async signUp(
    @Body() authCredentialsDto: DoctorRegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserItem> {
    const { accessToken, refreshToken, user } = await this.authService.signUp(
      authCredentialsDto,
      this.getDeviceInfo(req),
    );
    res
      .cookie('jwt', accessToken, {
        httpOnly: true,
        secure: true, // ✅ false in sviluppo (HTTP)
        sameSite: 'none', // ✅ 'none' per cross-origin
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // ✅ false in sviluppo (HTTP)
        sameSite: 'none', // ✅ 'none' per cross-origin
      });

    return user;
  }

  @UseInterceptors(BaseUserInterceptor)
  @Post('/signin')
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserItem> {
    const { accessToken, refreshToken, user } = await this.authService.signIn(
      authCredentialsDto,
      this.getDeviceInfo(req),
    );

    console.log('REQ Cookies: ', req.cookies);

    res
      .cookie('jwt', accessToken, {
        httpOnly: true,
        secure: true, // ✅ false in sviluppo (HTTP)
        sameSite: 'none', // ✅ 'none' per cross-origin
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // ✅ false in sviluppo (HTTP)
        sameSite: 'none', // ✅ 'none' per cross-origin
      });

    return user;
  }

  @Post('/logout')
  async logout(@GetUser() user, @Req() req: Request, @Res() res: Response) {
    console.log('Utente che sta facendo il logout:', user);

    console.log('Req Cookie: ', req.cookies);

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    res.clearCookie('jwt');
    res.clearCookie('refreshToken');

    await this.authService.logout(refreshToken);

    return res.status(200).send({ message: 'Logout success' }); // ✅ chiude la response!
  }

  private getDeviceInfo(req: Request): DeviceInfo {
    return {
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress:
        req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
        'Unknown',
    };
  }
}
