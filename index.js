const express = require("express");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

//Environment Vars Request from .env + Verification Check
if (!process.env.STABILITY_API_KEY) {
  console.error("❌ API credentials missing. Exiting...");
  process.exit(1);
}
console.log("✅ API credentials configured");  // Don't log actual key status

const app = express();
const port = process.env.PORT || 4747;
const env = process.env.NODE_ENV || 'development';
//console.dir(app);
//const { title } = require("process");

const path = require("path");
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Global Promise Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

//Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

//StaticFileServing
app.use('/resources', express.static(path.join(__dirname, 'resources')))
app.use('/scripts', express.static('resources/scripts'));
app.use('/styles', express.static('resources/styles'));
app.use('/images', express.static('resources/images'));

//JSON body parsing for API routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Sets security headers
app.use(helmet());

//Rate Limiting Middleware
const limiter = rateLimit({

  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  //exclude my IP from rate limiting
  skip: (req) => {
    const myIP = '::1'; // Replace with your actual IP address
    return req.ip === myIP;
  },
  max: 2, // 2 requests per visiting IP
  message: 'Too many requests, please try again later and make sure to maximize your prompt quality! 🚀' + '\nIncreased requests coming soon as well as User & Generated Data Storage options for more continued magic moments =)',
});

// To log each time someone hits the joke API, we use middleware placed before the '/jokes' route handler.
// This middleware will execute for every request to '/jokes' and log the timestamp and request details.
app.use(['/', '/jokes', ('/pichub', limiter)], (req, res, next) => {
  try {
    const currentTime = new Date().toLocaleString();
    console.log(`Access Log: ${req.method} ${req.originalUrl} from ${req.ip} at ${currentTime}`);
  } catch (error) {
    console.error("Error logging route access:", error);
  }
  next(); // Proceed to the next middleware or route handler
});

//Homepage renders
app.get("/", (req, res) => {
  res.render("home.ejs", { title: "API Express Hub" });
});


//JokeHubRenders

app.get('/jokes', (req, res) => {
  console.log(req.body);
  res.render('jokes.ejs', {
    title: "Joke Generator",
    headline: "👇 Get your daily dose of API fetched laughter all in one place! 👇",
    welcomeMessage: "Welcome to JokeHub! Your go-to destination for a daily dose of laughter." + "\n" + "Whether you're in the mood for classic dad jokes or some legendary Chuck Norris humor, we've got you covered! 🤝 "
  }
  );
});

//PicHubRenders

app.get('/pichub', (req, res) => {
  console.log(`Rendering picgen.ejs. Device_IPAdd: ${req.ip} || TimeStamp: ${new Date().toLocaleString()} `);
  res.render('picgen.ejs', {
    title: "Pic Hub",
    description: "Welcome to PicHub! A place to find or inspire enlightenment through imagery -- (Nas' Voice) the choice is yours! 📸"
  });
})

// Proxy route to call Stability AI (server-side) and forward image binary to client
// This keeps the API key server-side and avoids exposing it in client code.
app.post('/pichub', async (req, res) => {
  console.log(`POST request received on ${req.originalUrl} from IP: ${req.ip} with prompt: ${JSON.stringify(req.body.prompt.substring(0, 20))} ...  || TimeStamp: ${new Date().toString()} `);
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

    //   const payload = {
    //     samples: 1,
    //    cfg_scale: 7.0,
    //    style_preset: 'photographic',
    //   output_format: 'jpeg',
    //     aspect_ratio: '16:9',
    //  model: 'sd3.5-flash',
    //    prompt: prompt,
    //    };

    // 1. Create a new form object from the installed library
    const form = new FormData();

    // 2. Append the payload JSON string with the proper Content-Type
    //    form.append('payload', JSON.stringify(payload), {
    //      contentType: 'application/json', }); // Specify content type for this part
    form.append('prompt', cleanPrompt);
    form.append('model', 'sd3.5-flash'); // Use 'sd3.5-large' or 'sd3-medium' (check your tier/credits)
    form.append('output_format', 'jpeg');
    form.append('aspect_ratio', '1:1'); // SD3 often uses aspect_ratio instead of width/height

    // Optional parameters (if supported by the specific model version)
    form.append('cfg_scale', 6.5);
    form.append('style_preset', 'photographic');

    // 3. Make the POST request to Stability AI's Diffusion endpoint
    const response = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/generate/sd3',
      form,
      {
        headers: {
          // 3. Get the required 'Content-Type: multipart/form-data; boundary=...' header from the form object
          ...form.getHeaders(),
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Accept': 'image/*',
        },
        responseType: 'arraybuffer',
      }
    );

    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(response.data));

  } catch (err) {
    //DetailedErrorLogging: This will tell you EXACTLY why the 400 happened
    if (err.response && err.response.data) {
      const errorDetail = Buffer.from(err.response.data).toString();
      console.error('Stability AI Error Details:', errorDetail);
    }
    console.error('Error proxying to Stability AI:', err && err.message);
    return res.status(502).json({ error: 'failed to generate image' });
  }
});

//hEALthCheckEndpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

//PortLog
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port} || ${new Date()}`);
});

//End of File


// app.get('/resources/styles/styler.css', (req, res) => {
//   // Make sure the path to the file is correct on your server
//   res.sendFile(__dirname + '/resources/styles/styler.css', {
//     headers: {
//       'Content-Type': 'text/css'
//     }
//   });
// });

