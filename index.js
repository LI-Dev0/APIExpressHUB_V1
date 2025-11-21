const express = require("express");
const app = express();
//console.dir(app);
const port = 3000;
// Removed static time assignment; will generate timestamp dynamically in middleware

const path = require("path");
const { title } = require("process");

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//StaticFileServing
app.use('/resources', express.static(path.join(__dirname, 'resources')))
// Included to serve static files such as CSS and JS
app.use('/scripts', express.static('resources/scripts'));
app.use('/styles', express.static('resources/styles'));
app.use('/images', express.static('resources/images'));

app.get('/resources/styles/styler.css', (req, res) => {
  // Make sure the path to the file is correct on your server
  res.sendFile(__dirname + '/resources/styles/styler.css', {
    headers: {
      'Content-Type': 'text/css'
    }
  });
});

//Homepage

app.get("/", (req, res) => {
  res.render("home.ejs", { title: "API Express Server" });
});


//JokeHubRenders

app.get('/jokes', (req, res) => {
    res.render('jokes.ejs', {
		title: "Joke Generator",
		description: "Come and get your daily dose of API fetched laughter all in one place =)"
		}
	);
});

// To log each time someone hits the joke API, we use middleware placed before the '/jokes' route handler.
// This middleware will execute for every request to '/jokes' and log the timestamp and request details.

app.use('/jokes', (req, res, next) => {
	console.log(
	"We have been pinged! Take a look! Stamp:", new Date(), "Headers:", req.headers);
});

//PicGenRenders

app.get('/picgen', (req, res) => {
    res.render('picgen.ejs', {
        title: "Picture Generator".toUpperCase(),
        description: "Generate random pictures with our picture generator!"
        }
	);
});


//PortLog

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port} || ${new Date()}`);
});
