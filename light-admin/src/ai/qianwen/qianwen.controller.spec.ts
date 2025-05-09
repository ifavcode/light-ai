import { Test, TestingModule } from '@nestjs/testing';
import { QianwenController } from './qianwen.controller';
import { QianwenService } from './qianwen.service';

describe('QianwenController', () => {
  let controller: QianwenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QianwenController],
      providers: [QianwenService],
    }).compile();

    controller = module.get<QianwenController>(QianwenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
