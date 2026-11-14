import {
  AsyncApiChannel,
  AsyncApiMessage,
  AsyncApiPub,
  AsyncApiSub,
  type SchemaSource,
} from '@nest-native/asyncapi';
import { applyDecorators } from '@nestjs/common';
import { WsCreateMessageDto } from '../../../message/dto/ws/ws-create-message.dto';
import { WsDeleteMessageDto } from '../../../message/dto/ws/ws-delete-message.dto';
import { WsMessageFileResponseDto } from '../../../message/dto/ws/ws-message-file-response.dto';
import { WsUpdateMessageDto } from '../../../message/dto/ws/ws-update-message.dto';
import { WsAddReactionDto } from '../../../reaction/dto/ws/ws-add-reaction.dto';
import { WsReactionResponseDto } from '../../../reaction/dto/ws/ws-reaction-response.dto';
import { WsRemoveReactionDto } from '../../../reaction/dto/ws/ws-remove-reaction.dto';
import { WsUpdateReactionDto } from '../../../reaction/dto/ws/ws-update-reaction.dto';
import { CommonChatMemberDto } from '../../chat-member/dto/ws/common-chat-member.dto';
import {
  WsChatMemberChangeResponseDto,
  WsChatMemberResponseDto,
} from '../../chat-member/dto/ws/ws-chat-member-response.dto';
import { WsJoinLeaveChatDto } from '../../chat-member/dto/ws/ws-join-leave-chat.dto';
import { WsUpdateChatRoleDto } from '../../chat-member/dto/ws/ws-update-chat-role.dto';
import { WsRoomDto } from '../dto/ws-room.dto';

function receiveEvent(
  operationId: string,
  title: string,
  summary: string,
  description: string,
  payload: SchemaSource,
) {
  return applyDecorators(
    AsyncApiSub({ operationId, title, summary, description }),
    AsyncApiMessage(payload, {
      name: operationId,
      title,
      summary,
      description,
    }),
  );
}

function publishEvent(
  operationId: string,
  title: string,
  summary: string,
  description: string,
  payload: SchemaSource,
) {
  return applyDecorators(
    AsyncApiPub({ operationId, title, summary, description }),
    AsyncApiMessage(payload, {
      name: operationId,
      title,
      summary,
      description,
    }),
  );
}

export class ChatGatewayDocs {
  static Channel() {
    return AsyncApiChannel('chat', {
      address: '/',
      title: 'Chat gateway',
      summary: 'Socket.IO chat events',
      description:
        'Client-to-server and server-to-client events for chats and their messages.',
    });
  }

  static JoinRoom() {
    return receiveEvent(
      'joinRoom',
      'Join chat room',
      'Join a chat room',
      'Adds the client socket to the specified chat room.',
      WsRoomDto,
    );
  }

  static CreateMessage() {
    return receiveEvent(
      'createMessage',
      'Create message',
      'Create a new message',
      'Client sends a request to create a new message in the specified chat.',
      WsCreateMessageDto,
    );
  }

  static ChatCreatedMessage() {
    return publishEvent(
      'chatCreatedMessage',
      'Message created',
      'Broadcast created message',
      'The server broadcasts the newly created message to all participants of the chat.',
      WsMessageFileResponseDto,
    );
  }

  static UpdateMessage() {
    return receiveEvent(
      'updateMessage',
      'Update message',
      'Update a message',
      'Client sends a request to update a message in the specified chat.',
      WsUpdateMessageDto,
    );
  }

  static ChatUpdatedMessage() {
    return publishEvent(
      'chatUpdatedMessage',
      'Message updated',
      'Broadcast updated message',
      'The server broadcasts the newly updated message to all participants of the chat.',
      WsMessageFileResponseDto,
    );
  }

  static DeleteMessage() {
    return receiveEvent(
      'deleteMessage',
      'Delete message',
      'Delete a message',
      'Client sends a request to delete message in the specified chat.',
      WsDeleteMessageDto,
    );
  }

  static ChatDeletedMessage() {
    return publishEvent(
      'chatDeletedMessage',
      'Message deleted',
      'Broadcast deleted message',
      'The server broadcasts the newly deleted message to all participants of the chat.',
      WsMessageFileResponseDto,
    );
  }

  static LeaveRoom() {
    return receiveEvent(
      'leaveRoom',
      'Leave chat room',
      'Leave a chat room',
      'Removes the client socket from the specified chat room.',
      WsRoomDto,
    );
  }

