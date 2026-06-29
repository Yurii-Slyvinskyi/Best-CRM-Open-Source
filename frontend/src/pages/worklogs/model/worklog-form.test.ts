import { describe, expect, it } from 'vitest';
import type { Worklog } from '../../../entities/worklog';
import {
  buildWorklogPayload,
  getInitialEditValues,
  validateWorklogForm,
  type WorklogFormValues,
} from './worklog-form';

function makeValues(overrides: Partial<WorklogFormValues> = {}): WorklogFormValues {
  return {
    worker: '4',
    project: '10',
    team: '7',
    date: '2026-06-18',
    hours_worked: '8',
    description: '  Framing work  ',
    ...overrides,
  };
}

describe('validateWorklogForm', () => {
  it('requires managers to provide a worker', () => {
    expect(validateWorklogForm(makeValues({ worker: '' }), true)).toEqual({
      worker: 'Worker is required.',
    });
  });

  it('does not require workers to provide a worker field', () => {
    expect(validateWorklogForm(makeValues({ worker: '' }), false)).toEqual({});
  });

  it('requires project, team, date, and hours for all users', () => {
    expect(validateWorklogForm(makeValues({
      project: '',
      team: '',
      date: '',
      hours_worked: '',
    }), false)).toEqual({
      project: 'Project is required.',
      team: 'Team is required.',
      date: 'Date is required.',
      hours_worked: 'Hours are required.',
    });
  });

  it('requires YYYY-MM-DD date format', () => {
    expect(validateWorklogForm(makeValues({ date: '06/18/2026' }), false)).toEqual({
      date: 'Date must use YYYY-MM-DD format.',
    });
  });

  it('requires hours to be a positive integer according to current behavior', () => {
    expect(validateWorklogForm(makeValues({ hours_worked: '0' }), false)).toEqual({
      hours_worked: 'Hours must be a positive integer.',
    });
    expect(validateWorklogForm(makeValues({ hours_worked: '-1' }), false)).toEqual({
      hours_worked: 'Hours must be a positive integer.',
    });
    expect(validateWorklogForm(makeValues({ hours_worked: '1.5' }), false)).toEqual({
      hours_worked: 'Hours must be a positive integer.',
    });
    expect(validateWorklogForm(makeValues({ hours_worked: 'abc' }), false)).toEqual({
      hours_worked: 'Hours must be a positive integer.',
    });
    expect(validateWorklogForm(makeValues({ hours_worked: '2' }), false)).toEqual({});
  });
});

describe('buildWorklogPayload', () => {
  it('includes worker only for managers and trims blank descriptions to null', () => {
    expect(buildWorklogPayload(makeValues({ description: '   ' }), true)).toEqual({
      worker: 4,
      team: 7,
      project: 10,
      date: '2026-06-18',
      hours_worked: 8,
      description: null,
    });
  });

  it('omits worker for non-manager payloads', () => {
    expect(buildWorklogPayload(makeValues(), false)).toEqual({
      team: 7,
      project: 10,
      date: '2026-06-18',
      hours_worked: 8,
      description: 'Framing work',
    });
  });
});

describe('getInitialEditValues', () => {
  it('maps a worklog row into editable string values', () => {
    const worklog: Worklog = {
      id: 1,
      worker: 4,
      project: 10,
      team: 7,
      date: '2026-06-18',
      hours_worked: 6,
      description: null,
    };

    expect(getInitialEditValues(worklog)).toEqual({
      worker: '4',
      project: '10',
      team: '7',
      date: '2026-06-18',
      hours_worked: '6',
      description: '',
    });
  });
});
