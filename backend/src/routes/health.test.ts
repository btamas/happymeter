import { describe, it, expect, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pool } from '../db/index.js';

describe('Health Check Endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/health', () => {
    it('should return 200 with ok status when database is connected', async () => {
      const response = await request(app).get('/api/health').expect('Content-Type', /json/).expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.body).toHaveProperty('timestamp');

      // Verify timestamp is a valid ISO 8601 date string
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 5000); // Within last 5 seconds
    });

    it('should return 503 when database connection fails', async () => {
      // Mock pool.query to simulate database failure
      const originalQuery = pool.query;
      pool.query = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const response = await request(app).get('/api/health').expect('Content-Type', /json/).expect(503);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('database', 'disconnected');
      expect(response.body).toHaveProperty('timestamp');

      // Verify timestamp is still provided even on error
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);

      // Restore original query function
      pool.query = originalQuery;
    });

    it('should have correct response structure', async () => {
      const response = await request(app).get('/api/health').expect(200);

      // Verify response has exactly the expected keys
      const keys = Object.keys(response.body).sort();
      expect(keys).toEqual(['database', 'status', 'timestamp']);
    });

    it('should not require authentication', async () => {
      // Health endpoint should be publicly accessible
      const response = await request(app).get('/api/health').expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should handle multiple concurrent requests', async () => {
      // Test that the health check can handle concurrent requests
      const requests = Array(5)
        .fill(null)
        .map(() => request(app).get('/api/health'));

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.database).toBe('connected');
      });
    });
  });
});
