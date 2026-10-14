import { applyDecorators } from '@nestjs/common';
import { AsyncApiReceive, AsyncApiSend } from 'nestjs-asyncapi';
import { WsCreateMessageDto } from '../../../message/dto/ws/ws-create-message.dto';
import { WsDeleteMessageDto } from '../../../message/dto/ws/ws-delete-message.dto';
import { WsMessageFileResponseDto } from '../../../message/dto/ws/ws-message-file-response.dto';
import { WsUpdateMessageDto } from '../../../message/dto/ws/ws-update-message.dto';
import { WsAddReactionDto } from '../../../reaction/dto/ws/ws-add-reaction.dto';
import { WsRemoveReactionDto } from '../../../reaction/dto/ws/ws-remove-reaction.dto';
import { WsReactionResponseDto } from '../../../reaction/dto/ws/ws-reaction-response.dto';
import { WsUpdateReactionDto } from '../../../reaction/dto/ws/ws-update-reaction.dto';
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

  static AddReaction() {
    return applyDecorators(
      AsyncApiReceive({
        channel: 'addReaction',
        title: 'Add message reaction',
        summary: 'Add a reaction to a message',
        description:
          'Adds the authenticated user’s reaction to a message in the specified chat.',
        message: { payload: WsAddReactionDto },
      }),
      AsyncApiSend({
        channel: 'chatAddedReaction',
        title: 'Message reaction added',
        summary: 'Broadcast an added reaction',
        description:
          'Broadcasts the added reaction to sockets in the message chat room.',
        message: { payload: WsReactionResponseDto },
      }),
    );
  }

  static UpdateReaction() {
    return applyDecorators(
      AsyncApiReceive({
        channel: 'updateReaction',
        title: 'Update message reaction',
        summary: 'Update a reaction to a message',
        description:
          'Updates the authenticated user’s reaction to a message in the specified chat.',
        message: { payload: WsUpdateReactionDto },
      }),
      AsyncApiSend({
        channel: 'chatUpdatedReaction',
        title: 'Message reaction updated',
        summary: 'Broadcast an updated reaction',
        description:
          'Broadcasts the updated reaction to sockets in the message chat room.',
        message: { payload: WsReactionResponseDto },
      }),
    );
  }

  static DeleteReaction() {
    return applyDecorators(
      AsyncApiReceive({
        channel: 'deleteReaction',
        title: 'Delete message reaction',
        summary: 'Remove a reaction from a message',
        description:
          'Removes the authenticated user’s reaction from a message in the specified chat.',
        message: { payload: WsRemoveReactionDto },
      }),
      AsyncApiSend({
        channel: 'chatDeletedReaction',
        title: 'Message reaction deleted',
        summary: 'Broadcast a deleted reaction',
        description:
          'Broadcasts the removed reaction to sockets in the message chat room.',
        message: { payload: WsReactionResponseDto },
      }),
    );
  }
}
