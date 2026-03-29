import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SourceViewer from './SourceViewer';
import type { SourceChunk } from '../types';

const mockSources: SourceChunk[] = [
  {
    text: 'This is the first source chunk with relevant information.',
    score: 0.87,
    chunkIndex: 0
  },
  {
    text: 'This is the second source chunk.',
    score: 0.72,
    chunkIndex: 1
  }
];

describe('SourceViewer', () => {
  it('renders nothing when sources is empty', () => {
    const { container } = render(<SourceViewer sources={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when sources is undefined', () => {
    const { container } = render(<SourceViewer sources={undefined as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when sources is null', () => {
    const { container } = render(<SourceViewer sources={null as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows source count in header', () => {
    render(<SourceViewer sources={mockSources} />);
    expect(screen.getByText(/2 Sources Used/i)).toBeInTheDocument();
  });

  it('sources are collapsed by default', () => {
    render(<SourceViewer sources={mockSources} />);
    expect(screen.queryByText(/first source chunk/i)).not.toBeVisible();
  });

  it('expands when header is clicked', () => {
    render(<SourceViewer sources={mockSources} />);
    const header = screen.getByText(/2 Sources Used/i).closest('div')!;
    fireEvent.click(header);
    expect(screen.getByText(/first source chunk/i)).toBeVisible();
  });

  it('shows relevance scores when expanded', () => {
    render(<SourceViewer sources={mockSources} />);
    const header = screen.getByText(/2 Sources Used/i).closest('div')!;
    fireEvent.click(header);
    expect(screen.getByText(/87.0%/)).toBeInTheDocument();
    expect(screen.getByText(/72.0%/)).toBeInTheDocument();
  });

  it('truncates long text', () => {
    const longSources: SourceChunk[] = [{
      text: 'a'.repeat(300),
      score: 0.9,
      chunkIndex: 0
    }];

    render(<SourceViewer sources={longSources} />);
    const header = screen.getByText(/1 Source Used/i).closest('div')!;
    fireEvent.click(header);
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
  });

  it('collapses when clicked again', () => {
    render(<SourceViewer sources={mockSources} />);
    const header = screen.getByText(/2 Sources Used/i).closest('div')!;

    fireEvent.click(header); // expand
    fireEvent.click(header); // collapse

    expect(screen.queryByText(/first source chunk/i)).not.toBeVisible();
  });
});