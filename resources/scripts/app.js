const siteTheme = document.querySelector('body');
    siteTheme.style.color = 'azure';
    siteTheme.style.fontFamily = 'Monospace, sans-serif';
    siteTheme.style.backgroundColor = '#8fcde623';

const header = document.querySelector('#headline');
    header.style.display = 'flex';
    header.style.justifyContent = 'center';
    header.style.alignItems = 'center';
    header.style.backgroundColor = '#001219';
    header.style.color = 'rgb(81, 245, 154)';
    header.style.fontFamily = 'Trebuchet MS, cursive, sans-serif';
    header.style.padding = '20px';
    header.style.border = '5px groove bisque';
    header.style.borderRadius = '10px';


//const carouselContainer = document.querySelector('#carouselContainer');
  //  carouselContainer.style.display = 'flex';
    //carouselContainer.style.justifyContent = 'center';
    //carouselContainer.style.alignItems = 'center';
//    carouselContainer.style.margin = '20px';
  //  carouselContainer.style.border = '5px groove bisque';
  //  carouselContainer.style.borderRadius = '10px';
  //  carouselContainer.style.padding = '10px';
  //  carouselContainer.style.backgroundColor = '#001219';

    //DADJOKES
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
  newLI.style.padding = '10px';
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
      element.style.backgroundColor = '#001219';
      element.style.flexDirection = 'column-reverse';
      element.style.alignItems = 'center';
      element.querySelector("ul").style.backgroundColor = '#a6d2e438';
      element.querySelector("ul").style.color = 'rgba(81, 245, 154, 1)';
      element.style.fontFamily = 'Trebuchet MS, cursive, sans-serif';
      element.style.border = '5px groove rgba(7, 48, 14, 1)';
      element.style.borderRadius = '25px';
      element.style.width = 'fit-content';
//      element.getElementsByTagName('h4')[0].style.textAlign = 'center';
//      element.getElementsByTagName('h4')[0].style.color = 'rgb(11, 82, 29)';
      element.getElementsByTagName('button')[0].style.backgroundColor = 'rgba(81, 245, 154, 1)';
      element.getElementsByTagName('button')[0].style.color = 'rgb(11, 82, 29)';
      element.getElementsByTagName('button')[0].style.fontWeight = 'bold';
      element.getElementsByTagName('button')[0].style.border = '2.5px dashed black';
      element.getElementsByTagName('button')[0].style.borderRadius = '5px';
      element.getElementsByTagName('button')[0].style.padding = '10px';
      element.getElementsByTagName('button')[0].style.margin = '10px';
      element.getElementsByTagName('button')[0].style.cursor = 'pointer';
});

//CHUCK NORRIS JOKES
const chuckNorrisBtn = document.querySelector(".chuckNorrisBtn");
const chuckNorrisJoke = document.querySelector("#chuckNorrisJoke");

chuckNorrisBtn.addEventListener("click", async () => {
    try {
        const res = await axios.get("https://api.chucknorris.io/jokes/random");
        const chuckNorrisJokeText = document.createElement("li");
        chuckNorrisJokeText.style.marginTop = '10px';
        chuckNorrisJokeText.textContent = res.data.value;
        chuckNorrisJoke.append(chuckNorrisJokeText);
    } catch (e) {
        chuckNorrisJoke.textContent = "No Chuck Norris jokes available!";
    }
});;


//PICGEN
