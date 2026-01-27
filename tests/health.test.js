/**
 * Health Check Endpoint Tests
 * Tests for /health and /ready endpoints that are critical for orchestration
 */

const request = require('supertest');

// Mock the Express app for testing
const express = require('express');
const app = express();

// Set up minimal app configuration for testing
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/ready', (req, res) => {
  if (!process.env.STABILITY_API_KEY) {
    res.status(500).json({ status: 'error', message: 'API credentials missing' });
    return;
  }
  res.status(200).json({ status: 'API Key ready to be used', timestamp: new Date() });
});

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 status with ok message', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return valid JSON', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.body).toBeInstanceOf(Object);
    });
  });

  describe('GET /ready', () => {
    it('should return 200 when STABILITY_API_KEY is set', async () => {
      process.env.STABILITY_API_KEY = 'test-key';

      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body.status).toContain('API Key');

      delete process.env.STABILITY_API_KEY;
    });

    it('should return 500 when STABILITY_API_KEY is missing', async () => {
      delete process.env.STABILITY_API_KEY;

      const response = await request(app)
        .get('/ready')
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('API credentials');
    });
  });
});
