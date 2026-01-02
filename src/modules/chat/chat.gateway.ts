import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AccessTokenPayload } from '../../common/interfaces';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { UpdateMessageDto } from '../message/dto/update-message.dto';
import { MessageService } from '../message/message.service';
import { TokenService } from '../token/token.service';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  cookie: true,
})
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly tokenService: TokenService,
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() payload: { chatId: number },
    @ConnectedSocket() client: Socket,
  ) {
    await this.isUserInChat(client, payload.chatId);
    client.join(`chat-${payload.chatId}`);
  }

  @SubscribeMessage('createMessage')
  async handleCreatingMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateMessageDto & { chatId: number },
  ) {
    const { id } = await this.getUserFromWs(client);
    const { chatId, ...dto } = payload;

    const message = await this.messageService.create(id, chatId, dto);

    this.server.to(`chat-${chatId}`).emit('chatCreatedMessage', message);
  }

  @SubscribeMessage('updateMessage')
  async handleUpdatingMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: UpdateMessageDto & { chatId: number; messageId: number },
  ) {
    const { chatId, ...dto } = payload;
    const user = await this.getUserFromWs(client);
    const message = await this.messageService.update(user, chatId, dto);

    this.server.to(`chat-${chatId}`).emit('chatUpdatedMessage', message);
  }

  @SubscribeMessage('deleteMessage')
  async handleDeletingMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { chatId: number; messageId: number },
  ) {
    const { chatId, messageId } = payload;
    const user = await this.getUserFromWs(client);
    const message = await this.messageService.delete(user, messageId);

    this.server.to(`chat-${chatId}`).emit('chatDeletedMessage', message);
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @MessageBody() chatId: number,
    @ConnectedSocket() client: Socket,
  ) {
    await this.isUserInChat(client, chatId);

    client.leave(`chat-${chatId}`);
  }

  async leaveChat(chatId: number, userId: number) {
    const sockets = await this.server.to(`chat-${chatId}`).fetchSockets();

    sockets
      .filter((s) => s.data.userId === userId)
      .forEach((s) => s.leave(`chat-${chatId}`));
  }

  private async getUserFromWs(client: Socket): Promise<AccessTokenPayload> {
    const cookie = client.handshake.headers.cookie;

    if (!cookie) throw new WsException('Unauthorized');

    const accessToken = cookie
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('access_token='))
      .split('=')[1];

    const tokenPayload = await this.tokenService.verifyAccessToken(accessToken);

    return tokenPayload;
  }

  private async isUserInChat(client: Socket, chatId: number) {
    const user = await this.getUserFromWs(client);

    const users = await this.chatService.getUserIdsInChat(chatId);
    const userInChat = users.some((u) => u.userId === user.id);

    if (!userInChat) throw new WsException("You isn't participant of chat");
  }
}
