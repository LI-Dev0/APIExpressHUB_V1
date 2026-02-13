const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const FormData = require('form-data');
const winston = require('winston');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // ✅ Enable proxy trust

const port = process.env.PORT || 4747;
const env = process.env.NODE_ENV || 'development';
// console.dir(app);
// const { title } = require("process");

const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// const { json } = require('stream/consumers');
/**
 * Imports the `json` consumer utility from Node.js stream/consumers module.
 *
 * The `json` consumer is used to consume a Readable stream and parse its
 * data as JSON, returning a Promise that resolves with the parsed JSON object.
 *
 * Useful for:
 * - Parsing JSON from HTTP request streams
 * - Converting streamed data into parsed JavaScript objects
 * - Handling large JSON payloads without loading entire content into memory at once
*/

// -----------------------------------------
// LOGGER SETUP
// -----------------------------------------
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' }),
  ],
});

// -----------------------------------------
// VALIDATE REQUIRED API VARIABLES
// -----------------------------------------

const requiredEnvVars = ['STABILITY_API_KEY', 'LEONARDO_API_KEY'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

logger.info('✅ All required environment variables configured');

// ============================================================================
// STATIC FILE SERVING
// ============================================================================
app.use(express.static(path.join(__dirname, 'resources')));
app.use('/images', express.static(path.join(__dirname, 'resources/images')));
// ============================================================================
// BODY PARSING MIDDLEWARE - WITH SIZE LIMITS
// ============================================================================
app.use(express.json({ limit: '1mb' })); // Prevent DDoS via large payloads
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'blob:', 'https:', 'https://picsum.photos', 'https://api.stability.ai', 'https://cdn.leonardo.ai'],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdn.jsdelivr.net'],
      scriptSrc: ['\'self\'', 'https://cdn.jsdelivr.net'],
      connectSrc: [
        '\'self\'',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css.map',
        'https://api.stability.ai',
        'https://api.leonardo.ai',
        'https://cdn.leonardo.ai',
        'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js.map',
        'https://icanhazdadjoke.com',
        'https://api.deepai.org',
        'https://api.chucknorris.io',
      ],
    },
  },
}));

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4747,https://apiexpresshubv1-production.up.railway.app').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS denied for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================
// Increased from 2 to 100 requests per hour for development,, forced back to 2
// Set to 30/hour in production for safety via env variable
const limiter = rateLimit({
  // set rate limit window and max from env variables or defaults
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 11100000, 10), // 3 hrs + parseInt param 10
  skip: (req) => {
    // Skip rate limiting for localhost or specific IPs (development only)
    const myIP = process.env.MY_IP || '127.0.0.1';
    const clientIP = req.ip || req.connection.remoteAddress;
    // Support X-Forwarded-For for Docker/load balancer environments
    const forwardedIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    const effectiveIP = forwardedIP || clientIP;

    return effectiveIP === '::1' || effectiveIP === '127.0.0.1' || effectiveIP === myIP;
  },
  max: parseInt(process.env.RATE_LIMIT_MAX || 10, 10), // 100/hour dev(2!), 30/hour prod, hard 10
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: 'Too many requests, please try again later and maximize your prompt quality! 🚀\nFor increased limits, contact support.',
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests' });
  },
});

// This middleware executes for every request to '/jokes' and log the timestamp and request details.
app.use(['/', '/jokes', '/pichub'], (req, res, next) => {
  try {
    const currentTime = new Date().toLocaleString();
    logger.info(`Access Log: ${req.method} ${req.originalUrl} from ${req.ip} at ${currentTime}`);
  } catch (error) {
    logger.error('Error logging route access:', error);
  }
  next(); // Proceed to the next middleware or route handler
});

// HomepageRenders
app.get('/', (req, res) => {
  res.render('home.ejs', { title: 'API Express Hub', env });
});

// JokeHubRenders
app.get('/jokes', (req, res) => {
  // console.log(req);
  res.render('jokes.ejs', {
    title: 'Joke Generator',
    headline: '👇 Get your daily dose of API fetched laughter all in one place! 👇',
    welcomeMessage: 'Welcome to JokeHub! Your go-to destination for a daily dose of laughter.' + '\n' + 'Whether you\'re in the mood for classic dad jokes or some legendary Chuck Norris humor, we\'ve got you covered! 🤝 ',
  });
});

