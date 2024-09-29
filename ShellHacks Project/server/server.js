const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to enable CORS for all requests
app.use(cors({
    origin: 'https://aws-branch.d20g4ou30d6j4s.amplifyapp.com',
  }));
app.use(express.json());

// Root route to confirm the server is running
app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

// Route to proxy requests to the Google Generative AI API
app.post('/api/generative-ai', async (req, res) => {
  const { model, message } = req.body;
  try {
    // Make a request to the Google Generative AI API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.VITE_GOOGLE_GENERATIVE_AI_KEY}`, 
      {
        model,
        message,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.VITE_GOOGLE_GENERATIVE_AI_KEY}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error communicating with Generative AI API:', error);
    res.status(500).json({ error: 'Failed to communicate with Generative AI API' });
  }
});

// Route to proxy requests to the Google Maps Places API
app.get('/api/maps', async (req, res) => {
  const { location, radius, keyword } = req.query;
  try {
    // Make a request to the Google Maps Places API
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location,
          radius,
          keyword,
          key: process.env.GOOGLE_MAP_GEN_KEY,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error communicating with Google Maps API:', error);
    res.status(500).json({ error: 'Failed to communicate with Google Maps API' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy server running on port ${PORT}`);
});
