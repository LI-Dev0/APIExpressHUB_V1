const picContainer = document.querySelector("#picContainer");
const picList = document.querySelector("#picList");
const picButton = document.querySelector("#picButton");

picButton.addEventListener("click", (req, res) => {
	const rand = Math.floor(Math.random() * 1000);
    const newPic = document.createElement("img");
    newPic.src = `https://picsum.photos/id/${rand}/400`;
    newPic.alt = "Random Picture ";
    picList.appendChild(newPic);
    document.querySelector("#picSrc").textContent = 'Find the latest pic at ' + newPic.src;
	console.log(JSON.stringify(res));
});

picContainer.style.border = '5px groove cyan';
picContainer.style.borderRadius = '5px';
picContainer.style.justifyContent = 'space-around';