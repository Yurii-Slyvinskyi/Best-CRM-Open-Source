import { describe, expect, it } from 'vitest';

describe('test setup', () => {
  it('runs in jsdom with jest-dom matchers', () => {
    const element = document.createElement('div');

    element.textContent = 'CRM test setup';
    document.body.appendChild(element);

    expect(element).toBeInTheDocument();
  });
});
