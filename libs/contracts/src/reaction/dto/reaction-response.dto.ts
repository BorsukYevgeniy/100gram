export class ReactionResponse {
  userId: number;
  createdAt: Date;
  reaction: 'LIKE' | 'DISLIKE' | 'FIRE' | 'HEART' | 'HEART_WITH_FIRE';
  messageId: number;
}
