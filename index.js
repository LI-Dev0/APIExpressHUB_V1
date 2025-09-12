const express = require("express");
const app = express();
//console.dir(app);
const port = 3000;
// Removed static time assignment; will generate timestamp dynamically in middleware

const path = require('path');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Included to serve static files such as CSS and JS
app.use('/scripts', express.static('resources/scripts'));
app.use('/styles', express.static('resources/styles'));

app.get('/', (req, res) => {
  res.render('home.ejs');
});

app.get('/jokes', (req, res) => {
    res.render('jokes.ejs');
});

//app.use((req, res, next) => {
//	console.log("We have been pinged! Take a look!" + `Stamp: ${new Date()}`, res.getHeaders());
//	next();
//});


app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port} || ${new Date()}`);
})