// Chuck Norris Jokes Proxy
app.get('/api/jokes/chuck', async (req, res) => {
  try {
    const response = await axios.get('https://api.chucknorris.io/jokes/random');
    res.json(response.data);
  } catch (err) {
    logger.error('Chuck Norris API error:', err.message);
    res.status(502).json({ error: 'Failed to fetch joke' });
  }
});

// Dad Jokes Proxy
app.get('/api/jokes/dad', async (req, res) => {
  try {
    const config = { headers: { Accept: "application/json" } };
    const response = await axios.get('https://icanhazdadjoke.com/', config);
    res.json(response.data);
  } catch (err) {
    logger.error('Dad Jokes API error:', err.message);
    res.status(502).json({ error: 'Failed to fetch joke' });
  }
});

// PicHubRenders
app.get('/pichub', (req, res) => {
  logger.info(`Rendering picgen.ejs. Device_IPAdd: ${req.ip} || TimeStamp: ${new Date().toLocaleString()} `);
  res.render('picgen.ejs', {
    title: 'Pic Hub',
    description: 'Welcome to PicHub! A place to find or inspire enlightenment through imagery -- (Nas\' Voice) the choice is yours! 📸',
  });
});

// eslint-disable-next-line max-len
// Proxy route to call Stability AI (server-side) and forward image binary to client. This keeps the API key server-side and avoids exposing it in client code.

app.post('/pichub', limiter, async (req, res) => {
  const promptPreview = (req.body && typeof req.body.prompt === 'string')
    ? req.body.prompt.substring(0, 20)
    : 'Invalid or missing prompt';
  logger.warn(`POST request received on ${req.originalUrl} from IP: ${req.ip} with prompt: ${JSON.stringify(promptPreview)} ... || TimeStamp: ${new Date().toString()} `);
  try {
    // Destructure the 'prompt' prop from parsed request body (req.body). Then validate and trim
    const { prompt } = req.body;

    const MAX_PROMPT_LENGTH = 500;
    const sanitizePrompt = (str) => str.trim().substring(0, MAX_PROMPT_LENGTH);

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    const cleanPrompt = sanitizePrompt(prompt);
    if (cleanPrompt.length === 0) {
      logger.warn('Empty prompt received');
      return res.status(400).json({ error: 'Prompt cannot be empty' });
    }

    // 1. Create a new form object from the installed library
    const form = new FormData();

    // 2. Append the payload JSON string with the proper Content-Type
    // form.append('payload', JSON.stringify(payload), {
    //   contentType: 'application/json', }); // Specify content type for this part
    form.append('prompt', cleanPrompt);
    form.append('aspect_ratio', '1:1'); // aspect_ratio is optional but can help control the dimensions of the generated image. Common values: '1:1', '16:9', '4:3'
    form.append('model', 'sd3.5-flash'); // Use 'sd3.5-large' or 'sd3-medium' (check your tier/credits)
    form.append('output_format', 'jpeg'); // 'jpeg' or 'png' or 'webp' (check your tier/credits)
    form.append('cfg_scale', 6.0); // controls the level of configuration adaptation to prompt specification. 0 -> don't align to prompt spec | 10 -> align to prompt fully

    // Optional parameters (if supported by the specific model version)
    // 3. Make the POST request to Stability AI's Diffusion endpoint
    form.append('style_preset', 'analog-film'); // 'photographic', 'digital-art', 'analog-film', low-poly, comic-book, fantasy-art etc.

    // 3. Make the POST request to Stability AI\'s Diffusion endpoint
    // PHASE 1 FIX: Added timeout to prevent requests hanging indefinitely
    const response = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/generate/sd3',
      form,
      {
        headers: {
          // Get the required 'Content-Type: multipart/form-data; etc header from the form object
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: 'image/*',
        },
        responseType: 'arraybuffer',
        timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || 60000, 10), // 1 minute timeout
      },
    );

    // Check if response is actually an image
    if (response.headers['content-type']?.startsWith('image/')) {
      // Process as image
      res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
      res.send(Buffer.from(response.data));
    } else {
      // Handle as error response
      logger.error('Stability AI returned non-image response');
      return res.status(502).json({ error: 'Invalid response from image service' });
    }
  } catch (error) {
    // Detailed Error Logging: Decode ArrayBuffer responses from Stability AI
    if (error.response) {
      // err.response.data is an ArrayBuffer when responseType is 'arraybuffer'
      // We need to decode it to read the actual API error message
      let errorMessage = 'Unknown error';
      let statusCode = error.response.status || 502;

      try {
        // Node.js Buffer is returned when responseType: 'arraybuffer' is set
        if (Buffer.isBuffer(error.response.data) || error.response.data instanceof ArrayBuffer || error.response.data instanceof Uint8Array) {
          const decoder = new TextDecoder('utf-8');
          const decodedText = decoder.decode(error.response.data);
          const errorJson = JSON.parse(decodedText);
          errorMessage = errorJson.message || errorJson.errors?.[0] || errorJson.error || decodedText;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data && typeof error.response.data === 'object') {
          errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
        } else {
          errorMessage = String(error.response.data);
        }
      } catch (parseErr) {
        errorMessage = `API Error (Status ${statusCode}): ${error.message}`;
      }

      logger.error(`❌ Stability AI API Error (${statusCode}): ${errorMessage}`);
      return res.status(statusCode === 401 || statusCode === 403 ? 401 : 502).json({
        error: 'Failed to generate image. Please try again or contact support if the issue persists.'
      });
    }

    // Handle network errors, timeouts, and other non-response errors
    let errorDetails = error.message || String(error);
    
    // Handle AggregateError (multiple errors)
    if (error.errors && Array.isArray(error.errors)) {
      errorDetails = `AggregateError: ${error.errors.map(e => e.message || String(e)).join('; ')}`;
    }
    // Handle specific network error codes
    else if (error.code) {
      errorDetails = `${error.code}: ${error.message || error.syscall || 'Network error'}`;
    }
    
    logger.error(`❌ Error proxying to Stability AI: ${errorDetails}`);
    
    // Map specific error codes to appropriate HTTP status codes
    let statusCode = 500;
    if (error.code === 'ECONNABORTED') statusCode = 504; // Gateway Timeout
    else if (error.code === 'ENOTFOUND') statusCode = 503; // Service Unavailable (DNS issue)
    else if (error.code === 'ECONNREFUSED') statusCode = 503; // Service Unavailable (connection refused)
    else if (error.code === 'ETIMEDOUT') statusCode = 504; // Gateway Timeout
    
    res.status(statusCode).json({ error: 'Failed to connect to image generation service. Please try again later.' });
  }
});

