export type ProjectStatus =
  | 'pending'
  | 'assigned'
  | 'cancelled'
  | 'partially completed'
  | 'completed';

export type ProjectPriority = 'low' | 'medium' | 'high';

export type Project = {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  assigned_team: number[];
  client: number;
  company: number;
  address: string;
  start_date: string | null;
  end_date: string | null;
  priority: ProjectPriority;
  budget: string | null;
  created_at: string;
  updated_at: string;
  blueprint: string | null;
  chat_room: number | null;
};

export type ProjectFormPayload = {
  name: string;
  description: string;
  client: number;
  assigned_team: number[];
  address: string;
  start_date: string | null;
  end_date: string | null;
  priority: ProjectPriority;
  budget: string | null;
  status?: ProjectStatus;
};
