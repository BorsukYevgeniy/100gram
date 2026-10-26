import { Injectable } from '@nestjs/common';
import { Reaction } from '../../../../generated/prisma/enums';
import {
  MessageFiles,
  MessageFilesReactionCount,
} from '../types/message.types';

@Injectable()
export class MessageMapperService {
  toMessageFilesReactionCount(
    messages: MessageFiles[],
    reactions: {
      messageId: number;
      reaction: Reaction;
      _count: { _all: number };
    }[],
    myReactions: { messageId: number; reaction: Reaction }[],
    deletedMessageIds: number[],
  ): MessageFilesReactionCount[] {
    const reactionCounts = new Map<number, Partial<Record<Reaction, number>>>();

    for (const r of reactions) {
      const counts = reactionCounts.get(r.messageId) ?? {};

      counts[r.reaction] = r._count._all;

      reactionCounts.set(r.messageId, counts);
    }

    /*
     *  Map of messageId to a partial record of reaction counts.
     *  For each reaction, we store the count of that reaction for the corresponding messageId.
     */

    const myReactionSet = new Set(
      myReactions.map((r) => `${r.messageId}:${r.reaction}`),
    );

    const deletedForMeSet = new Set(deletedMessageIds);

    return messages.map((m) => {
      const counts = reactionCounts.get(m.id) ?? {};

      return {
        ...m,
        isDeletedForMe: deletedForMeSet.has(m.id),
        reactions: {
          like: {
            count: counts[Reaction.LIKE] ?? 0,
            isReactedByMe: myReactionSet.has(`${m.id}:${Reaction.LIKE}`),
          },
          dislike: {
            count: counts[Reaction.DISLIKE] ?? 0,
            isReactedByMe: myReactionSet.has(`${m.id}:${Reaction.DISLIKE}`),
          },
          heart: {
            count: counts[Reaction.HEART] ?? 0,
            isReactedByMe: myReactionSet.has(`${m.id}:${Reaction.HEART}`),
          },
          heartWithFire: {
            count: counts[Reaction.HEART_WITH_FIRE] ?? 0,
            isReactedByMe: myReactionSet.has(
              `${m.id}:${Reaction.HEART_WITH_FIRE}`,
            ),
          },
          fire: {
            count: counts[Reaction.FIRE] ?? 0,
            isReactedByMe: myReactionSet.has(`${m.id}:${Reaction.FIRE}`),
          },
        },
      };
    });
  }
}
