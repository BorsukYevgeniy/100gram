import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AccessTokenPayload } from '../../../common/types';
import { WsCreateMessageDto } from '../../message/dto/ws/ws-create-message.dto';
import { WsDeleteMessageDto } from '../../message/dto/ws/ws-delete-message.dto';
import { WsUpdateMessageDto } from '../../message/dto/ws/ws-update-message.dto';
import { MessageService } from '../../message/message.service';
import { ChatValidationService } from '../validation/chat-validation.service';
import { WsCurrentUser } from './decorator/ws-user.decorator';
import { WsRoomDto } from './dto/ws-room.dto';
import { HttpToWsExceptionsFilter } from './exception-filter/ws-exception.filter';
import { WsVerifiedAuthGuard } from './guard/ws-verified-auth.guard';
import WsValidationPipe from './pipe/ws-validation.pipe';

import { ChatGatewayDocs } from './docs/chat-gateway-docs';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  cookie: true,
})
@UseGuards(WsVerifiedAuthGuard)
@UsePipes(WsValidationPipe)
@UseFilters(HttpToWsExceptionsFilter)
export class ChatGateway {
  constructor(
    private readonly chatValidator: ChatValidationService,
    private readonly messageService: MessageService,
  ) {}

  @WebSocketServer()
  server: Server;

  @ChatGatewayDocs.JoinRoom()
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() payload: { chatId: number },
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: AccessTokenPayload,
  ) {
    await this.chatValidator.validateChatParticipation(user, payload.chatId);
    client.join(`chat-${payload.chatId}`);
  }

  @ChatGatewayDocs.CreateMessage()
  @SubscribeMessage('createMessage')
  async handleCreatingMessage(
    @MessageBody() payload: WsCreateMessageDto,
    @WsCurrentUser() user: AccessTokenPayload,
  ) {
    const { chatId, fileIds, ...dto } = payload;

    const message = await this.messageService.createFromWs(
      user.id,
      chatId,
      dto,
      fileIds,
    );

    this.server.to(`chat-${chatId}`).emit('chatCreatedMessage', message);
  }

  @ChatGatewayDocs.UpdateMessage()
  @SubscribeMessage('updateMessage')
  async handleUpdatingMessage(
    @MessageBody()
    payload: WsUpdateMessageDto,
    @WsCurrentUser() user: AccessTokenPayload,
  ) {
    const { chatId, fileIds, messageId, ...dto } = payload;

    const message = await this.messageService.updateFromWs(
      user,
      messageId,
      dto,
      fileIds,
    );

    this.server.to(`chat-${chatId}`).emit('chatUpdatedMessage', message);
  }

  @ChatGatewayDocs.DeleteMessage()
  @SubscribeMessage('deleteMessage')
  async handleDeletingMessage(
    @MessageBody()
    { chatId, messageId }: WsDeleteMessageDto,
    @WsCurrentUser() user: AccessTokenPayload,
  ) {
    const message = await this.messageService.delete(user, messageId);

    this.server.to(`chat-${chatId}`).emit('chatDeletedMessage', message);
  }

  @ChatGatewayDocs.LeaveRoom()
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() { chatId }: WsRoomDto,
    @ConnectedSocket() client: Socket,
    @WsCurrentUser() user: AccessTokenPayload,
  ) {
    await this.chatValidator.validateChatParticipation(user, chatId);

    client.leave(`chat-${chatId}`);
  }
}
