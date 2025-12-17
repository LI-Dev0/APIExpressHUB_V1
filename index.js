const express = require("express");
const axios = require('axios');
const FormData = require('form-data');
//Environment Vars Request from .env + Verification Check
require('dotenv').config();
if (process.env.STABILITY_API_KEY) {
  console.log(`✅ Stability API Key loaded`);
} else {
  console.error("❌ ERROR: STABILITY_API_KEY is not defined in your .env file!");
}
const app = express();
const port = 4747;
//console.dir(app);
//const { title } = require("process");

const path = require("path");
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// parse JSON bodies for our API routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//StaticFileServing
app.use('/resources', express.static(path.join(__dirname, 'resources')))
app.use('/scripts', express.static('resources/scripts'));
app.use('/styles', express.static('resources/styles'));
app.use('/images', express.static('resources/images'));


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
  console.log(`POST request received on ${req.originalUrl} from IP: ${req.ip} with prompt: ${JSON.stringify(req.body.prompt)}  || TimeStamp: ${new Date().toString()} `);
  try {
    //Destructure the 'prompt' property from the parsed request body (req.body). Then validate and trim
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.log(`[400] Prompt is required or invalid prompt details dected.`);
      return res.status(400).json({ error: 'Prompt is required! Please enter your detail specification =)' });
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
    form.append('prompt', prompt);
    form.append('model', 'sd3.5-flash'); // Use 'sd3.5-large' or 'sd3-medium' (check your tier/credits)
    form.append('output_format', 'jpeg');
    form.append('aspect_ratio', '1:1'); // SD3 often uses aspect_ratio instead of width/height

    // Optional parameters (if supported by the specific model version)
    form.append('cfg_scale', 7);
    form.append('style_preset', 'photographic');

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


//PortLog

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port} || ${new Date()}`);
});
//End of File