export type Notification = {
  id: number;
  company: number;
  recipient: number;
  subject: string;
  message: string;
  email_sent: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type UnreadNotificationsCount = {
  count: number;
};

export type MarkAllNotificationsReadResponse = {
  updated: number;
};