// Leonardo AI Proxy Route - Uses 2-step async generation flow
app.post('/pichubleo', limiter, async (req, res) => {
  const promptPreview = (req.body && typeof req.body.prompt === 'string')
    ? req.body.prompt.substring(0, 20)
    : 'Invalid or missing prompt';
  logger.warn(`POST request received on ${req.originalUrl} from IP: ${req.ip} with prompt: ${JSON.stringify(promptPreview)} ... || TimeStamp: ${new Date().toString()} `);
  try {
    const { prompt } = req.body;

    const MAX_PROMPT_LENGTH = 500;
    const sanitizePrompt = (str) => str.trim().substring(0, MAX_PROMPT_LENGTH);

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }
    const cleanPrompt = sanitizePrompt(prompt);
    if (cleanPrompt.length === 0) {
      logger.warn('Empty prompt received');
      return res.status(400).json({ error: 'Prompt cannot be empty' });
    }

    // STEP 1: Create generation job with Leonardo AI
    const payload = {
      prompt: cleanPrompt,
      modelId: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', // Leonardo Phoenix model (fast & high quality)
      width: 1024,
      height: 1024,
      num_images: 1,
    };

    const createResponse = await axios.post(
      'https://cloud.leonardo.ai/api/rest/v1/generations',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || 60000, 10),
      },
    );

    const generationId = createResponse.data?.sdGenerationJob?.generationId;
    if (!generationId) {
      logger.error('Leonardo AI did not return a generation ID');
      return res.status(502).json({ error: 'Failed to start image generation' });
    }

    logger.info(`Leonardo AI generation started: ${generationId}`);

    // STEP 2: Poll for completion (max 60 seconds, check every 2 seconds)
    let imageUrl = null;
    const maxAttempts = 30;
    const pollInterval = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await axios.get(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
            'Accept': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout for status check
        },
      );

      const generation = statusResponse.data?.generations_by_pk;
      if (generation?.status === 'COMPLETE' && generation?.generated_images?.length > 0) {
        imageUrl = generation.generated_images[0].url;
        logger.info(`Leonardo AI generation completed: ${imageUrl}`);
        break;
      } else if (generation?.status === 'FAILED') {
        logger.error('Leonardo AI generation failed');
        return res.status(502).json({ error: 'Image generation failed' });
      }
      // Status is PENDING, continue polling
    }

    if (!imageUrl) {
      logger.error('Leonardo AI generation timed out');
      return res.status(504).json({ error: 'Image generation timed out. Please try again.' });
    }

    // STEP 3: Fetch the generated image and return it
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(imageResponse.data));

  } catch (error) {
    // Handle API response errors
    if (error.response) {
      let errorMessage = 'Unknown error';
      let statusCode = error.response.status || 502;

      try {
        if (error.response.data && typeof error.response.data === 'object' && !(error.response.data instanceof ArrayBuffer)) {
          errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (Buffer.isBuffer(error.response.data) || error.response.data instanceof ArrayBuffer) {
          const decoder = new TextDecoder('utf-8');
          const decodedText = decoder.decode(error.response.data);
          try {
            const errorJson = JSON.parse(decodedText);
            errorMessage = errorJson.message || errorJson.error || decodedText;
          } catch {
            errorMessage = decodedText;
          }
        } else {
          errorMessage = String(error.response.data);
        }
      } catch (parseErr) {
        errorMessage = `API Error (Status ${statusCode}): ${error.message}`;
      }

      logger.error(`❌ Leonardo AI API Error (${statusCode}): ${errorMessage}`);
      return res.status(statusCode === 401 || statusCode === 403 ? 401 : 502).json({
        error: 'Failed to generate image. Please try again or contact support if the issue persists.'
      });
    }

    // Handle network errors, timeouts, and other non-response errors
    let errorDetails = error.message || String(error);
    
    if (error.errors && Array.isArray(error.errors)) {
      errorDetails = `AggregateError: ${error.errors.map(e => e.message || String(e)).join('; ')}`;
    } else if (error.code) {
      errorDetails = `${error.code}: ${error.message || error.syscall || 'Network error'}`;
    }
    
    logger.error(`❌ Error proxying to Leonardo AI: ${errorDetails}`);
    
    let statusCode = 500;
    if (error.code === 'ECONNABORTED') statusCode = 504;
    else if (error.code === 'ENOTFOUND') statusCode = 503;
    else if (error.code === 'ECONNREFUSED') statusCode = 503;
    else if (error.code === 'ETIMEDOUT') statusCode = 504;
    
    res.status(statusCode).json({ error: 'Failed to connect to image generation service. Please try again later.' });
  }
});

