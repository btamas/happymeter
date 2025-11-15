import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Admin from './Admin';
import * as api from '../lib/api';

vi.mock('../lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockFeedbackData = {
  feedback: [
    {
      id: 1,
      text: 'Great product!',
      sentiment: 'GOOD' as const,
      confidenceScore: '0.95',
      createdAt: '2025-11-15T10:00:00.000Z',
      updatedAt: '2025-11-15T10:00:00.000Z'
    },
    {
      id: 2,
      text: 'Terrible service',
      sentiment: 'BAD' as const,
      confidenceScore: '0.92',
      createdAt: '2025-11-15T10:01:00.000Z',
      updatedAt: '2025-11-15T10:01:00.000Z'
    },
    {
      id: 3,
      text: 'It was okay',
      sentiment: 'NEUTRAL' as const,
      confidenceScore: '0.88',
      createdAt: '2025-11-15T10:02:00.000Z',
      updatedAt: '2025-11-15T10:02:00.000Z'
    }
  ],
  total: 3,
  limit: 20,
  offset: 0
};

describe('Admin', () => {
  it('should render admin dashboard title and description', async () => {
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('View and analyze customer feedback')).toBeInTheDocument();
    expect(screen.getByText('← Back to Feedback Form')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    vi.mocked(api.fetchFeedback).mockImplementation(
      () => new Promise(() => {})
    );

    render(<Admin />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading feedback...')).toBeInTheDocument();
  });

  it('should display feedback data in table', async () => {
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Great product!')).toBeInTheDocument();
    });

    expect(screen.getByText('Terrible service')).toBeInTheDocument();
    expect(screen.getByText('It was okay')).toBeInTheDocument();
  });

  it('should display statistics correctly', async () => {
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total Feedback')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Feedback')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bad' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neutral' })).toBeInTheDocument();

    const totalStats = screen.getAllByText('3');
    expect(totalStats.length).toBeGreaterThan(0);
  });

  it('should render sentiment badges with correct colors', async () => {
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      const goodBadge = screen.getByText('GOOD');
      expect(goodBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    const badBadge = screen.getByText('BAD');
    expect(badBadge).toHaveClass('bg-red-100', 'text-red-800');

    const neutralBadge = screen.getByText('NEUTRAL');
    expect(neutralBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('should display confidence scores as percentages', async () => {
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('95.0%')).toBeInTheDocument();
    });

    expect(screen.getByText('92.0%')).toBeInTheDocument();
    expect(screen.getByText('88.0%')).toBeInTheDocument();
  });

  it('should render filter buttons', async () => {
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bad' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neutral' })).toBeInTheDocument();
  });

  it('should filter by GOOD sentiment when Good button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Great product!')).toBeInTheDocument();
    });

    const goodButton = screen.getByRole('button', { name: 'Good' });
    await user.click(goodButton);

    expect(api.fetchFeedback).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      sentiment: 'GOOD'
    });
  });

  it('should filter by BAD sentiment when Bad button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Great product!')).toBeInTheDocument();
    });

    const badButton = screen.getByRole('button', { name: 'Bad' });
    await user.click(badButton);

    expect(api.fetchFeedback).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      sentiment: 'BAD'
    });
  });

  it('should filter by NEUTRAL sentiment when Neutral button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Great product!')).toBeInTheDocument();
    });

    const neutralButton = screen.getByRole('button', { name: 'Neutral' });
    await user.click(neutralButton);

    expect(api.fetchFeedback).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      sentiment: 'NEUTRAL'
    });
  });

  it('should clear filter when All button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Great product!')).toBeInTheDocument();
    });

    const goodButton = screen.getByRole('button', { name: 'Good' });
    await user.click(goodButton);

    const allButton = screen.getByRole('button', { name: 'All' });
    await user.click(allButton);

    expect(api.fetchFeedback).toHaveBeenLastCalledWith({
      limit: 20,
      offset: 0,
      sentiment: undefined
    });
  });

  it('should display pagination information', async () => {
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Showing 1 to 3 of 3 results')).toBeInTheDocument();
    });

    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('should disable Previous button on first page', async () => {
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      const prevButton = screen.getByRole('button', { name: 'Previous' });
      expect(prevButton).toBeDisabled();
    });
  });

  it('should disable Next button on last page', async () => {
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).toBeDisabled();
    });
  });

  it('should navigate to next page when Next button is clicked', async () => {
    const user = userEvent.setup();
    const largeFeedbackData = {
      ...mockFeedbackData,
      total: 50
    };
    vi.mocked(api.fetchFeedback).mockResolvedValue(largeFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: 'Next' });
    await user.click(nextButton);

    expect(api.fetchFeedback).toHaveBeenCalledWith({
      limit: 20,
      offset: 20,
      sentiment: undefined
    });
  });

  it('should navigate to previous page when Previous button is clicked', async () => {
    const user = userEvent.setup();
    const largeFeedbackData = {
      ...mockFeedbackData,
      total: 50
    };
    vi.mocked(api.fetchFeedback).mockResolvedValue(largeFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: 'Next' });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    const prevButton = screen.getByRole('button', { name: 'Previous' });
    await user.click(prevButton);

    expect(api.fetchFeedback).toHaveBeenLastCalledWith({
      limit: 20,
      offset: 0,
      sentiment: undefined
    });
  });

  it('should show error message when fetch fails', async () => {
    vi.mocked(api.fetchFeedback).mockRejectedValue(new Error('Network error'));

    render(<Admin />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Error loading feedback')).toBeInTheDocument();
    });
  });

  it('should have link back to feedback form', async () => {
    vi.mocked(api.fetchFeedback).mockResolvedValue(mockFeedbackData);

    render(<Admin />, { wrapper: createWrapper() });

    const backLink = screen.getByText('← Back to Feedback Form');
    expect(backLink).toHaveAttribute('href', '/');
  });
});
