import type { Project, ProjectFormPayload } from '../../../entities/project';

export type ProjectFormMode = 'create' | 'edit';

export type ProjectFormProps = {
  mode: ProjectFormMode;
  project?: Project;
  onSubmit: (payload: ProjectFormPayload) => Promise<void>;
  onCancel: () => void;
};
