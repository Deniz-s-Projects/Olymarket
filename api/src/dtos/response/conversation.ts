import { Conversation } from "../../entities/Conversation";
import { ConversationParticipant } from "../../entities/ConversationParticipant";
import { Message } from "../../entities/Message";
import { PublicUserDto, mapUserToPublicDto } from "./user";

export type ConversationParticipantDto = {
  id: string;
  user: PublicUserDto;
  lastReadAt: string | null;
};

export type ConversationDto = {
  id: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipantDto[];
  unreadCount: number;
};

export type MessageDto = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  sender: PublicUserDto;
};

export const mapConversationParticipantToDto = (
  participant: ConversationParticipant,
): ConversationParticipantDto => ({
  id: participant.id,
  user: mapUserToPublicDto(participant.user),
  lastReadAt: participant.lastReadAt ? participant.lastReadAt.toISOString() : null,
});

export const mapConversationToDto = (
  conversation: Conversation,
  unreadCount = 0,
): ConversationDto => ({
  id: conversation.id,
  topic: conversation.topic,
  createdAt: conversation.createdAt.toISOString(),
  updatedAt: conversation.updatedAt.toISOString(),
  participants: conversation.participants.map(mapConversationParticipantToDto),
  unreadCount,
});

export const mapMessageToDto = (message: Message): MessageDto => ({
  id: message.id,
  body: message.body,
  createdAt: message.createdAt.toISOString(),
  updatedAt: message.updatedAt.toISOString(),
  sender: mapUserToPublicDto(message.sender),
});
