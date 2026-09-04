export const enum ChatPattern {
  GET_MY_CHATS = 'chats.getMyChats',
  CREATE_PRIVATE_CHAT = 'chats.createPrivateChat',
  CREATE_GROUP_CHAT = 'chats.createGroupChat',
  CREATE_CHANNEL = 'chats.createChannel',
  ADD_CHAT_BY_INVITE_TOKEN = 'chats.addChatByInviteToken',
  UPDATE_INVITE_TOKEN = 'chats.updateInviteToken',
  FIND_ONE = 'chats.findOne',
  UPDATE_OWNER = 'chats.updateOwner',
  UPDATE_GROUP_CHAT = 'chats.updateGroupChat',
  DELETE = 'chats.delete',
}
