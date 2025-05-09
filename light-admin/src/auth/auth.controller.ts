import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import R from 'src/common/R';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/common/metadata';
import { Constant } from 'src/config/constant';
import { ChangePwdDTO } from './dto/chang-pwd.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(AuthGuard('local'))
  login(@Request() req: any) {
    const { accessToken } = this.authService.login(req.user);
    return R.okD(accessToken);
  }

  @Post('logout')
  logout(@Request() req: Request | any) {
    const token = req.headers[Constant.JWT_HEADER_NAME.toLowerCase()];
    this.authService.logout(req.user, token);
    return R.okD();
  }

  @Post('changePwd')
  async changePwd(@Request() req: any, @Body() dto: ChangePwdDTO) {
    await this.authService.changePwd(req.user, dto);
    return R.okD('修改密码成功');
  }

  @Get('judgeChangePwd')
  async judgeChangePwd(@Request() req: any) {
    return R.okD(await this.authService.judgeChangePwd(req.user));
  }
}
