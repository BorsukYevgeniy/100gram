export type ReactionType =
  | 'LIKE'
  | 'DISLIKE'
  | 'FIRE'
  | 'HEART'
  | 'HEART_WITH_FIRE';

export enum ReactionEnum {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE',
  FIRE = 'FIRE',
  HEART = 'HEART',
  HEART_WITH_FIRE = 'HEART_WITH_FIRE',
}

export type ReactionToMessage = {
  userId: number;
  createdAt: Date;
  reaction: ReactionType;
  messageId: number;
};
