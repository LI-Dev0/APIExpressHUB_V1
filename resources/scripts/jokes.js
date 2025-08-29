const express = require("express");
const app = express();
//console.dir(app);
const port = 2000;
// Removed static time assignment; will generate timestamp dynamically in middleware
const jokes = require("./jokes");

axios.get("https://official-joke-api.appspot.com/jokes/ten")
    .then(response => {
        const newJokes = response.data.map(joke => joke.setup + " " + joke.punchline);
        jokes.push(...newJokes);
        document.getElementById("jokes").innerHTML += jokes.join("<br>");
    })
    .catch(error => {
        console.error("Error fetching jokes:", error);
    });


app.set('view engine', 'ejs');

app.get('/jokes', (req, res) => {
    res.render('jokes.ejs', { jokes: jokes });
});

app.use((req, res, next) => {
    console.log("We have been pinged! Take a look!" + `Stamp: ${new Date()}`);
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port} || ${new Date()}`);
})

const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? Because he was outstanding in his field!",
    "Why don't skeletons fight each other? They don't have the guts."
];
