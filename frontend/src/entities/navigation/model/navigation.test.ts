import { describe, expect, it } from 'vitest';
import { navigationItems, routeAccess } from './navigation';

describe('navigation role consistency', () => {
  it('keeps menu item roles within route access roles', () => {
    navigationItems.forEach((item) => {
      expect(routeAccess[item.id]).toBeDefined();
      item.roles.forEach((role) => {
        expect(routeAccess[item.id]).toContain(role);
      });
    });
  });

  it('matches the current expected route access rules', () => {
    expect(routeAccess.dashboard).toEqual(['manager', 'worker', 'client']);
    expect(routeAccess.projects).toEqual(['manager', 'worker', 'client']);
    expect(routeAccess.projectDetail).toEqual(['manager', 'worker', 'client']);
    expect(routeAccess.worklogs).toEqual(['manager', 'worker']);
    expect(routeAccess.finance).toEqual(['manager']);
    expect(routeAccess.teams).toEqual(['manager']);
    expect(routeAccess.users).toEqual(['manager']);
    expect(routeAccess.profile).toEqual(['manager', 'worker', 'client']);
    expect(routeAccess.salaries).toEqual(['worker']);
    expect(routeAccess.payments).toEqual(['client']);
    expect(routeAccess.reviews).toEqual(['client']);
    expect(routeAccess.notifications).toEqual(['manager', 'worker', 'client']);
  });
});
