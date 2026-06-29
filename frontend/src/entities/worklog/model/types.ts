export type Worklog = {
  id: number;
  worker: number;
  team: number;
  project: number;
  date: string;
  hours_worked: number;
  description: string | null;
};

export type WorklogPayload = {
  worker?: number;
  team: number;
  project: number;
  date: string;
  hours_worked: number;
  description?: string | null;
};

export type WorklogUpdatePayload = Partial<WorklogPayload>;
