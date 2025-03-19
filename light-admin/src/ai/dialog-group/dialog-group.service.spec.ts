import { Test, TestingModule } from '@nestjs/testing';
import { DialogGroupService } from './dialog-group.service';

describe('DialogGroupService', () => {
  let service: DialogGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DialogGroupService],
    }).compile();

    service = module.get<DialogGroupService>(DialogGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
