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
import { AccessTokenPayload } from '../../common/types';
import { WsCreateMessageDto } from '../message/dto/ws-create-message.dto';
import { WsDeleteMessageDto } from '../message/dto/ws-delete-message.dto';
import { WsUpdateMessageDto } from '../message/dto/ws-update-message.dto';
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

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() payload: { chatId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = await this.getUserFromWs(client);

    try {
      await this.chatService.validateChatParticipation(user, payload.chatId);
      client.join(`chat-${payload.chatId}`);
    } catch (e) {
      if (e instanceof HttpException) throw new WsException(e.message);
    }
  }

  @SubscribeMessage('createMessage')
  async handleCreatingMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WsCreateMessageDto,
  ) {
    const { id } = await this.getUserFromWs(client);
    const { chatId, fileIds, ...dto } = payload;

    try {
      const message = await this.messageService.createFromWs(
        id,
        chatId,
        dto,
        fileIds,
      );

      this.server.to(`chat-${chatId}`).emit('chatCreatedMessage', message);
    } catch (e) {
      if (e instanceof HttpException) throw new WsException(e.message);
    }
  }

  @SubscribeMessage('updateMessage')
  async handleUpdatingMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: WsUpdateMessageDto,
  ) {
    const { chatId, fileIds, messageId, ...dto } = payload;
    const user = await this.getUserFromWs(client);

    try {
      const message = await this.messageService.updateFromWs(
        user,
        messageId,
        dto,
        fileIds,
      );

      this.server.to(`chat-${chatId}`).emit('chatUpdatedMessage', message);
    } catch (e) {
      if (e instanceof HttpException) throw new WsException(e.message);
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeletingMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: WsDeleteMessageDto,
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

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() chatId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const user = await this.getUserFromWs(client);
    await this.chatService.validateChatParticipation(user, chatId);

    client.leave(`chat-${chatId}`);
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

    client.data = tokenPayload;

    return tokenPayload;
  }
}
