import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pool } from '../db/index.js';

vi.mock('../services/sentiment.js', () => ({
  analyzeSentiment: vi.fn(async (text: string) => {
    if (text.toLowerCase().includes('amazing') || text.toLowerCase().includes('great')) {
      return { label: 'Good', score: 8, probs: { positive: 0.9, negative: 0.05, neutral: 0.05 } };
    }
    if (text.toLowerCase().includes('terrible') || text.toLowerCase().includes('awful')) {
      return { label: 'Bad', score: -8, probs: { positive: 0.05, negative: 0.9, neutral: 0.05 } };
    }
    return { label: 'Neutral', score: 0, probs: { positive: 0.3, negative: 0.3, neutral: 0.4 } };
  }),
  warmupSentiment: vi.fn(async () => {})
}));

describe('API Endpoints', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/feedback', () => {
    it('should create feedback with valid text and return sentiment', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send({ text: 'This product is absolutely amazing!' })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('text', 'This product is absolutely amazing!');
      expect(response.body).toHaveProperty('sentiment');
      expect(['GOOD', 'BAD', 'NEUTRAL']).toContain(response.body.sentiment);
      expect(response.body).toHaveProperty('confidenceScore');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 400 when text is missing', async () => {
      const response = await request(app).post('/api/feedback').send({}).expect('Content-Type', /json/).expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when text is empty', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send({ text: '   ' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body.message).toContain('empty');
    });

    it('should return 400 when text exceeds 1000 characters', async () => {
      const longText = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/feedback')
        .send({ text: longText })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body.message).toContain('1000 characters');
    });

    it('should return 400 when text is not a string', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send({ text: 12345 })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body.message).toContain('string');
    });

    it('should accept text at exactly 1000 characters', async () => {
      const text = 'a'.repeat(1000);
      const response = await request(app)
        .post('/api/feedback')
        .send({ text })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.text).toHaveLength(1000);
    });
  });

  describe('GET /api/feedback', () => {
    beforeAll(async () => {
      await request(app).post('/api/feedback').send({ text: 'Great product!' });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/feedback').expect('Content-Type', /json/).expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return feedback list with valid authentication', async () => {
      const response = await request(app)
        .get('/api/feedback')
        .auth(process.env.ADMIN_USERNAME || 'admin', process.env.ADMIN_PASSWORD || 'admin123')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('feedback');
      expect(Array.isArray(response.body.feedback)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
    });

    it('should return 401 with invalid credentials', async () => {
      const response = await request(app).get('/api/feedback').auth('wrong', 'credentials').expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/feedback?limit=5&offset=0')
        .auth(process.env.ADMIN_USERNAME || 'admin', process.env.ADMIN_PASSWORD || 'admin123')
        .expect(200);

      expect(response.body.limit).toBe(5);
      expect(response.body.offset).toBe(0);
      expect(response.body.feedback.length).toBeLessThanOrEqual(5);
    });

    it('should support sentiment filtering', async () => {
      const response = await request(app)
        .get('/api/feedback?sentiment=GOOD')
        .auth(process.env.ADMIN_USERNAME || 'admin', process.env.ADMIN_PASSWORD || 'admin123')
        .expect(200);

      expect(response.body.feedback.every((f: { sentiment?: string }) => !f.sentiment || f.sentiment === 'GOOD')).toBe(true);
    });
  });
});
