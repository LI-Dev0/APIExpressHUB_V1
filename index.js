const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const FormData = require('form-data');
const winston = require('winston');
require('dotenv').config();

const app = express();
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

const requiredEnvVars = ['STABILITY_API_KEY'];
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
      imgSrc: ['\'self\'', 'data:', 'https:', 'https://picsum.photos', 'https://api.stability.ai'],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdn.jsdelivr.net'],
      scriptSrc: ['\'self\'', 'https://cdn.jsdelivr.net'],
      connectSrc: [
        '\'self\'',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css.map',
        'https://api.stability.ai',
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
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4747').split(',');
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

// PicHubRenders
app.get('/pichub', (req, res) => {
  logger.info(`Rendering picgen.ejs. Device_IPAdd: ${req.ip} || TimeStamp: ${new Date().toLocaleString()} `);
  res.render('picgen.ejs', {
    title: 'Pic Hub',
    description: 'Welcome to PicHub! A place to find or inspire enlightenment through imagery -- (Nas\' Voice) the choice is yours! 📸',
  });
});

// Proxy route to call Stability AI (server-side) and forward image binary to client
// This keeps the API key server-side and avoids exposing it in client code.
// eslint-disable-next-line consistent-return
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
    form.append('model', 'sd3.5-medium'); // Use 'sd3.5-large' or 'sd3-medium' (check your tier/credits)
    form.append('output_format', 'jpeg');
    form.append('cfg_scale', 7.0); // controls the level of configuration adaptation to prompt specification. 0 -> don't align to prompt spec | 10 -> align to prompt fully

    // Optional parameters (if supported by the specific model version)
    // 3. Make the POST request to Stability AI's Diffusion endpoint
    form.append('style_preset', 'photographic'); // 'photographic', 'digital-art', 'analog-film', low-poly, comic-book, fantasy-art etc.

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
        timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || 30000, 10), // 30 second timeout
      },
    );

    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(response.data));
  } catch (err) {
    // Detailed Error Logging: Decode ArrayBuffer responses from Stability AI
    if (err.response) {
      // err.response.data is an ArrayBuffer when responseType is 'arraybuffer'
      // We need to decode it to read the actual API error message
      let errorMessage = 'Unknown error';
      let statusCode = err.response.status || 502;

      try {
        // Node.js Buffer is returned when responseType: 'arraybuffer' is set
        if (Buffer.isBuffer(err.response.data) || err.response.data instanceof ArrayBuffer || err.response.data instanceof Uint8Array) {
          const decoder = new TextDecoder('utf-8');
          const decodedText = decoder.decode(err.response.data);
          const errorJson = JSON.parse(decodedText);
          errorMessage = errorJson.message || errorJson.errors?.[0] || errorJson.error || decodedText;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data && typeof err.response.data === 'object') {
          errorMessage = err.response.data.message || err.response.data.error || JSON.stringify(err.response.data);
        } else {
          errorMessage = String(err.response.data);
        }
      } catch (parseErr) {
        errorMessage = `API Error (Status ${statusCode}): ${err.message}`;
      }

      logger.error(`❌ Stability AI API Error (${statusCode}): ${errorMessage}`);
      return res.status(statusCode === 401 || statusCode === 403 ? 401 : 502).json({
        error: 'Failed to generate image. Please try again or contact support if the issue persists.'
      });
    }

    // Handle network errors, timeouts, and other non-response errors
    let errorDetails = err.message || String(err);
    
    // Handle AggregateError (multiple errors)
    if (err.errors && Array.isArray(err.errors)) {
      errorDetails = `AggregateError: ${err.errors.map(e => e.message || String(e)).join('; ')}`;
    }
    // Handle specific network error codes
    else if (err.code) {
      errorDetails = `${err.code}: ${err.message || err.syscall || 'Network error'}`;
    }
    
    logger.error(`❌ Error proxying to Stability AI: ${errorDetails}`);
    
    // Map specific error codes to appropriate HTTP status codes
    let statusCode = 500;
    if (err.code === 'ECONNABORTED') statusCode = 504; // Gateway Timeout
    else if (err.code === 'ENOTFOUND') statusCode = 503; // Service Unavailable (DNS issue)
    else if (err.code === 'ECONNREFUSED') statusCode = 503; // Service Unavailable (connection refused)
    else if (err.code === 'ETIMEDOUT') statusCode = 504; // Gateway Timeout
    
    res.status(statusCode).json({ error: 'Failed to connect to image generation service. Please try again later.' });
  }
});

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
// ============================================================================
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
// ============================================================================
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