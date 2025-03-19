import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Request,
  Query,
} from '@nestjs/common';
import { DialogGroupService } from './dialog-group.service';
import { CreateDialogGroupDto } from './dto/create-dialog-group.dto';
import { UpdateDialogGroupDto } from './dto/update-dialog-group.dto';
import R from 'src/common/R';
import { Page } from 'src/common/Page';

@Controller('qianwenDialogGroup')
export class DialogGroupController {
  constructor(private readonly dialogGroupService: DialogGroupService) {}

  @Post()
  async create(
    @Body() createDialogGroupDto: CreateDialogGroupDto,
    @Req() req: any,
  ) {
    createDialogGroupDto.user = req.user;
    createDialogGroupDto.createTime = new Date();
    return R.okD(await this.dialogGroupService.create(createDialogGroupDto));
  }

  @Get('normal')
  async findAll(@Req() req: any, @Query() page: Page) {
    return R.okD(await this.dialogGroupService.findAll(req.user.id, page));
  }

  // 查找集成AI组
  @Get('more')
  async findMoreAll(@Req() req: any, @Query() page: Page) {
    return R.okD(await this.dialogGroupService.findMoreAll(req.user.id, page));
  }

  @Get('userId/:id')
  async findOneByUserId(@Param('id') id: string) {
    return R.okD(await this.dialogGroupService.findOne(+id));
  }

  @Get('id/:id')
  async findOne(@Param('id') id: string) {
    return R.okD(await this.dialogGroupService.findOneById(+id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDialogGroupDto: UpdateDialogGroupDto,
  ) {
    return this.dialogGroupService.update(+id, updateDialogGroupDto);
  }

  @Delete('id/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.dialogGroupService.remove(+id, req.user);
  }
}
