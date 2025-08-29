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
    jokebox.style.backgroundColor = 'darkblue';
    jokebox.style.color = 'magenta';
    jokebox.querySelector("ul").style.backgroundColor = 'cyan';
    jokebox.querySelector("ul").style.color = 'green';
    jokebox.style.fontFamily = 'Roboto-Mono, sans-serif';
    jokebox.style.border = '3px dashed magenta';
    jokebox.style.borderRadius = '5px';

const siteTheme = document.querySelector('body');
    siteTheme.style.backgroundColor = 'black';
    siteTheme.style.color = 'white';
    siteTheme.style.fontFamily = 'Roboto-Mono, sans-serif';

const chuckNorrisBtn = document.querySelector(".chuckNorrisBtn");
const chuckNorrisJoke = document.querySelector("#chuckNorrisJoke");

chuckNorrisBtn.addEventListener("click", async () => {
    try {
        const res = await axios.get("https://api.chucknorris.io/jokes/random");
        const chuckNorrisJokeText = document.createElement("p");
        chuckNorrisJokeText.textContent = res.data.value;
        chuckNorrisJoke.append(chuckNorrisJokeText);
    } catch (e) {
        chuckNorrisJoke.textContent = "No Chuck Norris jokes available!";
    }
});