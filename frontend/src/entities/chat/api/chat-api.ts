import { apiClient } from '../../../shared/api';
import type { ChatMessage, ChatMessagePayload, ChatMessageUpdatePayload } from '../model/types';

export function getChatMessages(): Promise<ChatMessage[]> {
  return apiClient<ChatMessage[]>('/api/chats/messages/');
}

export function getChatMessagesByRoom(roomId: string | number): Promise<ChatMessage[]> {
  return apiClient<ChatMessage[]>(`/api/chats/messages/?room=${encodeURIComponent(roomId)}`);
}

export function getChatMessage(messageId: string | number): Promise<ChatMessage> {
  return apiClient<ChatMessage>(`/api/chats/messages/${messageId}/`);
}

export function createChatMessage(payload: ChatMessagePayload): Promise<ChatMessage> {
  return apiClient<ChatMessage>('/api/chats/messages/', {
    method: 'POST',
    body: payload,
  });
}

export function updateChatMessage(
  messageId: string | number,
  payload: ChatMessageUpdatePayload,
): Promise<ChatMessage> {
  return apiClient<ChatMessage>(`/api/chats/messages/${messageId}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteChatMessage(messageId: string | number): Promise<void> {
  return apiClient<void>(`/api/chats/messages/${messageId}/`, {
    method: 'DELETE',
  });
}
