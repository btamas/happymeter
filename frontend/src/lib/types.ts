export type Sentiment = 'GOOD' | 'BAD' | 'NEUTRAL';

export interface Feedback {
  id: number;
  text: string;
  sentiment: Sentiment;
  confidenceScore: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackResponse {
  feedback: Feedback[];
  total: number;
  limit: number;
  offset: number;
}

export interface SubmitFeedbackRequest {
  text: string;
}

export interface SubmitFeedbackResponse {
  id: number;
  text: string;
  sentiment: Sentiment;
  confidenceScore: string;
  createdAt: string;
}