// ============================================================================
// HealthCheckEndpoint
app.get('/health', (req, res) => {
  logger.info('✅ API credentials configured'); // Don't log actual key status
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/ready', (req, res) => {
  // Environment Vars Request from .env + Verification Check
  if (!process.env.STABILITY_API_KEY) {
    logger.error('❌ API credentials missing. Exiting...');
    res.status(500).json({ status: 'error', message: 'API credentials missing' });
    process.exit(1);
  }
  logger.info('✅ API credentials configured'); // Don't log actual key status
  res.status(200).json({ status: 'API Key ready to be used', timestamp: new Date() });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE (MUST BE LAST)

app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: '404 - Route not found' });
});
// Error handler (catches thrown errors from routes)
app.use((err, req, res, next) => {
  logger.error('Unhandled Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ============================================================================

// SERVER LAUNCH & LISTEN

const server = app.listen(port, () => {
  logger.info(`✅ Server is running on http://localhost:${port} || ${new Date()}`);
});

// ============================================================================
// GRACEFUL SHUTDOWN HANDLERS(defined earlier)
// ============================================================================
// Allows 30 seconds for in-flight requests to complete before force-killing
// Critical for Docker/Kubernetes orchestration, prevents request termination during deployments
// Listens for SIGTERM and SIGINT signals and initiates graceful shutdown procedure

// ============================================================================
// GRACEFUL SHUTDOWN FUNCTION
// ============================================================================

function gracefulShutdown(signal) {
  return () => {
    logger.info(`${signal} signal received: closing HTTP server gracefully`);

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forcing shutdown after 30s timeout');
      process.exit(1);
    }, 30000);
  };
}

// ============================================================================
// GLOBAL PROMISE REJECTION & EXCEPTION HANDLERS
// ============================================================================
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  gracefulShutdown('UNHANDLED_REJECTION')();
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION')();
});

process.on('SIGTERM', gracefulShutdown('SIGTERM'));
process.on('SIGINT', gracefulShutdown('SIGINT'));

// -----------------------------------------
// END OF INDEX.JS
// -----------------------------------------