import { HttpException, Inject, Injectable } from '@nestjs/common';
import { CreateDialogGroupDto } from './dto/create-dialog-group.dto';
import { UpdateDialogGroupDto } from './dto/update-dialog-group.dto';
import { Not, Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { DialogGroup } from './entities/dialog-group.entity';
import { Page } from 'src/common/Page';

@Injectable()
export class DialogGroupService {
  constructor(
    @Inject('DIALOG_REPOSITORY')
    private readonly dialogRepository: Repository<DialogGroup>,
    private readonly userService: UserService,
  ) { }

  create(createDialogGroupDto: CreateDialogGroupDto) {
    return this.dialogRepository.save(createDialogGroupDto);
  }

  findAll(userId: number, page: Page) {
    return this.dialogRepository.find({
      where: {
        user: {
          id: userId,
        },
        aiModelType: Not('more')
      },
      take: page.pageSize,
      skip: (page.pageNum - 1) * page.pageSize,
      order: {
        createTime: 'DESC',
      },
    });
  }

  findMoreAll(userId: number, page: Page) {
    return this.dialogRepository.find({
      where: {
        user: {
          id: userId,
        },
        aiModelType: 'more'
      },
      take: page.pageSize,
      skip: (page.pageNum - 1) * page.pageSize,
      order: {
        createTime: 'DESC',
      },
    });
  }

  findOne(userId: number) {
    return this.dialogRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        dialogs: true,
      },
    });
  }

  findOneById(id: number) {
    return this.dialogRepository.findOne({
      where: {
        id,
      },
      relations: {
        dialogs: true,
      },
    });
  }

  update(id: number, updateDialogGroupDto: UpdateDialogGroupDto) {
    return `This action updates a #${id} dialogGroup`;
  }

  async remove(id: number, user: User) {
    const obj = await this.dialogRepository.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
      },
    });
    if (!obj) {
      throw new HttpException(`未找到id=${id}`, 500);
    }
    if (obj.user.id != user.id) {
      throw new HttpException(`id=${id}不属于你`, 500);
    }
    return this.dialogRepository.remove(obj);
  }
}
