export type ChatMessage = {
  id: number;
  room: number;
  sender_username: string;
  content: string;
  timestamp: string;
};

export type ChatMessagePayload = {
  room: number;
  content: string;
};

export type ChatMessageUpdatePayload = {
  content: string;
};
