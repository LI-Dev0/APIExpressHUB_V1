
const picContainer = document.getElementById("picContainer");
const picList = document.querySelector("#picList");
const picButton = document.querySelector("#picButton");
const picSrc = document.querySelector("#picSrc");
const picContButt = document.querySelector("#picContainer button");
const next = () => {
    return;
};

picContainer.style.display = 'flex';
//animate box shadow on hover
picContButt.addEventListener('pointerover', (e) => {
    e.target.querySelectorAll('button').style.boxShadow = '0 0 4px 4px #231b537e';
    e.target.querySelector('button')[0].innerText = 'Fetch!';
    width = e.target.offsetWidth;
    height = e.target.offsetHeight;
});
//remove box shadow on mouseout
picContainer.addEventListener('pointerout', (e) => {
    e.target.querySelectorAll('button').style.boxShadow = '';
    e.target.querySelector('button')[0].innerText = '';
});

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

picSrc.style.marginTop = '55px';

// Event listener for button click to fetch and display a random picture
picButton.addEventListener("click", (req, res) => {
    try {
        const rand = Math.floor(Math.random() * 1000);
        console.log(`Generated random number: ${rand}`);
        const newPic = document.createElement("img");
        newPic.src = `https://picsum.photos/id/${rand}/500`;
        //image size is 500px, how to adjust resolution to 720p?
        //        https://picsum.photos/id/237/200/300/resolution=1280x720
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

//AI Image Generation Section from Prompt Input using Stability API Simulation

const aipicList = document.querySelector("#aipicList");
const aipicButton = document.querySelector("#aipicButton");
const aipicInput = document.querySelector("#aipicInput");
const aipicSrc = document.querySelector("#aipicSrc");

// Event listener for AI Image Generation button click

//Diffusion API Simulation Section

// Example of using Stability AI's Diffusion API to generate an image (from Node.js environment)


//adapt the above to listen for button click and display image in browser
aipicButton.addEventListener("click", async (event) => {
    //halt default page-reload on form submission
    event.preventDefault();
    //initialise the input prompt specifications from aiInput variable as promptData
    const userPrompt = aipicInput.value.trim();
    if (!userPrompt) {
        console.log("Please enter a prompt string to generate an AI image.");
        alert('Please enter a prompt to generate an AI image.');
        return;
    }
    // ⏳ START LOADING STATE
    aipicButton.disabled = true;
    aipicButton.innerText = "Generating... 🚀";
    aipicSrc.textContent = "Connecting to AI... Please wait.";
    try {
        // 2. Send the value to the server using 'fetch'
        const response = await axios.post(
            '/pichub',
            { prompt: userPrompt }, // Data object (Axios stringifies this automatically)
            {
                responseType: 'arraybuffer', // REQUIRED for binary image data
                headers: { 'Content-Type': 'application/json' }
            }
        );

        //const response = await axios.post(
        //    '/api/generate-image',
        //    { prompt },
        //    { responseType: 'arraybuffer' }
        //);

        // If API returned binary image data, create a Blob and an object URL to display it         if (response && response.status === 200) {
        if (response) {
            const contentType = (response.headers && (response.headers['Content-Type'] || response.headers['Content-Type'])) || 'image/jpeg';
            const blob = new Blob([response.data], { type: contentType });
            const imageUrl = URL.createObjectURL(blob);

            // 1. Create a container for the image and the download button
            const card = document.createElement('div');
            card.className = 'ai-card';
            card.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 10px; background: #f4f4f4; padding: 10px; border-radius: 8px;";

            const newAiImg = document.createElement('img');
            newAiImg.src = imageUrl;
            newAiImg.alt = `AI Generated Image for prompt: ${userPrompt}`;
            newAiImg.style.cssText = "width: 100%; border-radius: 5px; border: 2px solid #231b53;";
            newAiImg.style.objectFit = 'cover';
            newAiImg.style.border = '5px solid lightblue';

            // 3. Create the Download Button
            const downloadBtn = document.createElement('a'); // Use an 'a' tag to act as a button
            downloadBtn.href = imageUrl;
            downloadBtn.download = `ai-gen-${Date.now()}.jpg`; // Filename for the user
            downloadBtn.innerText = "💾 Download Image";
            downloadBtn.style.cssText = "padding: 8px 15px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: bold;";

            // Revoke object URL after image loads to free memory x
            //            newAiImg.onload = () => URL.revokeObjectURL(imageUrl);
            
            // 5. Assemble and Add to Page
            card.appendChild(newAiImg);
            card.appendChild(downloadBtn);
            aipicList.prepend(card);
            aipicSrc.textContent = 'Find the latest pic at ' + newAiImg.src + ' Generation successful!';
            aipicInput.value = '';    
        } else {
            console.error('AI image API responded with non-200 status', response && response.status);
        }

    } catch (error) {
        if (error.response && error.response.data) {
            // 💡 Convert ArrayBuffer error back into a readable string
            const decoder = new TextDecoder("utf-8");
            const errorText = decoder.decode(error.response.data);

            try {
                const errorJson = JSON.parse(errorText);
                console.error("Server API Error:", errorJson.error);
            } catch (e) {
                console.error("Server Error Text:", errorText);
            }
        }
        console.error(`Error generating AI image. Details: `, error);
        return; // Exit early, don't add broken image
    } finally {
        // 💡 ALWAYS RE-ENABLE BUTTON
        aipicButton.disabled = false;
        aipicButton.innerText = "Generate AI Image";
    }
});

/*
// Event listener for AI Image Generation button click
//const newDeepAIimg = async (req, res) => {
//    try {
//        const prompt = aiInput.value.trim();
//        if (prompt === "") {
//            console.log("Please enter a prompt to generate an AI image.");
//            return;
//        } else {
//            const response = await axios.post("https://api.deepai.org/api/text2img", {
//                text: prompt,
//            }, {
//                headers: { 'Api-Key': 'quickstart-QUdJIGlzIGNvbWluZy4uLg==' }
//            });
//            const imageUrl = response.data.output_url;
//            console.log(`AI image generated from prompt "${prompt}": ${imageUrl}`);
//            const newDeepAIpic = document.createElement("img");
//            newDeepAIpic.src = imageUrl;
//            newDeepAIpic.alt = `AI Generated Image for prompt: ${prompt}`;
//            newDeepAIpic.className = "aipicList";
//            newDeepAIpic.style.margin = '20px 5px';
//            newDeepAIpic.style.objectFit = 'cover';
//            newDeepAIpic.style.border = '5px solid lightgreen';
//            aipicList.appendChild(newDeepAIpic);
//            aiInput.value = ''; // Clear input after generating image
//        }
//    } catch (error) {
//        console.error('Error generating AI image:', error);
//        return; // Exit early, don't add broken image
//    }
//}


//if (response.status === 200) {
//    fs.writeFileSync("./lighthouse.jpeg", Buffer.from(response.data));
//} else {
//   throw new Error(`${response.status}: ${response.data.toString()}`);
//}

    
*/