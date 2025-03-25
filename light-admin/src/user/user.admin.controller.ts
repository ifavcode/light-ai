import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { QueryUserDto } from './dto/query-user.dto';
import R from 'src/common/R';
import { Roles } from 'src/common/metadata';
import { RoleConstant } from 'src/config/constant';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user/admin')
export class UserAdminController {
  constructor(private readonly userService: UserService) {}

  @Get('page')
  @Roles(RoleConstant.Admin)
  async page(
    @Query()
    queryUserDto: QueryUserDto,
  ) {
    return R.okD(await this.userService.findAll(queryUserDto));
  }

  @Post('update/:id')
  @Roles(RoleConstant.Admin)
  async update(
    @Param('id')
    id: number,
    @Body()
    updateUserDto: UpdateUserDto,
  ) {
    return R.okD(await this.userService.update(id, updateUserDto));
  }

  @Post('delete/:id')
  @Roles(RoleConstant.Admin)
  async delete(
    @Param('id')
    id: string,
  ) {
    const ids = id.split(',').map((v) => parseInt(v));
    return R.okD(await this.userService.delete(ids));
  }

  @Get('record/page')
  @Roles(RoleConstant.Admin)
  async recordPage(
    @Query()
    queryUserDto: QueryUserDto,
  ) {
    return R.okD(await this.userService.findRecordAll(queryUserDto));
  }
}
