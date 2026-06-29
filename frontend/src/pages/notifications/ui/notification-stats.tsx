import { Bell, CalendarClock, MailCheck } from 'lucide-react';
import { MetricCard } from '../../../shared/ui/metric-card';

type NotificationStatsProps = {
  total: number;
  unread: number;
  emailSent: number;
  latestDate: string;
};

export function NotificationStats({ total, unread, emailSent, latestDate }: NotificationStatsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <MetricCard variant="end" icon={Bell} label="Total notifications" value={String(total)} />
      <MetricCard
        variant="end"
        icon={Bell}
        label="Unread"
        value={String(unread)}
        iconContainerClassName="bg-red-50 text-red-700"
      />
      <MetricCard
        variant="end"
        icon={MailCheck}
        label="Email sent"
        value={String(emailSent)}
        iconContainerClassName="bg-green-50 text-green-700"
      />
      <MetricCard
        variant="end"
        icon={CalendarClock}
        label="Latest notification"
        value={latestDate}
        valueClassName="text-base"
        iconContainerClassName="bg-gray-50 text-gray-600"
      />
    </div>
  );
}
