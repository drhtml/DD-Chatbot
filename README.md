# Dignitas Digital Chatbot

A modern, responsive chatbot interface for Dignitas Digital with AI-powered responses.

## Features

- 🤖 AI-powered chatbot responses
- 📱 Responsive design for all devices
- 🎨 Modern glass morphism UI
- 💬 Real-time chat interface
- 👍 Feedback system for responses
- 🔒 Secure webhook integration

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/DD-Chatbot.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a static site
   - Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project or create new
   - Set project name
   - Confirm deployment

### Option 3: Drag & Drop (Quick Test)

1. Go to [vercel.com](https://vercel.com)
2. Drag your project folder to the dashboard
3. Vercel will deploy instantly

## Environment Variables

If you need to configure webhook URLs or other settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add any required variables

## Custom Domain

1. In your Vercel project dashboard
2. Go to Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed

## File Structure

```
DD-Chatbot/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # JavaScript functionality
├── vercel.json         # Vercel configuration
└── README.md           # This file
```

## Support

For deployment issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)

## License

© Dignitas Digital. All rights reserved.
