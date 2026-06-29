import { FolderKanban } from 'lucide-react';
import { ProjectCard, type Project } from '../../../entities/project';
import { EmptyState } from '../../../shared/ui/empty-state';

type ProjectGridProps = {
  projects: Project[];
};

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects match the filters"
        description="Clear the filters or adjust the search terms to see more projects."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
