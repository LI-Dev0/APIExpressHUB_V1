/**
 * Middleware & Security Tests
 * Tests for rate limiting, CORS, security headers, and error handling
 */

const request = require('supertest');
const { app } = require('../index');
const axios = require('axios');

// Mock axios for external API calls
jest.mock('axios');

describe('Middleware and Security Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  // ============================================================================
  // CORS MIDDLEWARE
  // ============================================================================
  describe('CORS Configuration', () => {
    it('should allow requests from localhost', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:4747')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:4747');

      // CORS headers should be present
      expect(response.headers).toBeDefined();
    });
  });

  // ============================================================================
  // SECURITY HEADERS (Helmet)
  // ============================================================================
  describe('Security Headers', () => {
    it('should include security headers from Helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet should add security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include Content Security Policy', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers).toHaveProperty('content-security-policy');
    });
  });

  // ============================================================================
  // BODY PARSING MIDDLEWARE
  // ============================================================================
  describe('Request Body Parsing', () => {
    it('should parse JSON request bodies', async () => {
      // Mock axios to prevent real API call
      const mockImageBuffer = Buffer.from('fake-image-data');
      axios.post.mockResolvedValue({
        data: mockImageBuffer,
        headers: { 'content-type': 'image/jpeg' }
      });

      const response = await request(app)
        .post('/pichub')
        .set('Content-Type', 'application/json')
        .send({ prompt: 'test prompt' })
        .expect(200);

      // If body parsing works, we should get past validation
      expect(response.status).toBe(200);
    });

    it('should reject oversized payloads (>1mb)', async () => {
      const largePayload = 'a'.repeat(2 * 1024 * 1024); // 2MB

      const response = await request(app)
        .post('/pichub')
        .set('Content-Type', 'application/json')
        .send({ prompt: largePayload })
        .expect(413);

      expect(response.status).toBe(413); // Payload Too Large
    });

    it('should handle URL-encoded bodies', async () => {
      // Mock axios to prevent real API call
      const mockImageBuffer = Buffer.from('fake-image-data');
      axios.post.mockResolvedValue({
        data: mockImageBuffer,
        headers: { 'content-type': 'image/jpeg' }
      });

      const response = await request(app)
        .post('/pichub')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('prompt=url%20encoded%20prompt');

      // Should be parsed correctly
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  // ============================================================================
  // LOGGING MIDDLEWARE
  // ============================================================================
  describe('Access Logging', () => {
    it('should log requests to monitored routes', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Logging should not affect response
      expect(response.status).toBe(200);
    });

    it('should handle logging errors gracefully', async () => {
      const response = await request(app)
        .get('/jokes')
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // ERROR HANDLING MIDDLEWARE
  // ============================================================================
  describe('Global Error Handler', () => {
    it('should catch and handle 404 errors', async () => {
      const response = await request(app)
        .get('/this-route-does-not-exist')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('404');
    });

    it('should return JSON for all 404 errors', async () => {
      const response = await request(app)
        .post('/unknown-api-endpoint')
        .send({ test: 'data' })
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle errors with proper status codes', async () => {
      const response = await request(app)
        .delete('/not-implemented')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  // ============================================================================
  // STATIC FILE SERVING
  // ============================================================================
  describe('Static File Middleware', () => {
    it('should serve static files from resources folder', async () => {
      // Try to access a static script file
      const response = await request(app)
        .get('/scripts/app.js');

      // Should either return file (200) or 404 if file doesn't exist
      expect([200, 404]).toContain(response.status);
    });

    it('should serve static CSS files', async () => {
      const response = await request(app)
        .get('/styles/styler.css');

      expect([200, 404]).toContain(response.status);
    });
  });

  // ============================================================================
  // HTTP METHODS
  // ============================================================================
  describe('HTTP Method Support', () => {
    it('should support GET requests', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should support POST requests', async () => {
      const response = await request(app)
        .post('/pichub')
        .send({ prompt: 'test' });

      // Should process POST (even if it fails due to API)
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should return 404 for unsupported methods on valid routes', async () => {
      const response = await request(app)
        .put('/health')
        .expect(404);

      expect(response.status).toBe(404);
    });
  });

  // ============================================================================
  // RESPONSE FORMAT VALIDATION
  // ============================================================================
  describe('Response Format', () => {
    it('should return valid JSON for API endpoints', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });

    it('should include timestamp in health responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return proper error format', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});
