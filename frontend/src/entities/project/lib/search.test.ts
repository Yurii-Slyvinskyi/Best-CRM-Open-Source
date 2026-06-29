import { describe, expect, it } from 'vitest';
import type { Project } from '../model/types';
import { searchProjects } from './search';

function makeProject(overrides: Partial<Project>): Project {
  return {
    id: 1,
    name: 'Project',
    description: '',
    status: 'assigned',
    assigned_team: [],
    client: 1,
    company: 1,
    address: '',
    start_date: null,
    end_date: null,
    priority: 'medium',
    budget: null,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    blueprint: null,
    chat_room: null,
    ...overrides,
  };
}

describe('searchProjects', () => {
  const projects = [
    makeProject({ id: 1, name: 'Harbor Bridge', description: 'Steel works', address: '12 Dock St', status: 'assigned', priority: 'high' }),
    makeProject({ id: 2, name: 'Maple Tower', description: 'Concrete pour', address: '9 Pine Ave', status: 'completed', priority: 'low' }),
  ];

  it('returns no results for an empty query', () => {
    expect(searchProjects(projects, '')).toEqual([]);
    expect(searchProjects(projects, '   ')).toEqual([]);
  });

  it('matches by name, description, address, status, and priority (case-insensitive)', () => {
    expect(searchProjects(projects, 'harbor').map((project) => project.id)).toEqual([1]);
    expect(searchProjects(projects, 'concrete').map((project) => project.id)).toEqual([2]);
    expect(searchProjects(projects, 'pine ave').map((project) => project.id)).toEqual([2]);
    expect(searchProjects(projects, 'COMPLETED').map((project) => project.id)).toEqual([2]);
    expect(searchProjects(projects, 'high').map((project) => project.id)).toEqual([1]);
  });

  it('returns all matching projects when several match', () => {
    expect(searchProjects(projects, 'o').map((project) => project.id)).toEqual([1, 2]);
  });
});
