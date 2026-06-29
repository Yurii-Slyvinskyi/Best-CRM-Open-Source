import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ProjectPriorityBadge,
  ProjectStatusBadge,
  type Project,
} from '../../../entities/project';
import { EmptyState } from '../../../shared/ui/empty-state';

type DashboardSearchProps = {
  query: string;
  results: Project[];
  onQueryChange: (value: string) => void;
};

export function DashboardSearch({ query, results, onQueryChange }: DashboardSearchProps) {
  const hasQuery = query.trim().length > 0;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-gray-950">Find a project</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Search visible projects by name, description, address, status, or priority.
        </p>
      </div>

      <div className="mt-4 flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
        <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          aria-label="Search projects"
          className="min-w-0 flex-1 text-sm text-gray-950 outline-none placeholder:text-gray-400"
          placeholder="Search projects…"
        />
      </div>

      {hasQuery && results.length === 0 && (
        <div className="mt-4">
          <EmptyState
            compact
            icon={Search}
            title="No projects match…"
            description="Try a different name, address, status, or priority."
          />
        </div>
      )}

      {hasQuery && results.length > 0 && (
        <ul className="mt-4 space-y-2">
          {results.map((project) => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                className="flex items-start justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-gray-950">{project.name}</p>
                  {project.address && (
                    <p className="mt-1 break-words text-xs text-gray-500">{project.address}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <ProjectStatusBadge status={project.status} />
                  <ProjectPriorityBadge priority={project.priority} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
