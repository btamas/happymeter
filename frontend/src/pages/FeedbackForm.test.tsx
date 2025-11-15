import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedbackForm from './FeedbackForm';
import * as api from '../lib/api';

vi.mock('../lib/api');

describe('FeedbackForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render feedback form with all elements', () => {
    render(<FeedbackForm />);

    expect(screen.getByText('HappyMeter')).toBeInTheDocument();
    expect(screen.getByText('Share your feedback and let AI analyze your sentiment')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Feedback')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tell us what you think...')).toBeInTheDocument();
    expect(screen.getByText('0 / 1000 characters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Feedback' })).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard →')).toBeInTheDocument();
  });

  it('should update character count as user types', async () => {
    const user = userEvent.setup();
    render(<FeedbackForm />);

    const textarea = screen.getByLabelText('Your Feedback');
    await user.type(textarea, 'Great product!');

    expect(screen.getByText('14 / 1000 characters')).toBeInTheDocument();
  });

  it('should disable submit button when textarea is empty', () => {
    render(<FeedbackForm />);

    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when textarea has text', async () => {
    const user = userEvent.setup();
    render(<FeedbackForm />);

    const textarea = screen.getByLabelText('Your Feedback');
    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' });

    await user.type(textarea, 'Great product!');

    expect(submitButton).not.toBeDisabled();
  });

  it('should submit feedback and show success message for GOOD sentiment', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitFeedback).mockResolvedValue({
      id: 1,
      text: 'Great product!',
      sentiment: 'GOOD',
      confidenceScore: '0.95',
      createdAt: new Date().toISOString()
    });

    render(<FeedbackForm />);

    const textarea = screen.getByLabelText('Your Feedback');
    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' });

    await user.type(textarea, 'Great product!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Thank you for your positive feedback!')).toBeInTheDocument();
    });

    expect(screen.getByText(/We're delighted to hear you had a great experience/)).toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  it('should submit feedback and show success message for BAD sentiment', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitFeedback).mockResolvedValue({
      id: 2,
      text: 'Terrible service',
      sentiment: 'BAD',
      confidenceScore: '0.92',
      createdAt: new Date().toISOString()
    });

    render(<FeedbackForm />);

    const textarea = screen.getByLabelText('Your Feedback');
    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' });

    await user.type(textarea, 'Terrible service');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('We sincerely apologize')).toBeInTheDocument();
    });

    expect(screen.getByText(/We're sorry to hear about the issues you've experienced/)).toBeInTheDocument();
  });

  it('should submit feedback and show success message for NEUTRAL sentiment', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitFeedback).mockResolvedValue({
      id: 3,
      text: 'It was okay',
      sentiment: 'NEUTRAL',
      confidenceScore: '0.88',
      createdAt: new Date().toISOString()
    });

    render(<FeedbackForm />);

    const textarea = screen.getByLabelText('Your Feedback');
    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' });

    await user.type(textarea, 'It was okay');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
    });

    expect(screen.getByText(/We appreciate you taking the time to share your thoughts/)).toBeInTheDocument();
  });

  it('should show error message when submission fails', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitFeedback).mockRejectedValue(new Error('Network error'));

    render(<FeedbackForm />);

    const textarea = screen.getByLabelText('Your Feedback');
    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' });

    await user.type(textarea, 'Test feedback');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should enforce 1000 character limit', async () => {
    const user = userEvent.setup();
    render(<FeedbackForm />);

    const textarea = screen.getByLabelText('Your Feedback') as HTMLTextAreaElement;
    const longText = 'a'.repeat(1500);

    await user.click(textarea);
    await user.paste(longText);

    expect(textarea.value.length).toBeLessThanOrEqual(1000);
    expect(screen.getByText('1000 / 1000 characters')).toBeInTheDocument();
  });

  it('should clear success message when submitting new feedback', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitFeedback)
      .mockResolvedValueOnce({
        id: 1,
        text: 'Great!',
        sentiment: 'GOOD',
        confidenceScore: '0.95',
        createdAt: new Date().toISOString()
      })
      .mockResolvedValueOnce({
        id: 2,
        text: 'Another feedback',
        sentiment: 'NEUTRAL',
        confidenceScore: '0.80',
        createdAt: new Date().toISOString()
      });

    render(<FeedbackForm />);

    const textarea = screen.getByLabelText('Your Feedback');
    const submitButton = screen.getByRole('button', { name: 'Submit Feedback' });

    await user.type(textarea, 'Great!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Thank you for your positive feedback!')).toBeInTheDocument();
    });

    await user.type(textarea, 'Another feedback');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Thank you for your positive feedback!')).not.toBeInTheDocument();
      expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
    });
  });

  it('should have link to admin dashboard', () => {
    render(<FeedbackForm />);

    const adminLink = screen.getByText('Admin Dashboard →');
    expect(adminLink).toHaveAttribute('href', '/admin');
  });
});
