import { HttpException, Inject, Injectable } from '@nestjs/common';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { Equal, MoreThan, Or, Repository } from 'typeorm';
import { AiTool } from './entities/tool.entity';
import { User } from 'src/user/entities/user.entity';
import { PicToVideo } from './entities/pic-to-video.entity';
import { createPicToVideoTask, getPicToVideoResult } from 'src/utils/request';
import { ConfigService } from '@nestjs/config';
import { UploadService } from '../../upload/upload.service';
import dayjs from 'dayjs';
import { Page } from 'src/common/Page';
import { VirtualCompany } from './entities/virtual-company.entity';
import { TaskStatusEnum } from 'src/types';
import { Client } from 'socket.io/dist/client';
import { Socket } from 'socket.io';

@Injectable()
export class ToolsService {
  constructor(
    @Inject('AI_TOOL_REPOSITORY')
    private readonly aiToolReposiotry: Repository<AiTool>,
    @Inject('PIC_TO_VIDEO_REPOSITORY')
    private readonly picToVideoReposiotry: Repository<PicToVideo>,
    private readonly configServer: ConfigService,
    private readonly uploadService: UploadService,
    @Inject('VIRTUAL_COMPANY_REPOSITORY')
    private virtualCompanyRepository: Repository<VirtualCompany>,
  ) { }

  create(createToolDto: CreateToolDto) {
    return 'This action adds a new tool';
  }

  findAll() {
    return this.aiToolReposiotry.find();
  }

  findOne(id: number) {
    return this.aiToolReposiotry.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
      },
      select: {
        user: {
          nickname: true,
          avatar: true,
        },
      },
    });
  }

  update(id: number, updateToolDto: UpdateToolDto) {
    return `This action updates a #${id} tool`;
  }

  remove(id: number) {
    return `This action removes a #${id} tool`;
  }

  async picToVideo(user: User, obj: PicToVideo) {
    const allow = this.picToVideoAllow(user);
    if (!allow) {
      throw new HttpException('请等待上一个任务执行完毕，或者手动取消', 500);
    }
    const res = await createPicToVideoTask(obj);
    const back = res?.data;
    obj.createTime = new Date();
    obj.user = user;
    if (!back) {
      return new HttpException('转化异常', 500);
    }
    obj.requestId = back.request_id;
    if (back.code) {
      this.picToVideoReposiotry.save(obj);
      return new HttpException(back.message, 500);
    }
    obj.taskId = back.output.task_id;
    this.picToVideoReposiotry.save(obj);
    return back.request_id;
  }

  async getPicToVideo(id: number, user: User) {
    const obj = await this.picToVideoReposiotry.findOne({
      where: {
        id,
        user: {
          id: user.id,
        },
      },
    });
    if (!obj) {
      throw new HttpException('未找到', 404);
    }
    const res = await getPicToVideoResult(obj.taskId);
    const back = res.data;
    if (!back) {
      throw new HttpException('请重试', 500);
    }
    obj.taskStatus = back.output.task_status
      ? back.output.task_status
      : obj.taskStatus;

    if (!back.usage) {
      await this.picToVideoReposiotry.save(obj);
    } else {
      obj.duration = back.usage.video_duration;
      const domain = this.configServer.get('ALIBABA_CLOUD_CUSTOM_DOMAIN');
      if (obj.rawVideoUrl === '') {
        obj.rawVideoUrl = back.output.video_url ? back.output.video_url : '';
      }
      if (obj.rawVideoUrl && domain && !obj.videoUrl.includes(domain)) {
        const result = await this.uploadService.uploadOSS(
          obj.rawVideoUrl,
          'mp4',
        );
        obj.videoUrl = result.url;
      }
      await this.picToVideoReposiotry.save(obj);
    }
    return obj;
  }

  async picToVideoAllow(user: User) {
    const count = await this.picToVideoReposiotry.count({
      where: {
        user: {
          id: user.id,
        },
        taskStatus: Or(Equal(''), Equal('PENDING')),
        createTime: MoreThan(dayjs().subtract(10, 'minutes').toDate()),
      },
    });
    return count === 0;
  }

  async getPicToVideoList(user: User, page: Page) {
    return this.picToVideoReposiotry.find({
      where: {
        user: {
          id: user.id,
        },
      },
      take: page.pageSize,
      skip: (page.pageNum - 1) * page.pageSize,
      order: {
        createTime: 'DESC',
      },
    });
  }

  async virtualCompoanyAllow(user: User) {
    const count = await this.virtualCompanyRepository.count({
      where: {
        user: {
          id: user.id,
        },
        taskStatus: Or(
          Equal(TaskStatusEnum.NULL),
          Equal(TaskStatusEnum.RUNNING),
        ),
        createTime: MoreThan(dayjs().subtract(60, 'minutes').toDate()),
      },
    });
    return count === 0;
  }

  async virtualCompoanyLast(user: User) {
    const obj = await this.virtualCompanyRepository.findOne({
      where: {
        user: {
          id: user.id,
        },
        taskStatus: Or(
          Equal(TaskStatusEnum.NULL),
          Equal(TaskStatusEnum.RUNNING),
        ),
        createTime: MoreThan(dayjs().subtract(60, 'minutes').toDate()),
      },
    });
    return obj;
  }

  async virtualCompoanyList(user: User, page: Page) {
    return await this.virtualCompanyRepository.find({
      relations: {
        user: true
      },
      where: {
        user: {
          id: user.id
        }
      },
      take: page.pageSize,
      skip: (page.pageNum - 1) * page.pageSize,
      order: {
        createTime: 'DESC',
      },
      select: {
        id: true,
        prompt: true,
        model: true,
        taskStatus: true,
        createTime: true,
        endTime: true,
        user: {
          nickname: true,
          avatar: true
        }
      }
    })
  }

  async virtualCompoanyListById(user: User, id: number) {
    console.log(id);
    
    return await this.virtualCompanyRepository.findOne({
      relations: {
        user: true
      },
      where: {
        user: {
          id: user.id
        },
        id
      },
      order: {
        createTime: 'DESC',
      }
    })
  }
}
