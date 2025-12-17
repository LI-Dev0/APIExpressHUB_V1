const express = require("express");
const app = express();
//console.dir(app);
const port = 4747;
// Removed static time assignment; will generate timestamp dynamically in middleware

const path = require("path");
//const { title } = require("process");

// Load environment variables from .env (do not commit .env to source control)
require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//StaticFileServing
app.use('/resources', express.static(path.join(__dirname, 'resources')))
// Included to serve static files such as CSS and JS
app.use('/scripts', express.static('resources/scripts'));
app.use('/styles', express.static('resources/styles'));
app.use('/images', express.static('resources/images'));
app.use('/scripts', express.static('resources/scripts/pic.js'));
// parse JSON bodies for our API routes
app.use(express.json());

// app.get('/resources/styles/styler.css', (req, res) => {
//   // Make sure the path to the file is correct on your server
//   res.sendFile(__dirname + '/resources/styles/styler.css', {
//     headers: {
//       'Content-Type': 'text/css'
//     }
//   });
// });
// To log each time someone hits the joke API, we use middleware placed before the '/jokes' route handler.
// This middleware will execute for every request to '/jokes' and log the timestamp and request details.
app.use(['/', '/jokes', '/picgen'], (req, res, next) => {
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
app.post('/pichub', async (req, res) => {
  console.log(`POST request received on ${req.originalUrl} from IP: ${req.ip} with prompt: ${JSON.stringify(req.body)}  || TimeStamp: ${new Date().toString()} `);
  try {
    // 💡 CORRECT WAY: Destructure the 'prompt' property from the parsed request body (req.body)
    const { prompt } = req.body;
    // Validate and trim the prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.log(`[400] Prompt is required or invalid prompt details dected.`);
      return res.status(400).json({ error: 'Prompt is required! Please enter your detail specification =)' });
    }
    const payload = {
      width: 512,
      height: 512,
      samples: 1,
      cfg_scale: 7.0,
      style_preset: 'photographic',
      text_prompts: [{ text: prompt, weight: 1.0 }],
      output_format: 'jpeg',
      model: 'sd-3.5-flash'
    };

    const form = new FormData();
    form.append('payload', JSON.stringify(payload));

    const response = await axios.post('https://api.stability.ai/v2beta/stable-image/generate/sd3', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        Accept: 'image/*',
      },
      responseType: 'arraybuffer',
    });

    if (response && response.status === 200) {

      res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
      return res.send(Buffer.from(response.data));
    }

    return res.status(response.status).send(response.data);
  } catch (err) {
    console.error('Error proxying to Stability AI:', err && err.message);
    return res.status(502).json({ error: 'failed to generate image' });
  }
});


//PortLog

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port} || ${new Date()}`);
});
//End of File