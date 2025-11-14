import { useState } from 'react';
import { submitFeedback } from '../lib/api';
import type { Sentiment } from '../lib/types';

export default function FeedbackForm() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ sentiment: Sentiment; confidence: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const result = await submitFeedback({ text });
      setSuccess({
        sentiment: result.sentiment,
        confidence: result.confidenceScore
      });
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: Sentiment) => {
    switch (sentiment) {
      case 'GOOD':
        return 'text-green-600';
      case 'BAD':
        return 'text-red-600';
      case 'NEUTRAL':
        return 'text-yellow-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">HappyMeter</h1>
          <p className="text-gray-600">Share your feedback and let AI analyze your sentiment</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Your Feedback
              </label>
              <textarea
                id="feedback"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Tell us what you think..."
                maxLength={1000}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                required
              />
              <div className="mt-2 text-sm text-gray-500 text-right">
                {text.length} / 1000 characters
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
                <p className="text-green-800 font-medium mb-1">Thank you for your feedback!</p>
                <p className="text-sm text-green-700">
                  Sentiment: <span className={getSentimentColor(success.sentiment)}>{success.sentiment}</span>
                  {' '}(Confidence: {(parseFloat(success.confidence) * 100).toFixed(1)}%)
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a href="/admin" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Admin Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
