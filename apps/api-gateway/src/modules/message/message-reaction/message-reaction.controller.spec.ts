import { Test, TestingModule } from '@nestjs/testing';
import { MessageReactionController } from './message-reaction.controller';

describe('MessageReactionController', () => {
  let controller: MessageReactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageReactionController],
    }).compile();

    controller = module.get<MessageReactionController>(MessageReactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
