import type {
  FeedbackResponse,
  FeedbackStats,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  Sentiment
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchFeedback(params: {
  limit?: number;
  offset?: number;
  sentiment?: Sentiment;
}): Promise<FeedbackResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());
  if (params.sentiment) searchParams.append('sentiment', params.sentiment);

  const response = await fetch(`${API_BASE}/feedback?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch feedback');
  return response.json();
}

export async function fetchFeedbackStats(): Promise<FeedbackStats> {
  const response = await fetch(`${API_BASE}/feedback/stats`);
  if (!response.ok) throw new Error('Failed to fetch feedback statistics');
  return response.json();
}

export async function submitFeedback(data: SubmitFeedbackRequest): Promise<SubmitFeedbackResponse> {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit feedback');
  }
  return response.json();
}
