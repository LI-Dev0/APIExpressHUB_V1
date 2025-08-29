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
button.bringToFront = function() {
  jokebox.style.zIndex = 1000;
};


const jokebox = document.querySelector("#jokeContainer");
    jokebox.style.backgroundColor = 'lightblue';
    jokebox.style.color = 'magenta';
    jokebox.querySelector("ul").style.backgroundColor = 'cyan';
    jokebox.querySelector("ul").style.color = 'white';
    jokebox.style.fontFamily = 'Roboto-Mono, sans-serif';