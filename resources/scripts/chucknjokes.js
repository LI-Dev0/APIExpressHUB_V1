const giveMeAJoke = require('give-me-a-joke');

// To get a random dad joke
//giveMeAJoke.getRandomDadJoke (function(joke) {
    //=> console.log(joke);
//});

// To get a random Chuck Norris joke
giveMeAJoke.getRandomCNJoke (function(joke) {
    //=> console.log(joke);
    const chuckNorrisJoke = document.createElement("p");
    chuckNorrisJoke.append(joke);
    document.body.append(chuckNorrisJoke);
});

const chuckNorrisBtn = document.querySelector(".chuckNorrisBtn");
const chuckNorrisJoke = document.querySelector("#chuckNorrisJoke");

chuckNorrisBtn.addEventListener("click", () => {
    giveMeAJoke.getRandomCNJoke((joke) => {
        chuckNorrisJoke.textContent = joke;
    });
});