import { Test, TestingModule } from '@nestjs/testing';
import { BlockedUserController } from './blocked-users.controller';

describe('BlockedUsersController', () => {
  let controller: BlockedUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockedUserController],
    }).compile();

    controller = module.get<BlockedUserController>(BlockedUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
