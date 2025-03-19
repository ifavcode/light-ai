import { Test, TestingModule } from '@nestjs/testing';
import { QianwenService } from './qianwen.service';

describe('QianwenService', () => {
  let service: QianwenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QianwenService],
    }).compile();

    service = module.get<QianwenService>(QianwenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
