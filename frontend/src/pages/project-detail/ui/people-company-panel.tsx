import { Users } from 'lucide-react';
import { formatProjectIds } from '../../../entities/project';
import { DetailItem } from './detail-item';
import { SectionPanel } from './section-panel';

type PeopleCompanyPanelProps = {
  clientLabel: string;
  companyLabel: string;
  teamLabel: string;
  assignedTeam: number[];
};

export function PeopleCompanyPanel({
  clientLabel,
  companyLabel,
  teamLabel,
  assignedTeam,
}: PeopleCompanyPanelProps) {
  return (
    <SectionPanel icon={Users} title="People & company">
      <div>
        <DetailItem label="Client" value={clientLabel} />
        <DetailItem label="Company" value={companyLabel} />
        <DetailItem label="Assigned teams" value={teamLabel || formatProjectIds(assignedTeam)} />
      </div>
    </SectionPanel>
  );
}
