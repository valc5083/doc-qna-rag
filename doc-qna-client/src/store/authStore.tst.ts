import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      email: null,
      isAuthenticated: false
    });
  });

  it('initial state is unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.email).toBeNull();
  });

  it('login sets authenticated state', () => {
    const { login } = useAuthStore.getState();
    login('access-token', 'refresh-token', 'test@example.com');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('access-token');
    expect(state.email).toBe('test@example.com');
  });

  it('login saves tokens to localStorage', () => {
    const { login } = useAuthStore.getState();
    login('access-token', 'refresh-token', 'test@example.com');

    expect(localStorage.getItem('accessToken')).toBe('access-token');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
    expect(localStorage.getItem('email')).toBe('test@example.com');
  });

  it('logout clears state', () => {
    const { login, logout } = useAuthStore.getState();
    login('access-token', 'refresh-token', 'test@example.com');
    logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.email).toBeNull();
  });

  it('logout clears localStorage', () => {
    const { login, logout } = useAuthStore.getState();
    login('access-token', 'refresh-token', 'test@example.com');
    logout();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('email')).toBeNull();
  });
});