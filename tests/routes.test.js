/**
 * Example Integration Test
 * Template for testing API routes
 */

const request = require('supertest');
const express = require('express');

describe('API Routes Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Setup basic routes for testing
    app.get('/', (req, res) => {
      res.render('home.ejs');
    });

    app.get('/jokes', (req, res) => {
      res.render('jokes.ejs', {
        title: 'Joke Generator',
        headline: 'Get your daily dose of laughter'
      });
    });

    app.get('/pichub', (req, res) => {
      res.render('picgen.ejs', {
        title: 'Pic Hub',
        description: 'Generate random pictures'
      });
    });
  });

  describe('Home Route', () => {
    it('should return 200 status', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Since we're mocking, just check that no error occurred
      expect(response.status).toBe(200);
    });
  });

  describe('Content Type Headers', () => {
    it('should return correct content-type headers', async () => {
      // Health check should return JSON
      const app2 = express();
      app2.get('/health', (req, res) => {
        res.json({ status: 'ok' });
      });

      const response = await request(app2)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
    });
  });
});
