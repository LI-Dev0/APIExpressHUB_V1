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
//console.dir(app);
//const { title } = require("process");

const path = require("path");
const { json } = require('stream/consumers');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Logger Setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ],
});

//Global Promise Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

//Global Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

//StaticFileServing
app.use(express.static(path.join(__dirname, 'resources')));
app.use('/scripts', express.static('resources/scripts'));
app.use('/styles', express.static('resources/styles'));
app.use('/images', express.static('resources/images'));

//JSON body parsing for API routes - PHASE 1 FIX: Added size limits
app.use(express.json({ limit: '1mb' })); // Prevent DDoS via large payloads
app.use(express.urlencoded({ limit: '1mb', extended: true }));

//Sets security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "https://picsum.photos"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://api.stability.ai", "https://icanhazdadjoke.com", "https://api.deepai.org", "https://api.chucknorris.io/jokes/random", "https://github.com"],
//      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"]
    }
  }
}));
app.use(cors({
  origin: '*', // Adjust this in production to restrict origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global Error Handling Middleware (AFTER body parsing)
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Rate Limiting Middleware - PHASE 1 FIX
// Increased from 2 to 100 requests per hour for development,, forced back to 2
// Set to 30/hour in production via RATE_LIMIT_MAX env var
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 3600000), // 1 hour default
  skip: (req) => {
    // Skip rate limiting for localhost or specific IPs (development only)
    const myIP = process.env.MY_IP || '127.0.0.1';
    const clientIP = req.ip || req.connection.remoteAddress;
    // Support X-Forwarded-For for Docker/load balancer environments
    const forwardedIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    const effectiveIP = forwardedIP || clientIP;
    const isLocalhost = effectiveIP === '::1' || effectiveIP === '127.0.0.1' || effectiveIP === myIP;
    return isLocalhost && process.env.NODE_ENV === 'development';
  },
  max: parseInt(process.env.RATE_LIMIT_MAX || 50), // 100/hour dev(2!), 30/hour prod
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
  message: 'Too many requests, please try again later and maximize your prompt quality! 🚀\nFor increased limits, contact support.',
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests' });
  },
});

// To log each time someone hits the joke API, we use middleware placed before the '/jokes' route handler.
// This middleware will execute for every request to '/jokes' and log the timestamp and request details.
app.use(['/', '/jokes', '/pichub'], (req, res, next) => {
  try {
    const currentTime = new Date().toLocaleString();
    logger.info(`Access Log: ${req.method} ${req.originalUrl} from ${req.ip} at ${currentTime}`);
  } catch (error) {
    logger.error("Error logging route access:", error);
  }
  next(); // Proceed to the next middleware or route handler
});

//HomepageRenders
app.get("/", (req, res) => {
  res.render("home.ejs", { title: "API Express Hub" });
});

//JokeHubRenders
app.get('/jokes', (req, res) => {
//  console.log(req);
  res.render('jokes.ejs', {
    title: "Joke Generator",
    headline: "👇 Get your daily dose of API fetched laughter all in one place! 👇",
    welcomeMessage: "Welcome to JokeHub! Your go-to destination for a daily dose of laughter." + "\n" + "Whether you're in the mood for classic dad jokes or some legendary Chuck Norris humor, we've got you covered! 🤝 "
  }
  );
});

//PicHubRenders
app.get('/pichub', (req, res) => {
  logger.info(`Rendering picgen.ejs. Device_IPAdd: ${req.ip} || TimeStamp: ${new Date().toLocaleString()} `);
  res.render('picgen.ejs', {
    title: "Pic Hub",
    description: "Welcome to PicHub! A place to find or inspire enlightenment through imagery -- (Nas' Voice) the choice is yours! 📸"
  });
})

