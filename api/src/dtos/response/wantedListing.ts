import { WantedListing } from "../../entities/WantedListing";
import { Conversation } from "../../entities/Conversation";
import { ConversationParticipant } from "../../entities/ConversationParticipant";
import { PublicUserDto, mapUserToPublicDto } from "./user";

export type WantedListingCategoryDto = {
  id: string;
  name: string;
  slug: string;
};

export type WantedListingConversationParticipantDto = {
  id: string;
  user: PublicUserDto;
};

export type WantedListingConversationDto = {
  id: string;
  topic: string;
  participants?: WantedListingConversationParticipantDto[];
};

export type WantedListingResponseDto = {
  id: string;
  title: string;
  details: string | null;
  budget: string;
  status: WantedListing["status"];
  createdAt: string;
  updatedAt: string;
  fulfilledAt: string | null;
  buyer: PublicUserDto;
  fulfillingSeller: PublicUserDto | null;
  category: WantedListingCategoryDto | null;
  conversation: WantedListingConversationDto | null;
};

export const mapConversationParticipantToDto = (
  participant: ConversationParticipant,
): WantedListingConversationParticipantDto => ({
  id: participant.id,
  user: mapUserToPublicDto(participant.user),
});

export const mapConversationSummaryToDto = (
  conversation: Conversation,
  participants?: ConversationParticipant[],
): WantedListingConversationDto => ({
  id: conversation.id,
  topic: conversation.topic,
  participants: participants?.map(mapConversationParticipantToDto),
});

export const mapWantedListingToResponse = (
  wanted: WantedListing,
): WantedListingResponseDto => ({
  id: wanted.id,
  title: wanted.title,
  details: wanted.details,
  budget: wanted.budget,
  status: wanted.status,
  createdAt: wanted.createdAt.toISOString(),
  updatedAt: wanted.updatedAt.toISOString(),
  fulfilledAt: wanted.fulfilledAt ? wanted.fulfilledAt.toISOString() : null,
  buyer: mapUserToPublicDto(wanted.buyer),
  fulfillingSeller: wanted.fulfillingSeller ? mapUserToPublicDto(wanted.fulfillingSeller) : null,
  category: wanted.category
    ? { id: wanted.category.id, name: wanted.category.name, slug: wanted.category.slug }
    : null,
  conversation: wanted.conversation
    ? mapConversationSummaryToDto(wanted.conversation)
    : null,
});
