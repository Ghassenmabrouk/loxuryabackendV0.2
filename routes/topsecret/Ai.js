const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const multer = require('multer'); // For handling file uploads
const Prompt = require('../../models/prompt');
const User = require('../../models/user');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set up multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Helper function for logging
const logInfo = (message, data = {}) => {
  console.log(`[INFO] ${message}`, JSON.stringify(data, null, 2));
};

const logError = (message, error = {}) => {
  console.error(`[ERROR] ${message}`, JSON.stringify(error, null, 2));
};

// POST /api/openai/generate-text
router.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;
  const email = req.user.email; // Extract email from the decoded token

  logInfo('Received request to generate text', { email, prompt });

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      logError('User not found', { email });
      return res.status(404).json({ message: 'User not found' });
    }

    logInfo('User found', { userId: user._id });

    // Call OpenAI API
    logInfo('Calling OpenAI API to generate text');
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const generatedText = response.choices[0].message.content;
    logInfo('Text generated successfully', { generatedText });

    // Save prompt and response to MongoDB
    const newPrompt = new Prompt({ userId: user._id, prompt, response: generatedText });
    await newPrompt.save();
    logInfo('Prompt saved to database', { promptId: newPrompt._id });

    res.json({ response: generatedText });
  } catch (error) {
    logError('Error generating text', error);
    res.status(500).json({
      message: 'Failed to generate text',
      error: error.message,
      details: error.response ? error.response.data : null,
    });
  }
});

// POST /api/openai/transcribe
router.post('/transcribe', upload.single('file'), async (req, res) => {
  logInfo('Received request to transcribe audio');

  try {
    if (!req.file) {
      logError('No audio file uploaded');
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    logInfo('Audio file received', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // Validate file size and format
    if (req.file.size > 25 * 1024 * 1024) { // 25 MB limit
      logError('File size exceeds limit', { size: req.file.size });
      return res.status(400).json({ message: 'File size exceeds 25 MB limit' });
    }

    if (!['audio/mpeg', 'audio/wav', 'audio/m4a'].includes(req.file.mimetype)) {
      logError('Unsupported file format', { mimetype: req.file.mimetype });
      return res.status(400).json({ message: 'Unsupported file format' });
    }

    // Log the file buffer for debugging
    logInfo('File buffer received', { bufferLength: req.file.buffer.length });

    // Transcribe the audio using OpenAI's Whisper model
    logInfo('Calling OpenAI API to transcribe audio');
    const transcription = await openai.audio.transcriptions.create({
      file: req.file.buffer, // Pass the file buffer directly
      model: 'whisper-1', // Use the Whisper model
    });

    const transcript = transcription.text;
    logInfo('Audio transcription successful', { transcript });

    // Return the transcribed text
    res.json({ transcript });
  } catch (error) {
    logError('Error transcribing audio', error);

    if (error.response && error.response.status === 400) {
      return res.status(400).json({
        message: 'Invalid file format or malformed request. Please check the file and try again.',
        error: error.message,
      });
    }

    res.status(500).json({
      message: 'Failed to transcribe audio',
      error: error.message,
      details: error.response ? error.response.data : null,
    });
  }
});

// POST /api/openai/generate-query
router.post('/generate-query', async (req, res) => {
  const { transcript } = req.body;

  logInfo('Received request to generate query', { transcript });

  try {
    // Refine the transcribed text using GPT-4
    logInfo('Calling OpenAI API to refine query');
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that refines user queries into clear and concise search terms for location-based searches. Extract the most relevant location or destination from the user input.',
        },
        { role: 'user', content: transcript },
      ],
    });

    const refinedQuery = response.choices[0].message.content;
    logInfo('Query refined successfully', { refinedQuery });

    // Return the refined query
    res.json({ searchQuery: refinedQuery });
  } catch (error) {
    logError('Error refining query', error);
    res.status(500).json({
      message: 'Failed to refine query',
      error: error.message,
      details: error.response ? error.response.data : null,
    });
  }
});

module.exports = router;
