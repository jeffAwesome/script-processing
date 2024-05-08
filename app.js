const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

app.post('/analyze-script', async (req, res) => {
    const scriptText = req.body.script;
    if (!scriptText) {
        return res.status(400).json({ error: 'No script text provided' });
    }

    try {
        const extractedData = await analyzeScript(scriptText);
        res.json({ message: 'Script analyzed successfully', data: extractedData });
    } catch (error) {
        console.error('Error analyzing script:', error);
        res.status(500).json({ error: 'Failed to analyze script' });
    }
});

function selectModel(scriptText) {
    // Simple logic to select a model based on the length of the script
    if (scriptText.length > 1000) {
        return "gpt-3.5-turbo-instruct"; // Use a more capable model for longer scripts
    } else {
        return "gpt-3.5-turbo"; // Use a standard model for shorter scripts
    }
}

async function analyzeScript(scriptText) {
    const model = selectModel(scriptText);  // Select the appropriate model based on script length
    const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

    // Construct the messages array for the chat completion request
    const messages = [{
        role: "system",  // 'system' role can be used to set the context or instructions
        content: "Break down the following script into characters, dialogues, and scene descriptions:"
    }, {
        role: "user",  // 'user' role for the actual script content
        content: scriptText
    }];

    const response = await axios.post(apiEndpoint, {
        model: model,
        messages: messages,
        max_tokens: 1500,
        temperature: 0.5,
        stop: ["Human:", "AI:"]  // You can specify stop sequences if needed
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content.trim();
}


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
