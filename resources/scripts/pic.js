const picContainer = document.querySelector("#picContainer");
const picList = document.querySelector("#picList");
const picButton = document.querySelector("#picButton");

// Event listener for button click to fetch and display a random picture
picButton.addEventListener("click", (req, res) => {
    try {
        const rand = Math.floor(Math.random() * 1000);
        console.log(`Generated random number: ${rand}`);
        const newPic = document.createElement("img");    
        newPic.src = `https://picsum.photos/id/${rand}/500`;
        newPic.alt = "Random Picture ";
        newPic.className = "picList";
        newPic.style.margin = '20px 10px';
        newPic.style.objectFit = 'stretch';
        newPic.style.border = '5px solid bisque';
        
        // Add error handler to the image element
        newPic.onerror = () => {
            console.error(`Failed to load image from: ${newPic.src}`);
            next(); // Don't append if image fails to load
        };
        
        picList.appendChild(newPic);
        document.querySelector("#picSrc").textContent = 'Find the latest pic at ' + newPic.src;
    }
    catch (error) {
        console.error('Error fetching picture:', error);
        return; // Exit early, don't add broken image
    }
});

picContainer.style.border = '5px groove bisque';
picContainer.style.borderRadius = '10px';
picContainer.style.justifyContent = 'space-around';
//target picContainer button
picButton.style.margin = '10px';
picButton.style.padding = '10px 20px';
picButton.style.fontSize = '16px';
picButton.style.cursor = 'pointer';
//style picList
document.querySelector("#picList").style.listStyleType = 'none';

//try to make the pics appear in a grid fashion
picList.style.display = 'grid';
picList.style.gridTemplateColumns = 'repeat(2, minmax(200px, 1fr))';
picList.style.gap = '10px';