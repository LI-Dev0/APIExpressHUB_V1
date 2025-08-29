const express = require("express");
const app = express();
//console.dir(app);
const port = 2000;
// Removed static time assignment; will generate timestamp dynamically in middleware
//const giveMeAJoke = require('give-me-a-joke');

//let jokes = [
//    "Why don't scientists trust atoms? Because they make up everything!",
//    "Why did the scarecrow win an award? Because he was outstanding in his field!",
//    "Why don't skeletons fight each other? They don't have the guts."
//];

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('jokes');
    //    const randomIndex = Math.floor(Math.random() * jokes.length);
//    res.render('jokes.ejs', { joke: jokes[randomIndex] });
});

app.use((req, res, next) => {
    console.log("We have been pinged! Take a look!" + `Stamp: ${new Date()}`);
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port} || ${new Date()}`);
})


//const axios = require("axios");

// axios.get("https://official-joke-api.appspot.com/jokes/ten")
//     .then(response => {
//         const newJokes = response.data.map(joke => joke.setup + " " + joke.punchline);
//         jokes.push(...newJokes);
//         document.getElementById("jokes").innerHTML += jokes.join("<br>");
//     })
//     .catch(error => {
//         console.error("Error fetching jokes:", error);
//     });


const jokes = document.querySelector("#jokes");
const button = document.querySelector("button");

const addNewJoke = async () => {
  const jokeText = await getDadJoke();
  const newLI = document.createElement("li");
  newLI.append(jokeText);
  jokes.append(newLI);
  console.log("New joke added!");
};

const getDadJoke = async () => {
  try {
    const config = { headers: { Accept: "application/json" } };
    const res = await axios.get("https://icanhazdadjoke.com/", config);
    return res.data.joke;
  } catch (e) {
    return "NO JOKES AVAILABLE! SORRY :(";
  }
};

button.addEventListener("click", addNewJoke);


const jokebox = document.querySelector("#jokeContainer");
    jokebox.style.backgroundColor = 'lightblue';
	jokebox.style.color = 'cyan';
	jokebox.style.fontFamily = 'Roboto-Mono, sans-serif';