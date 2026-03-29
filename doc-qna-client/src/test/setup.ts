import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-hot-toast globally
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ documentId: 'test-doc-id' }),
    useLocation: () => ({ state: null }),
  };
});