  static AddReaction() {
    return receiveEvent(
      'addReaction',
      'Add message reaction',
      'Add a reaction to a message',
      'Adds the authenticated user’s reaction to a message in the specified chat.',
      WsAddReactionDto,
    );
  }

  static ChatAddedReaction() {
    return publishEvent(
      'chatAddedReaction',
      'Message reaction added',
      'Broadcast an added reaction',
      'Broadcasts the added reaction to sockets in the message chat room.',
      WsReactionResponseDto,
    );
  }

  static UpdateReaction() {
    return receiveEvent(
      'updateReaction',
      'Update message reaction',
      'Update a reaction to a message',
      'Updates the authenticated user’s reaction to a message in the specified chat.',
      WsUpdateReactionDto,
    );
  }

  static ChatUpdatedReaction() {
    return publishEvent(
      'chatUpdatedReaction',
      'Message reaction updated',
      'Broadcast an updated reaction',
      'Broadcasts the updated reaction to sockets in the message chat room.',
      WsReactionResponseDto,
    );
  }

  static DeleteReaction() {
    return receiveEvent(
      'deleteReaction',
      'Delete message reaction',
      'Remove a reaction from a message',
      'Removes the authenticated user’s reaction from a message in the specified chat.',
      WsRemoveReactionDto,
    );
  }

  static ChatDeletedReaction() {
    return publishEvent(
      'chatDeletedReaction',
      'Message reaction deleted',
      'Broadcast a deleted reaction',
      'Broadcasts the removed reaction to sockets in the message chat room.',
      WsReactionResponseDto,
    );
  }

  static AddUserToChat() {
    return receiveEvent(
      'addUserToChat',
      'Add a chat member',
      'Add a user to a group or channel',
      'Only the chat owner can add a user.',
      CommonChatMemberDto,
    );
  }

  static ChatAddedUser() {
    return publishEvent(
      'chatAddedUser',
      'Chat member added',
      'Broadcast an added chat member',
      'The server broadcasts the added member and the updated member count to the chat room.',
      WsChatMemberChangeResponseDto,
    );
  }

  static DeleteUserFromChat() {
    return receiveEvent(
      'deleteUserFromChat',
      'Remove a chat member',
      'Remove a user from a group or channel',
      'Only the chat owner can remove another user. The removed user’s connected sockets leave the chat room before the change is broadcast.',
      CommonChatMemberDto,
    );
  }

  static ChatRemovedUser() {
    return publishEvent(
      'chatRemovedUser',
      'Chat member removed',
      'Broadcast a removed chat member',
      'The server broadcasts the removed member and the updated member count to the remaining chat participants.',
      WsChatMemberChangeResponseDto,
    );
  }

  static UpdateChatRole() {
    return receiveEvent(
      'updateChatRole',
      'Update chat member role',
      'Change a member’s role',
      'Only the chat owner can change a participant’s role in a group or channel.',
      WsUpdateChatRoleDto,
    );
  }

  static ChatUpdatedChatRole() {
    return publishEvent(
      'chatUpdatedChatRole',
      'Chat member role updated',
      'Broadcast an updated member role',
      'The server broadcasts the updated chat membership record to the chat room.',
      WsChatMemberResponseDto,
    );
  }

  static LeaveChat() {
    return receiveEvent(
      'leaveChat',
      'Leave a chat',
      'Leave a group or channel',
      'The authenticated user leaves a group or channel, exits its room, and triggers a membership update for the remaining participants.',
      WsJoinLeaveChatDto,
    );
  }

  static ChatLeavedUser() {
    return publishEvent(
      'chatLeavedUser',
      'Chat member left',
      'Broadcast a member leaving a chat',
      'The server broadcasts the departed member and the updated member count to the remaining chat participants.',
      WsChatMemberChangeResponseDto,
    );
  }

  static JoinToChat() {
    return receiveEvent(
      'joinToChat',
      'Join a public chat',
      'Join a public group or channel',
      'The authenticated user joins a public group or channel, enters its room, and triggers a membership update.',
      WsJoinLeaveChatDto,
    );
  }

  static ChatJoinedUser() {
    return publishEvent(
      'chatJoinedUser',
      'Chat member joined',
      'Broadcast a member joining a chat',
      'The server broadcasts the joined member and the updated member count to participants in the chat room.',
      WsChatMemberChangeResponseDto,
    );
  }
}
