import { HttpException, UsePipes, ValidationPipe } from '@nestjs/common';
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
import { DeleteMessageGatewayDto } from '../message/dto/delete-message-gateway.dto';
import { SendMessageDto } from '../message/dto/send-message.dto';
import { UpdateMessageGatewayDto } from '../message/dto/update-message-gateway.dto';
import { MessageService } from '../message/message.service';
import { TokenService } from '../token/token.service';
import { ChatService } from './chat.service';

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => {
      const formattedErrors = errors.map((err) => ({
        property: err.property,
        target: err.target,
        messages: err.constraints ? Object.values(err.constraints) : [],
      }));

      return new WsException({
        errorCode: 400,
        errors: formattedErrors,
      });
    },
  }),
)
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
    @MessageBody() payload: SendMessageDto,
  ) {
    const { id } = await this.getUserFromWs(client);
    const { chatId, ...dto } = payload;

    try {
      const message = await this.messageService.create(id, chatId, dto);

      this.server.to(`chat-${chatId}`).emit('chatCreatedMessage', message);
    } catch (e) {
      if (e instanceof HttpException) throw new WsException(e.message);
    }
  }

  @SubscribeMessage('updateMessage')
  async handleUpdatingMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: UpdateMessageGatewayDto,
  ) {
    const { chatId, ...dto } = payload;
    const user = await this.getUserFromWs(client);

    try {
      const message = await this.messageService.update(user, chatId, dto);
      this.server.to(`chat-${chatId}`).emit('chatUpdatedMessage', message);
    } catch (e) {
      if (e instanceof HttpException) throw new WsException(e.message);
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeletingMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: DeleteMessageGatewayDto,
  ) {
    const { chatId, messageId } = payload;
    const user = await this.getUserFromWs(client);

    try {
      const message = await this.messageService.delete(user, messageId);

      this.server.to(`chat-${chatId}`).emit('chatDeletedMessage', message);
    } catch (e) {
      if (e instanceof HttpException) throw new WsException(e.message);
    }
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

    if (!tokenPayload.isVerified)
      throw new WsException('Forbidden resource. Please verify your account');

    return tokenPayload;
  }

  private async isUserInChat(client: Socket, chatId: number) {
    const user = await this.getUserFromWs(client);

    const users = await this.chatService.getUserIdsInChat(chatId);
    if (users.length === 0) throw new WsException('Chat not found');

    const userInChat = users.some((u) => u.userId === user.id);
    if (!userInChat) throw new WsException("You isn't participant of chat");
  }
}
