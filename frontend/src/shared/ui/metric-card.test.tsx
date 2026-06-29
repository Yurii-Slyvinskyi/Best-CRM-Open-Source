import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Gauge } from 'lucide-react';
import { MetricCard } from './metric-card';

describe('MetricCard', () => {
  it('renders default metric content', () => {
    render(
      <MetricCard
        icon={Gauge}
        label="Net profit"
        value="$10,000"
        detail="Current company summary"
      />,
    );

    expect(screen.getByText('Net profit')).toBeInTheDocument();
    expect(screen.getByText('$10,000')).toBeInTheDocument();
    expect(screen.getByText('Current company summary')).toBeInTheDocument();
  });

  it('renders inline metric content', () => {
    render(
      <MetricCard
        icon={Gauge}
        label="Logged hours"
        value="19h"
        detail="This week"
        variant="inline"
      />,
    );

    expect(screen.getByText('Logged hours')).toBeInTheDocument();
    expect(screen.getByText('19h')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
  });

  it('renders end metric content without requiring detail text', () => {
    render(
      <MetricCard
        icon={Gauge}
        label="Projects"
        value="4"
        variant="end"
      />,
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
