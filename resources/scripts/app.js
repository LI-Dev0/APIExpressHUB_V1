//JOKEHUB
const jokes = document.querySelector("#jokes");
const butt = document.querySelector(".djbutton");

const getDadJoke = async (req, res) => {
  try {
    const config = { headers: { Accept: "application/json" } };
    const res = await axios.get("https://icanhazdadjoke.com/", config);
    console.table("Joke fetched:", res.data.joke);
    return res.data.joke;
  } catch (e) {
    console.warn("No jokes available at the moment. Please try again later.");
    return "NO MORE JOKES AVAILABLE SORRY! :( || TRY AGAIN LATER :)".bgBlue;
  }
};

const addNewJoke = async () => {
	const jokeText = await getDadJoke();
	const newLI = document.createElement("li");
	newLI.append(jokeText);
	jokes.append(newLI);
	console.log("New joke added!");
};
butt.addEventListener("click", addNewJoke);

const jokebox = document.querySelectorAll("#jokeContainer");
    jokebox.forEach(element => {
      element.style.display = 'flex';
      element.style.margin = '20px';
      element.style.padding = '20px';
      element.style.backgroundColor = 'rgba(158, 187, 197, 0.7)';
      element.style.flexDirection = 'row';
      element.style.alignItems = 'center';
      element.querySelector("ul").style.backgroundColor = 'lightgrey';
      element.querySelector("ul").style.color = '#238eafff';
      element.style.fontFamily = 'Monospace, sans-serif';
      element.style.border = '5px groove rgba(7, 48, 14, 1)';
      element.style.borderRadius = '15px';
      element.style.width = 'fit-content';
      element.getElementsByTagName('h2')[0].style.textAlign = 'center';
      element.getElementsByTagName('h2')[0].style.color = 'rgb(11, 82, 29)';
      element.getElementsByTagName('button')[0].style.backgroundColor = 'rgba(81, 245, 154, 1)';
      element.getElementsByTagName('button')[0].style.color = 'rgb(11, 82, 29)';
      element.getElementsByTagName('button')[0].style.fontWeight = 'bold';
      element.getElementsByTagName('button')[0].style.border = '2px solid black';
      element.getElementsByTagName('button')[0].style.borderRadius = '5px';
      element.getElementsByTagName('button')[0].style.padding = '10px';
      element.getElementsByTagName('button')[0].style.margin = '10px';
      element.getElementsByTagName('button')[0].style.cursor = 'pointer';
});

const siteTheme = document.querySelector('body');
    siteTheme.style.color = 'azure';
    siteTheme.style.fontFamily = 'Monospace, sans-serif';

const chuckNorrisBtn = document.querySelector(".chuckNorrisBtn");
const chuckNorrisJoke = document.querySelector("#chuckNorrisJoke");

chuckNorrisBtn.addEventListener("click", async () => {
    try {
        const res = await axios.get("https://api.chucknorris.io/jokes/random");
        const chuckNorrisJokeText = document.createElement("li");
        chuckNorrisJokeText.style.color = '#238eafff';
        chuckNorrisJokeText.style.fontFamily = 'Roboto-Mono, sans-serif';
        chuckNorrisJokeText.style.marginTop = '10px';
        chuckNorrisJokeText.textContent = res.data.value;
        chuckNorrisJoke.append(chuckNorrisJokeText);
    } catch (e) {
        chuckNorrisJoke.textContent = "No Chuck Norris jokes available!";
    }
});


//PICGEN
