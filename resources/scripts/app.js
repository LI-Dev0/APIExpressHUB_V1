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
    console.table("Joke fetched:", res.data.joke());
    return res.data.joke;
  } catch (e) {
    return "NO JOKES AVAILABLE! SORRY :(";
  }
};

button.addEventListener("click", addNewJoke);


const jokebox = document.querySelectorAll("#jokeContainer");
    jokebox.forEach(element => {
      element.style.backgroundColor = '';
      element.style.color = 'rgba(248, 123, 179, 1)';
      element.querySelector("ul").style.backgroundColor = 'lightgrey';
      element.querySelector("ul").style.color = '#cc3232';
      element.style.fontFamily = 'Roboto-Mono, sans-serif';
      element.style.border = '5px groove rgb(204, 50, 50)';
      element.style.borderRadius = '10px';
    });

const siteTheme = document.querySelector('body');
    siteTheme.style.backgroundColor = 'cornflowerblue';
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

console.log("App.js is connected and running!");

const footers = document.querySelectorAll('footer');
footers.forEach(footer => {
  footer.style.display = 'flex';
  footer.style.flexDirection = 'column';
  footer.style.alignItems = 'center';
  footer.style.justifyContent = 'space-around';
  footer.style.color = 'black';
  footer.style.fontFamily = 'Roboto-Mono, sans-serif';
  footer.style.textAlign = 'center';
  footer.style.padding = '10px';
  footer.style.marginTop = '20px';
  footer.style.borderTop = '2px solid black';
});