// Proxy route to call Stability AI (server-side) and forward image binary to client
// This keeps the API key server-side and avoids exposing it in client code.
app.post('/pichub', limiter, async (req, res) => {
  logger.warn(`POST request received on ${req.originalUrl} from IP: ${req.ip} with prompt: ${JSON.stringify(req.body.prompt.substring(0, 20))} ...  || TimeStamp: ${new Date().toString()} `);
  try {
    //Destructure the 'prompt' property from the parsed request body (req.body). Then validate and trim
    const { prompt } = req.body;

    const MAX_PROMPT_LENGTH = 500;
    const sanitizePrompt = (str) => str.trim().substring(0, MAX_PROMPT_LENGTH);

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    const cleanPrompt = sanitizePrompt(prompt);
    if (cleanPrompt.length === 0) {
      alert('Prompt cannot be empty ;-)');
      //return res.status(400).json({ error: 'Prompt required' });
      //    redirect
    }

    // 1. Create a new form object from the installed library
    const form = new FormData();

    // 2. Append the payload JSON string with the proper Content-Type
    //    form.append('payload', JSON.stringify(payload), {
    //      contentType: 'application/json', }); // Specify content type for this part
    form.append('prompt', cleanPrompt);
    form.append('model', 'sd3.5-flash'); // Use 'sd3.5-large' or 'sd3-medium' (check your tier/credits)
    form.append('output_format', 'jpeg');
    form.append('aspect_ratio', '16:9'); // SD3 often uses aspect_ratio instead of width/height

    // Optional parameters (if supported by the specific model version)
    form.append('cfg_scale', 7); // controls the level of config adaptation to promt specification.. 0->don't align to prompt spec | 10> align to prompt fully
    form.append('style_preset', 'cinematic');

    // 3. Make the POST request to Stability AI's Diffusion endpoint
    // PHASE 1 FIX: Added timeout to prevent requests hanging indefinitely
    const response = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/generate/sd3',
      form,
      {
        headers: {
          // Get the required 'Content-Type: multipart/form-data; boundary=...' header from the form object
          ...form.getHeaders(),
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Accept': 'image/*',
        },
        responseType: 'arraybuffer',
        timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || 30000), // 30 second timeout
      }
    );

    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(response.data));

  } catch (err) {
    //DetailedErrorLogging: This will tell you EXACTLY why the 400 happened
    if (err.response && err.response.data) {
      const errorDetail = Buffer.from(err.response.data).toString();
      logger.error('Stability AI Error Details:', errorDetail);
    }
    logger.error('Error proxying to Stability AI:', err && err.message);
    return res.status(502).json({ error: 'failed to generate image' });
  }
});

//hEALthCheckEndpoint
app.get('/health', (req, res) => {
  logger.info("✅ API credentials configured");  // Don't log actual key status
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/ready', (req, res) => {
  //Environment Vars Request from .env + Verification Check
if (!process.env.STABILITY_API_KEY) {
  logger.error("❌ API credentials missing. Exiting...");
  res.status(500).json({ status: 'error', message: 'API credentials missing' });
  process.exit(1);
}
logger.info("✅ API credentials configured");  // Don't log actual key status
  res.status(200).json({ status: 'API Key ready to be used', timestamp: new Date() });
});

//PortLog
const server = app.listen(port, () => {
  logger.info(`✅ Server is running on http://localhost:${port} || ${new Date()}`);
});

// PHASE 1 FIX: Graceful Shutdown Handlers
// Allows 30 seconds for in-flight requests to complete before force-killing
// Critical for Docker/Kubernetes container orchestration
process.on('SIGTERM', gracefulShutdown('SIGTERM'));
process.on('SIGINT', gracefulShutdown('SIGINT'));

function gracefulShutdown(signal) {
  return () => {
    logger.info(`${signal} signal received: closing HTTP server gracefully`);
    
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds if requests don't complete
    setTimeout(() => {
      logger.error('Forcing shutdown after 30s timeout');
      process.exit(1);
    }, 30000);
  };
}

//End of File


// app.get('/resources/styles/styler.css', (req, res) => {
//   // Make sure the path to the file is correct on your server
//   res.sendFile(__dirname + '/resources/styles/styler.css', {
//     headers: {
//       'Content-Type': 'text/css'
//     }
//   });
// });


    //   const payload = {
    //     samples: 1,
    //    cfg_scale: 7.0,
    //    style_preset: 'photographic',
    //   output_format: 'jpeg',
    //     aspect_ratio: '16:9',
    //  model: 'sd3.5-flash',
    //    prompt: prompt,
    //    };