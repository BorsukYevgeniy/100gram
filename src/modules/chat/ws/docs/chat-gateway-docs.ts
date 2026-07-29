import { applyDecorators } from '@nestjs/common';
import { AsyncApiReceive, AsyncApiSend } from 'nestjs-asyncapi';
import { WsCreateMessageDto } from '../../../message/dto/ws/ws-create-message.dto';
import { WsDeleteMessageDto } from '../../../message/dto/ws/ws-delete-message.dto';
import { WsMessageFileResponseDto } from '../../../message/dto/ws/ws-message-file-response.dto';
import { WsUpdateMessageDto } from '../../../message/dto/ws/ws-update-message.dto';
import { WsRoomDto } from '../dto/ws-room.dto';

export class ChatGatewayDocs {
  static JoinRoom() {
    return applyDecorators(
      AsyncApiReceive({
        channel: 'joinRoom',
        title: 'Join chat room',
        summary: 'Join a chat room',
        description: 'Adds the client socket to the specified chat room.',
        message: {
          payload: WsRoomDto,
        },
      }),
    );
  }

  static CreateMessage() {
    return applyDecorators(
      AsyncApiReceive({
        channel: 'createMessage',
        title: 'Create message',
        summary: 'Create a new message',
        description:
          'Client sends a request to create a new message in the specified chat.',
        message: {
          payload: WsCreateMessageDto,
        },
      }),
      AsyncApiSend({
        channel: 'chatCreatedMessage',
        title: 'Message created',
        summary: 'Broadcast created message',
        description:
          'The server broadcasts the newly created message to all participants of the chat.',
        message: {
          payload: WsMessageFileResponseDto,
        },
      }),
    );
  }

  static UpdateMessage() {
    return applyDecorators(
      AsyncApiReceive({
        channel: 'updateMessage',
        title: 'Update message',
        summary: 'Update a message',
        description:
          'Client sends a request to update a message in the specified chat.',
        message: {
          payload: WsUpdateMessageDto,
        },
      }),
      AsyncApiSend({
        channel: 'chatUpdatedMessage',
        title: 'Message updated',
        summary: 'Broadcast updated message',
        description:
          'The server broadcasts the newly updated message to all participants of the chat.',
        message: {
          payload: WsMessageFileResponseDto,
        },
      }),
    );
  }

  static DeleteMessage() {
    return applyDecorators(
      AsyncApiReceive({
        channel: 'deleteMessage',
        title: 'Delete message',
        summary: 'Delete a message',
        description:
          'Client sends a request to delete message in the specified chat.',
        message: {
          payload: WsDeleteMessageDto,
        },
      }),
      AsyncApiSend({
        channel: 'chatDeletedMessage',
        title: 'Message deleted',
        summary: 'Broadcast deleted message',
        description:
          'The server broadcasts the newly deleted message to all participants of the chat.',
        message: {
          payload: WsMessageFileResponseDto,
        },
      }),
    );
  }

  static LeaveRoom() {
    return applyDecorators(
      AsyncApiReceive({
        channel: 'leaveRoom',
        title: 'Leave chat room',
        summary: 'Leave a chat room',
        description: 'Removes the client socket from the specified chat room.',
        message: {
          payload: WsRoomDto,
        },
      }),
    );
  }
}
