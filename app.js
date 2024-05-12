const express = require('express');
const axios = require('axios');
const path = require('path'); 
require('dotenv').config();
const multer = require('multer');
const pdfParse = require('pdf-parse');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/analyze-script', async (req, res) => {
    try {
        const scriptText = req.body.script;
        if (!scriptText) {
            return res.status(400).json({ error: 'No script text provided' });
        }

        const extractedData = await analyzeScript(scriptText);
        res.json({ message: 'Script analyzed successfully', data: extractedData });
    } catch (error) {
        console.error('Error analyzing script:', error);
        res.status(500).json({ error: 'Failed to analyze script', details: error.message });
    }
});

app.post('/upload-script', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const scriptText = await pdfParse(req.file.buffer);
        console.log("Extracted Text:", scriptText.text); 
        const extractedData = await analyzeScript(scriptText.text);
        res.json({ message: 'Script analyzed successfully', data: extractedData });
    } catch (error) {
        console.error('Error processing script:', error);
        res.status(500).json({ error: 'Failed to process script', details: error.message });
    }
});



function selectModel(scriptText) {
    // Adjust based on script length or specific processing needs
    if (scriptText.length > 1000) {
        return "gpt-3.5-turbo-instruct"; // High limits and good for detailed processing
    } else {
        return "gpt-3.5-turbo"; // Efficient for shorter texts
    }
}

async function analyzeScript(scriptText) {
    const model = selectModel(scriptText);  
    const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

    try {
        const response = await axios.post(apiEndpoint, {
            model: "gpt-3.5-turbo-1106",
            messages: [{
                role: "system",  
                content: "Break down the following script into characters, scenes and locations, and props:"
            }, {
                role: "user",
                content: scriptText
            }],
            max_tokens: 1500,
            temperature: 0.5,
            stop: ["Human:", "AI:"]  
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content.trim();
        } else {
            throw new Error("No response from OpenAI API.");
        }
    } catch (error) {
        //console.error('OpenAI API call failed:', error);
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        throw error; 
    }
    
}



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
