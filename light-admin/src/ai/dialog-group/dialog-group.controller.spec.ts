import { Test, TestingModule } from '@nestjs/testing';
import { DialogGroupController } from './dialog-group.controller';
import { DialogGroupService } from './dialog-group.service';

describe('DialogGroupController', () => {
  let controller: DialogGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DialogGroupController],
      providers: [DialogGroupService],
    }).compile();

    controller = module.get<DialogGroupController>(DialogGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
