export type Team = {
  id: number;
  name: string;
  company: number;
  workers: number[];
};

export type TeamPayload = {
  name: string;
  workers: number[];
};

export type TeamUpdatePayload = Partial<TeamPayload>;
