const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*', // En producción, limitar a los dominios permitidos
  methods: ['POST']
}));
app.use(express.json());

app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${process.env.PORT}`)
})

const validateRequest = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.EXTENSION_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.get('/', (req, res) => {  res.send('Hello World!');});   

app.post('/api/save-profile', validateRequest, async (req, res) => {
    try {
      const profile = req.body;
      
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: process.env.NOTION_DATABASE_ID },
          properties: {
            Name: {
              title: [{ text: { content: profile.name } }]
            },
            Headline: {
              rich_text: [{ text: { content: profile.headline } }]
            },
            Location: {
              rich_text: [{ text: { content: profile.location } }]
            },
            "Profile URL": {
              url: profile.profileUrl
            },
            "Saved At": {
              date: { start: profile.savedAt }
            }
          }
        })
      });
  
      if (!response.ok) {
        throw new Error('Error saving to Notion');
      }
  
      res.json(await response.json());
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});