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

const getDadJoke = async () => {
  try {
    const config = { headers: { Accept: "application/json" } };
    const res = await axios.get("https://icanhazdadjoke.com/", config);
    console.table("Joke fetched:", res.data.joke);
    return res.data.joke;
  } catch (e) {
    console.warn("No jokes available at the moment. Please try again later.");
    return "NO MORE JOKES AVAILABLE SORRY! :( || TRY AGAIN LATER :)";
  }
};

const addNewJoke = async () => {
  const jokeText = await getDadJoke();
  const newLI = document.createElement("li");
  newLI.style.padding = '10px';
  newLI.style.margin = '10px';
  newLI.style.listStyleType = 'none';
  newLI.style.transition = 'transform 0.5s ease-in-out';
  newLI.append(jokeText);
  jokes.append(newLI);
  console.log("New joke added!");
};
butt.addEventListener("click", addNewJoke);

//Styling the joke container and its elements
const jokebox = document.querySelectorAll("#jokeContainer");
jokebox.forEach(element => {
  element.style.display = 'flex';
  element.style.margin = '20px';
  element.style.padding = '20px';
  element.style.backgroundColor = '#001219';
  element.style.flexDirection = 'column-reverse';
  element.style.alignItems = 'center';
  const ulElement = element.querySelector("ul");
  if (ulElement) {
    ulElement.style.backgroundColor = '#a6d2e438';
    ulElement.style.color = 'rgba(81, 245, 154, 1)';
  }
  element.style.fontFamily = 'Trebuchet MS, cursive, sans-serif';
  element.style.border = '5px groove rgba(7, 48, 14, 1)';
  element.style.borderRadius = '25px';
  const button = element.getElementsByTagName('button')[0];
  button.style.backgroundColor = 'rgba(81, 245, 154, 1)';
  button.style.color = 'rgb(11, 82, 29)';
  button.style.fontWeight = 'bold';
  //animate box shadow on hover
  button.addEventListener('mouseover', () => {
    button.style.boxShadow = '0 0 10px 2px rgba(81, 245, 154, 0.7)';
  });
  //remove box shadow on mouseout
  button.addEventListener('mouseout', () => {
    button.style.boxShadow = 'none';
  });
  button.style.border = '2.5px solid rgb(11, 82, 29)';
  button.style.borderRadius = '5px';
  button.style.padding = '10px';
  button.style.margin = '10px';
  button.style.cursor = 'pointer';
  button.style.margin = '10px';
  button.style.cursor = 'pointer';
});

//CHUCK NORRIS JOKES
const chuckNorrisBtn = document.querySelector(".chuckNorrisBtn");
const chuckNorrisJoke = document.querySelector("#chuckNorrisJoke");

chuckNorrisBtn.addEventListener("click", async () => {
  try {
    const res = await axios.get("https://api.chucknorris.io/jokes/random");
    const chuckNorrisJokeText = document.createElement("li");
    chuckNorrisJokeText.style.margin = '10px';
    chuckNorrisJokeText.style.padding = '10px';
    chuckNorrisJokeText.style.listStyleType = 'none';
    chuckNorrisJokeText.style.transition = 'transform 0.5s ease-in-out';
    const errorItem = document.createElement("li");
    errorItem.style.margin = '10px';
    errorItem.style.padding = '10px';
    errorItem.style.listStyleType = 'none';
    errorItem.style.transition = 'transform 0.5s ease-in-out';
    errorItem.style.color = 'red';
    errorItem.textContent = "No Chuck Norris jokes available!";
    chuckNorrisJoke.append(errorItem);
    chuckNorrisJoke.append(chuckNorrisJokeText);
  } catch (e) {
    chuckNorrisJoke.textContent = "No Chuck Norris jokes available!";
  }
});

// Use event delegation for pointer hover effects on joke <li> elements.
// We use `pointerover`/`pointerout` (they bubble) so a single parent
// listener handles existing and future `<li>` children added dynamically.
jokes && jokes.addEventListener('pointerover', (e) => {
  const li = e.target.closest('li');
  if (!li || !jokes.contains(li)) return;
  li.style.transition = 'transform 0.5s ease-in-out';
  li.style.transform = 'scale(1.2)';
});

jokes && jokes.addEventListener('pointerout', (e) => {
  const li = e.target.closest('li');
  if (!li || !jokes.contains(li)) return;
  li.style.transform = '';
});

chuckNorrisJoke && chuckNorrisJoke.addEventListener('pointerover', (e) => {
  const li = e.target.closest('li');
  if (!li || !chuckNorrisJoke.contains(li)) return;
  li.style.transition = 'transform 0.5s ease-in-out';
  li.style.transform = 'scale(1.2)';
});

chuckNorrisJoke && chuckNorrisJoke.addEventListener('pointerout', (e) => {
  const li = e.target.closest('li');
  if (!li || !chuckNorrisJoke.contains(li)) return;
  li.style.transform = '';
});