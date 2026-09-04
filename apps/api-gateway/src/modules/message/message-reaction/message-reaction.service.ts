import {
  AddReactionDto,
  ReactionResponse,
  UpdateReactionDto,
} from '@app/contracts/reaction/dto';
import { ReactionPattern } from '@app/contracts/reaction/pattern';
import { ReactionActionPayload } from '@app/contracts/reaction/payload';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CHAT_CLIENT } from '../../../common/client/chat/chat-client.constants';

@Injectable()
export class MessageReactionService {
  constructor(@Inject(CHAT_CLIENT) private readonly chatClient: ClientProxy) {}

  private async send<TOut, TIn>(
    pattern: ReactionPattern,
    input: TIn,
  ): Promise<TOut> {
    return firstValueFrom(this.chatClient.send<TOut, TIn>(pattern, input));
  }

  async addReaction(userId: number, messageId: number, dto: AddReactionDto) {
    return this.send<ReactionResponse, ReactionActionPayload<AddReactionDto>>(
      ReactionPattern.ADD_REACTION,
      { userId, messageId, dto },
    );
  }

  async updateReaction(
    userId: number,
    messageId: number,
    dto: UpdateReactionDto,
  ) {
    return this.send<
      ReactionResponse,
      ReactionActionPayload<UpdateReactionDto>
    >(ReactionPattern.UPDATE_REACTION, { userId, messageId, dto });
  }

  async removeReaction(userId: number, messageId: number) {
    return this.send<ReactionResponse, ReactionActionPayload<null>>(
      ReactionPattern.DELETE_REACTION,
      { userId, messageId },
    );
  }
}
