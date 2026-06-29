import { describe, expect, it } from 'vitest';
import type { Project } from '../../../entities/project';
import { filterProjects, type ProjectFilterValues } from './project-filters';

function makeProject(overrides: Partial<Project>): Project {
  return {
    id: 1,
    name: 'Lakeview Renovation',
    description: 'Kitchen and deck work',
    status: 'pending',
    assigned_team: [10],
    client: 100,
    company: 1,
    address: '123 Lake Street',
    start_date: null,
    end_date: null,
    priority: 'medium',
    budget: null,
    created_at: '2026-06-18T10:00:00Z',
    updated_at: '2026-06-18T10:00:00Z',
    blueprint: null,
    chat_room: null,
    ...overrides,
  };
}

function makeFilters(overrides: Partial<ProjectFilterValues> = {}): ProjectFilterValues {
  return {
    search: '',
    status: '',
    priority: '',
    client: '',
    team: '',
    ...overrides,
  };
}

const projects = [
  makeProject({ id: 1, name: 'Lakeview Renovation', status: 'pending', priority: 'high', client: 100, assigned_team: [10] }),
  makeProject({ id: 2, name: 'Downtown Office', status: 'completed', priority: 'low', client: 200, assigned_team: [20] }),
  makeProject({ id: 3, name: 'Warehouse', description: 'Concrete repair', address: 'Industrial Park', status: 'assigned', priority: 'medium', client: 100, assigned_team: [20, 30] }),
];

describe('filterProjects', () => {
  it('filters by search across name, address, and description', () => {
    expect(filterProjects(projects, makeFilters({ search: 'lakeview' }), false, false).map((project) => project.id)).toEqual([1]);
    expect(filterProjects(projects, makeFilters({ search: 'industrial' }), false, false).map((project) => project.id)).toEqual([3]);
    expect(filterProjects(projects, makeFilters({ search: 'concrete' }), false, false).map((project) => project.id)).toEqual([3]);
  });

  it('filters by status', () => {
    expect(filterProjects(projects, makeFilters({ status: 'completed' }), false, false).map((project) => project.id)).toEqual([2]);
  });

  it('filters by priority', () => {
    expect(filterProjects(projects, makeFilters({ priority: 'high' }), false, false).map((project) => project.id)).toEqual([1]);
  });

  it('applies client filtering only when enabled by current capability behavior', () => {
    expect(filterProjects(projects, makeFilters({ client: '200' }), false, false).map((project) => project.id)).toEqual([1, 2, 3]);
    expect(filterProjects(projects, makeFilters({ client: '200' }), true, false).map((project) => project.id)).toEqual([2]);
  });

  it('applies team filtering only when enabled by current capability behavior', () => {
    expect(filterProjects(projects, makeFilters({ team: '30' }), false, false).map((project) => project.id)).toEqual([1, 2, 3]);
    expect(filterProjects(projects, makeFilters({ team: '30' }), false, true).map((project) => project.id)).toEqual([3]);
  });

  it('combines active filters', () => {
    expect(filterProjects(
      projects,
      makeFilters({ search: 'warehouse', status: 'assigned', priority: 'medium', client: '100', team: '20' }),
      true,
      true,
    ).map((project) => project.id)).toEqual([3]);
  });
});
