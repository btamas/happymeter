import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFeedback, submitFeedback } from './api';

globalThis.fetch = vi.fn();

describe('API functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchFeedback', () => {
    it('should fetch feedback with no parameters', async () => {
      const mockResponse = {
        feedback: [],
        total: 0,
        limit: 20,
        offset: 0
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await fetchFeedback({});

      expect(fetch).toHaveBeenCalledWith('/api/feedback?');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch feedback with limit parameter', async () => {
      const mockResponse = {
        feedback: [],
        total: 0,
        limit: 10,
        offset: 0
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await fetchFeedback({ limit: 10 });

      expect(fetch).toHaveBeenCalledWith('/api/feedback?limit=10');
    });

    it('should fetch feedback with offset parameter', async () => {
      const mockResponse = {
        feedback: [],
        total: 0,
        limit: 20,
        offset: 20
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await fetchFeedback({ offset: 20 });

      expect(fetch).toHaveBeenCalledWith('/api/feedback?offset=20');
    });

    it('should fetch feedback with sentiment filter', async () => {
      const mockResponse = {
        feedback: [],
        total: 0,
        limit: 20,
        offset: 0
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await fetchFeedback({ sentiment: 'GOOD' });

      expect(fetch).toHaveBeenCalledWith('/api/feedback?sentiment=GOOD');
    });

    it('should fetch feedback with all parameters', async () => {
      const mockResponse = {
        feedback: [],
        total: 0,
        limit: 10,
        offset: 5
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await fetchFeedback({ limit: 10, offset: 5, sentiment: 'BAD' });

      expect(fetch).toHaveBeenCalledWith('/api/feedback?limit=10&offset=5&sentiment=BAD');
    });

    it('should throw error when response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401
      } as Response);

      await expect(fetchFeedback({})).rejects.toThrow('Failed to fetch feedback');
    });

    it('should return feedback data correctly', async () => {
      const mockResponse = {
        feedback: [
          {
            id: 1,
            text: 'Great product!',
            sentiment: 'GOOD',
            confidenceScore: '0.95',
            createdAt: '2025-11-15T10:00:00.000Z',
            updatedAt: '2025-11-15T10:00:00.000Z'
          }
        ],
        total: 1,
        limit: 20,
        offset: 0
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await fetchFeedback({});

      expect(result).toEqual(mockResponse);
      expect(result.feedback).toHaveLength(1);
      expect(result.feedback[0].text).toBe('Great product!');
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const mockResponse = {
        id: 1,
        text: 'Great product!',
        sentiment: 'GOOD',
        confidenceScore: '0.95',
        createdAt: '2025-11-15T10:00:00.000Z',
        updatedAt: '2025-11-15T10:00:00.000Z'
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await submitFeedback({ text: 'Great product!' });

      expect(fetch).toHaveBeenCalledWith('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Great product!' })
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Text is required' })
      } as Response);

      await expect(submitFeedback({ text: '' })).rejects.toThrow('Text is required');
    });

    it('should throw generic error when no message in error response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({})
      } as Response);

      await expect(submitFeedback({ text: 'test' })).rejects.toThrow('Failed to submit feedback');
    });

    it('should return feedback with sentiment analysis', async () => {
      const mockResponse = {
        id: 2,
        text: 'Terrible service',
        sentiment: 'BAD',
        confidenceScore: '0.92',
        createdAt: '2025-11-15T10:01:00.000Z',
        updatedAt: '2025-11-15T10:01:00.000Z'
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await submitFeedback({ text: 'Terrible service' });

      expect(result.sentiment).toBe('BAD');
      expect(result.confidenceScore).toBe('0.92');
    });

    it('should send correct content-type header', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 1,
          text: 'Test',
          sentiment: 'NEUTRAL',
          confidenceScore: '0.8',
          createdAt: '2025-11-15T10:00:00.000Z',
          updatedAt: '2025-11-15T10:00:00.000Z'
        })
      } as Response);

      await submitFeedback({ text: 'Test' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should use POST method', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 1,
          text: 'Test',
          sentiment: 'NEUTRAL',
          confidenceScore: '0.8',
          createdAt: '2025-11-15T10:00:00.000Z',
          updatedAt: '2025-11-15T10:00:00.000Z'
        })
      } as Response);

      await submitFeedback({ text: 'Test' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });
});
