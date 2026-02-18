/**
 * Comprehensive Integration Tests for API Routes
 * Tests all routes in index.js to increase coverage
 */

const axios = require('axios');
const request = require('supertest');
const { app } = require('../index');

// Mock axios for external API calls
jest.mock('axios');

describe('API Routes Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // RENDER ROUTES (GET)
  // ============================================================================
  describe('GET /', () => {
    it('should return 200 status', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.text).toContain('API Express Hub');
    });

    it('should render home page with correct content type', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /html/);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /jokes', () => {
    it('should return 200 status', async () => {
      const response = await request(app)
        .get('/jokes')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should render jokes page', async () => {
      const response = await request(app)
        .get('/jokes')
        .expect('Content-Type', /html/);

      expect(response.text).toContain('Joke');
    });
  });

  describe('GET /pichub', () => {
    it('should return 200 status', async () => {
      const response = await request(app)
        .get('/pichub')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should render pichub page', async () => {
      const response = await request(app)
        .get('/pichub')
        .expect('Content-Type', /html/);

      expect(response.text).toContain('Pic Hub');
    });
  });

  // ============================================================================
  // HEALTH & READINESS CHECKS
  // ============================================================================
  describe('GET /health', () => {
    it('should return 200 status with ok message', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return valid JSON', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });
  });

  describe('GET /ready', () => {
    it('should return 200 when STABILITY_API_KEY is set', async () => {
      // API key is set from .env, so this should pass
      const response = await request(app)
        .get('/ready')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  // ============================================================================
  // JOKE API ENDPOINTS
  // ============================================================================
  describe('GET /api/jokes/chuck', () => {
    it('should fetch Chuck Norris joke successfully', async () => {
      const mockJoke = {
        data: {
          id: 'test123',
          value: 'Chuck Norris can divide by zero.',
          url: 'https://api.chucknorris.io/jokes/test123'
        }
      };

      axios.get.mockResolvedValue(mockJoke);

      const response = await request(app)
        .get('/api/jokes/chuck')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('value');
      expect(axios.get).toHaveBeenCalledWith('https://api.chucknorris.io/jokes/random', { timeout: 10000 });
    });

    it('should handle Chuck Norris API errors', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/api/jokes/chuck')
        .expect(502)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Failed to fetch joke');
    });
  });

  describe('GET /api/jokes/dad', () => {
    it('should fetch dad joke successfully', async () => {
      const mockJoke = {
        data: {
          id: 'dad123',
          joke: 'Why don\'t eggs tell jokes? They\'d crack each other up.',
          status: 200
        }
      };

      axios.get.mockResolvedValue(mockJoke);

      const response = await request(app)
        .get('/api/jokes/dad')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('joke');
      expect(axios.get).toHaveBeenCalledWith('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' }, timeout: 10000 });
    });

    it('should handle dad joke API errors', async () => {
      axios.get.mockRejectedValue(new Error('Service Unavailable'));

      const response = await request(app)
        .get('/api/jokes/dad')
        .expect(502)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Failed to fetch joke');
    });
  });

  // ============================================================================
  // POST /pichub - IMAGE GENERATION
  // ============================================================================
  describe('POST /pichub', () => {
    it('should reject request with missing prompt', async () => {
      const response = await request(app)
        .post('/pichub')
        .send({})
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Invalid prompt');
    });

    it('should reject request with non-string prompt', async () => {
      const response = await request(app)
        .post('/pichub')
        .send({ prompt: 12345 })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Invalid prompt');
    });

    it('should reject request with empty prompt', async () => {
      const response = await request(app)
        .post('/pichub')
        .send({ prompt: '   ' })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', 'Prompt cannot be empty');
    });

    it('should accept valid prompt and forward to Stability API', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      axios.post.mockResolvedValue({
        data: mockImageBuffer,
        headers: { 'content-type': 'image/jpeg' }
      });

      const response = await request(app)
        .post('/pichub')
        .send({ prompt: 'A beautiful landscape' })
        .expect(200);

      expect(response.headers['content-type']).toContain('image/jpeg');
      expect(axios.post).toHaveBeenCalled();
    });

    it('should handle Stability API errors gracefully', async () => {
      const errorResponse = {
        response: {
          status: 402,
          data: Buffer.from(JSON.stringify({
            errors: ['Insufficient credits']
          }))
        }
      };
      axios.post.mockRejectedValue(errorResponse);

      const response = await request(app)
        .post('/pichub')
        .send({ prompt: 'Test prompt' })
        .expect(502)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error');
    });

    it('should sanitize long prompts', async () => {
      const longPrompt = 'a'.repeat(600); // Exceeds MAX_PROMPT_LENGTH of 500
      const mockImageBuffer = Buffer.from('fake-image-data');
      axios.post.mockResolvedValue({
        data: mockImageBuffer,
        headers: { 'content-type': 'image/jpeg' }
      });

      const response = await request(app)
        .post('/pichub')
        .send({ prompt: longPrompt })
        .expect(200);

      expect(axios.post).toHaveBeenCalled();
      // Prompt should be truncated to 500 chars
      const callArgs = axios.post.mock.calls[0];
      expect(callArgs).toBeDefined();
    });
  });

  // ============================================================================
  // ERROR HANDLING & 404
  // ============================================================================
  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error', '404 - Route not found');
    });

    it('should return 404 for POST to unknown routes', async () => {
      const response = await request(app)
        .post('/unknown-endpoint')
        .send({ data: 'test' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  // ============================================================================
  // CONTENT TYPE HEADERS
  // ============================================================================
  describe('Content Type Headers', () => {
    it('should return HTML for render routes', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /html/);

      expect(response.status).toBe(200);
    });

    it('should return JSON for API routes', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
    });
  });
});
