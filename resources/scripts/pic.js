const picContainer = document.getElementById("picContainer");
const picList = document.querySelector("#picList");
const picButton = document.querySelector("#picButton");
const picSrc = document.querySelector("#picSrc");

const next = () => {
    return;
};

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
        picSrc.textContent = 'Find the latest pic at ' + newPic.src + '(or right-click copy and hit FETCH again! =])';
    }
    catch (error) {
        console.error('Error fetching picture:', error);
        return; // Exit early, don't add broken image
    }
});

picContainer.style.display = 'flex';

//target picContainer button 
picButton.style.margin = '10px';
picButton.style.padding = '10px 20px';
picButton.style.fontSize = '16px';
picButton.style.cursor = 'pointer';

//try to make the pics appear in a grid fashion
picList.style.display = 'grid';
picList.style.gridAutoRows = 'auto';
picList.style.listStyleType = 'none';
picList.style.gridTemplateColumns = 'repeat(2, minmax(200px, 1fr))';
picList.style.gap = '10px';

//Add hover effect to images
picList.addEventListener('mouseover', (event) => {
    if (event.target.tagName === 'IMG') {
        event.target.style.transform = 'scale(1.05)';
        event.target.style.transition = 'transform 0.3s ease';
    }
});

picList.addEventListener('mouseout', (event) => {
    if (event.target.tagName === 'IMG') {
        event.target.style.transform = 'scale(1)';
        event.target.style.transition = 'transform 0.3s ease';
    }
});
//End of pic.js


//AI Image Generation Section from Prompt Input using Diffusion API Simulation

const aipicList = document.querySelector("#aipicList");
const aipicButton = document.querySelector("#aipicButton");
const aiInput = document.querySelector("#aiInput");

const nextAI = () => {
    return;
};

// Event listener for AI Image Generation button click
const newDiffusionAPIAImage = async (req, res) => {
    try {
        const rand = Math.floor(Math.random() * 1000) + 1000; // Different range for AI images
        console.log(`Generated random number for AI image: ${rand}`);
        const newaiPic = document.createElement("img");
        newaiPic.src = `https://picsum.photos/id/${rand}/500`;
        newaiPic.alt = "AI Generated Image";
        newaiPic.className = "aipicList";
        newaiPic.style.margin = '20px 10px';
        newaiPic.style.objectFit = 'stretch';
        newaiPic.style.border = '5px solid lightblue';
        aipicList.appendChild(newaiPic);
    } catch (error) {
        console.error('Error generating AI image:', error);
        return; // Exit early, don't add broken image  
    }
};

aipicButton.addEventListener("click", (req, res) => {
    const prompt = aiInput.value.trim();
    if (prompt === "") {
        console.log("Please enter a prompt to generate an AI image.");
        return;
    }
    else {
        try {
            // Placeholder for actual AI image generation API call
            const rand = Math.floor(Math.random() * 1000); // Different range for AI images
            console.log(`Generated random number for AI image: ${rand}`);
            const newaiPic = document.createElement("img");
            newaiPic.src = `https://picsum.photos/id/${rand}/500`;
            newaiPic.alt = `AI Generated Image for prompt: ${prompt}`;
            newaiPic.className = "aipicList";
            newaiPic.style.margin = '20px 5px';
            newaiPic.style.objectFit = 'cover';
            newaiPic.style.border = '5px solid lightblue';
            aipicList.appendChild(newaiPic);
            aiInput.value = ''; // Clear input after generating image
        } catch (error) {
            console.error('Error generating AI image:', error);
            return; // Exit early, don't add broken image  
        }
    }

});

//Diffusion API Simulation Section End

/* import fs from "node:fs";
import axios from "axios";
import FormData from "form-data";

const payload = {
  prompt: "Lighthouse on a cliff overlooking the ocean",
  output_format: "jpeg"
};

const response = await axios.postForm(
  `https://api.stability.ai/v2beta/stable-image/generate/sd3`,
  axios.toFormData(payload, new FormData()),
  {
    validateStatus: undefined,
    responseType: "arraybuffer",
    headers: { 
      Authorization: `Bearer sk-MYAPIKEY`, 
      Accept: "image/*" 
    },
  },
);

if(response.status === 200) {
  fs.writeFileSync("./lighthouse.jpeg", Buffer.from(response.data));
} else {
  throw new Error(`${response.status}: ${response.data.toString()}`);
} */


  
// const aiImageButton = document.getElementById("aiImageButton");
// aiImageButton.addEventListener("click", async () => {
//     // Placeholder for AI image generation logic
//     console.log("AI Image Generation feature coming soon!");
// });