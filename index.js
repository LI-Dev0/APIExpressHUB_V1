const express = require("express");
const app = express();
//console.dir(app);
const port = 3000;
// Removed static time assignment; will generate timestamp dynamically in middleware

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('home.ejs');
});

app.use((req, res, next) => {
	console.log("We have been pinged! Take a look!".bgCyan + `Stamp: ${new Date()}`);
});


app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`.bgBlue);
})