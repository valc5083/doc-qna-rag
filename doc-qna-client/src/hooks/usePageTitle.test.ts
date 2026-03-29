import { renderHook } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import usePageTitle from './usePageTitle';

describe('usePageTitle', () => {
  afterEach(() => {
    document.title = '';
  });

  it('sets document title with suffix', () => {
    renderHook(() => usePageTitle('Dashboard'));
    expect(document.title).toBe('Dashboard | DocQnA');
  });

  it('updates title when prop changes', () => {
    const { rerender } = renderHook(
      ({ title }) => usePageTitle(title),
      { initialProps: { title: 'Login' } }
    );

    expect(document.title).toBe('Login | DocQnA');

    rerender({ title: 'Dashboard' });
    expect(document.title).toBe('Dashboard | DocQnA');
  });

  it('resets title on unmount', () => {
    const { unmount } = renderHook(() => usePageTitle('Chat'));
    expect(document.title).toBe('Chat | DocQnA');

    unmount();
    expect(document.title).toBe('DocQnA');
  });
});