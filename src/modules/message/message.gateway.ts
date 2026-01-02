import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AccessTokenPayload } from '../../common/interfaces';
import { TokenService } from '../token/token.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';

@WebSocketGateway()
export class MessageGateway {
  constructor(
    private readonly messageService: MessageService,
    private readonly tokenService: TokenService,
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() chatId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`chat-${chatId}`);
  }

  @SubscribeMessage('createMessage')
  async handleCreatingMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateMessageDto & { chatId: number },
  ) {
    const { chatId, ...dto } = payload;
    const { id } = await this.getUserFromWs(client);

    const message = await this.messageService.create(id, chatId, dto);

    this.server.to(`chat-${chatId}`).emit('chatCreatedMessage', message);
  }

  @SubscribeMessage('updateMessage')
  async handleUpdatingMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpdateMessageDto & { chatId: number },
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
    const user = await this.getUserFromWs(client);

    const { chatId, messageId } = payload;

    const message = await this.messageService.delete(user, messageId);

    this.server.to(`chat-${chatId}`).emit('chatDeletedMessage', message);
  }

  private async getUserFromWs(client: Socket): Promise<AccessTokenPayload> {
    const accessToken = client.handshake.headers.cookie
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('accessToken='))
      .split('=')[1];

    return await this.tokenService.verifyAccessToken(accessToken);
  }
}
