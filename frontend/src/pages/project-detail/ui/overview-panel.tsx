import { FileText, MapPin } from 'lucide-react';
import { formatProjectDate, type Project } from '../../../entities/project';
import { Fact } from './fact';
import { SectionPanel } from './section-panel';

type OverviewPanelProps = {
  project: Project;
};

export function OverviewPanel({ project }: OverviewPanelProps) {
  return (
    <SectionPanel icon={FileText} title="Overview">
      <p className="text-sm leading-relaxed text-gray-700">{project.description}</p>
      <div className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 sm:grid-cols-2">
        <Fact label="Address" value={project.address} icon={MapPin} />
        <Fact label="Created" value={formatProjectDate(project.created_at)} />
        <Fact label="Start date" value={formatProjectDate(project.start_date)} />
        <Fact label="End date" value={formatProjectDate(project.end_date)} />
      </div>
    </SectionPanel>
  );
}
