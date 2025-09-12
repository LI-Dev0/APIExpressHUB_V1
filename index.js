const express = require("express");
const app = express();
//console.dir(app);
const port = 3000;
// Removed static time assignment; will generate timestamp dynamically in middleware

app.set('view engine', 'ejs');
app.use(express.static('resources/scripts/app.js'));

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