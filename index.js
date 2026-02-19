/**
 * Railway API endpoint for GitHub Actions
 * Receives webhook from GitHub Actions and posts to Twitter/X
 * This runs on Railway with proper environment variables
 */

require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'secret';

// Store for tweet queue (in production use Redis)
const tweetQueue = [];

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Twitter/X GitHub Actions Bridge',
    timestamp: new Date().toISOString(),
    queueLength: tweetQueue.length
  });
});

// Webhook endpoint for GitHub Actions
app.post('/webhook', async (req, res) => {
  const { secret, tweet } = req.body;
  
  // Verify secret
  if (secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid secret' });
  }
  
  if (!tweet) {
    return res.status(400).json({ error: 'Tweet text required' });
  }
  
  console.log(`📨 Received tweet request: "${tweet.substring(0, 50)}..."`);
  
  // Add to queue
  tweetQueue.push({
    text: tweet,
    receivedAt: new Date().toISOString(),
    status: 'queued'
  });
  
  // Process immediately (in production would use worker)
  try {
    const result = await postTweetDirect(tweet);
    res.json({ success: true, message: 'Tweet queued', result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Direct tweet endpoint (for testing)
app.post('/tweet', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Tweet text required' });
  }
  
  try {
    const result = await postTweetDirect(text);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get queue status
app.get('/queue', (req, res) => {
  res.json({
    queue: tweetQueue,
    length: tweetQueue.length
  });
});

// Post tweet using Playwright
async function postTweetDirect(text) {
  console.log(`🚀 Attempting to post tweet: "${text.substring(0, 50)}..."`);
  
  // Set environment variable for the tweet
  process.env.TWEET_TEXT = text;
  
  try {
    // Run the post-tweet script
    const { stdout, stderr } = await execAsync('node post-tweet.js', {
      env: {
        ...process.env,
        TWEET_TEXT: text
      },
      timeout: 120000 // 2 minute timeout
    });
    
    console.log('✅ Tweet script output:', stdout);
    if (stderr) console.error('⚠️  Stderr:', stderr);
    
    return { success: true, output: stdout };
    
  } catch (error) {
    console.error('❌ Tweet script failed:', error.message);
    throw new Error(`Failed to post tweet: ${error.message}`);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Twitter/X Bridge running on port ${PORT}`);
  console.log(`🔐 Webhook secret: ${WEBHOOK_SECRET ? 'Set' : 'Not set (use default)'}`);
  console.log(`🐦 Ready to post tweets!`);
});

module.exports = app;