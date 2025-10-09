const picContainer = document.querySelector("#picContainer");
const picList = document.querySelector("#picList");
const picButton = document.querySelector("#picButton");

picButton.addEventListener("click", () => {
    const newPic = document.createElement("img");
    newPic.src = `https://picsum.photos/200/300.webp?random=${Math.floor(Math.random() * 1000)}`;
    newPic.alt = "Random Picture";
    picList.appendChild(newPic);
    document.querySelector("#picSrc").textContent = newPic.src;
});