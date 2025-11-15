import { describe, it, expect } from 'vitest';
import { analyzeSentiment, warmupSentiment } from './sentiment.js';

describe('Sentiment Analysis Service', () => {
  it('should classify clearly positive text as GOOD', async () => {
    const result = await analyzeSentiment('This product is absolutely amazing and wonderful!');

    expect(result).toHaveProperty('label');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('probs');
    expect(result.label).toBe('Good');
    expect(result.score).toBeGreaterThan(0);
  }, 30000);

  it('should classify clearly negative text as BAD', async () => {
    const result = await analyzeSentiment('This is terrible and awful, worst experience ever!');

    expect(result.label).toBe('Bad');
    expect(result.score).toBeLessThan(0);
  }, 30000);

  it('should classify neutral text appropriately', async () => {
    const result = await analyzeSentiment('The product arrived on time.');

    expect(['Good', 'Bad', 'Neutral']).toContain(result.label);
    expect(result.score).toBeGreaterThanOrEqual(-10);
    expect(result.score).toBeLessThanOrEqual(10);
  }, 30000);

  it('should return probability scores for all sentiments', async () => {
    const result = await analyzeSentiment('This is okay I guess');

    expect(result.probs).toHaveProperty('positive');
    expect(result.probs).toHaveProperty('negative');
    expect(result.probs).toHaveProperty('neutral');

    expect(result.probs.positive).toBeGreaterThanOrEqual(0);
    expect(result.probs.positive).toBeLessThanOrEqual(1);
    expect(result.probs.negative).toBeGreaterThanOrEqual(0);
    expect(result.probs.negative).toBeLessThanOrEqual(1);
    expect(result.probs.neutral).toBeGreaterThanOrEqual(0);
    expect(result.probs.neutral).toBeLessThanOrEqual(1);

    const sum = result.probs.positive + result.probs.negative + result.probs.neutral;
    expect(sum).toBeCloseTo(1, 1);
  }, 30000);

  it('should handle short text', async () => {
    const result = await analyzeSentiment('Great!');

    expect(result.label).toBe('Good');
    expect(['Good', 'Bad', 'Neutral']).toContain(result.label);
  }, 30000);

  it('should handle long text', async () => {
    const longText = 'I really love this product. '.repeat(20);
    const result = await analyzeSentiment(longText);

    expect(result.label).toBe('Good');
    expect(['Good', 'Bad', 'Neutral']).toContain(result.label);
  }, 30000);

  it('should return score in approximate range [-10, 10]', async () => {
    const result = await analyzeSentiment('Excellent product, highly recommend!');

    expect(result.score).toBeGreaterThanOrEqual(-10);
    expect(result.score).toBeLessThanOrEqual(10);
  }, 30000);

  it('should successfully warmup sentiment model', async () => {
    await expect(warmupSentiment()).resolves.not.toThrow();
  }, 30000);

  it('should be able to analyze after warmup', async () => {
    await warmupSentiment();

    const result = await analyzeSentiment('Test after warmup');

    expect(result).toHaveProperty('label');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('probs');
    expect(['Good', 'Bad', 'Neutral']).toContain(result.label);
  }, 30000);
});
