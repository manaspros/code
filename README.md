# Collegiate Inbox Navigator 🎓

An AI-powered academic assistant that helps college students manage their emails, assignments, deadlines, and course materials through a natural language interface powered by Google Gemini AI and Composio.

## Features

### Core Features ✅
- **Natural Language Chat Interface**: Ask questions like "Show me all deadlines this week"
- **Gmail Integration**: Read, search, and manage university emails
- **Google Classroom Integration**: Access courses, assignments, materials
- **Google Calendar Integration**: View and sync deadlines automatically
- **Google Drive Integration**: Search and access course files
- **Smart Email Categorization**: AI automatically categorizes emails
- **Critical Path Dashboard**: Deadlines, Documents, and Alerts

### Bonus Features 🚀
- **Calendar Heatmap**: GitHub-style visualization
- **Analytics Dashboard**: Charts showing emails/week, deadlines/month
- **Faculty Filter**: View only professor emails
- **8 AM Daily Routine**: Automated morning check
- **Push Notifications**: Browser notifications for critical changes
- **NLP File Search**: Semantic search with Pinecone
- **Voice Interaction**: Speech-to-text and text-to-speech

## Tech Stack

- Next.js 15 (React 19), Material-UI v6, Firebase, Composio, Google Gemini AI
- Recharts, Pinecone, node-cron, Web Speech API

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
npm run dev
```

Open http://localhost:3000

## Environment Setup

Get API keys from:
- Composio: https://app.composio.dev/settings
- Gemini: https://aistudio.google.com/apikey
- Firebase: https://console.firebase.google.com
- Pinecone (optional): https://www.pinecone.io/

## Usage

1. Sign in with Google or Email
2. Connect apps at `/integrations`
3. Start chatting with the AI assistant

Example commands:
- "Show me all deadlines this week"
- "Find PDFs from my Machine Learning course"
- "What's due this weekend?"

## How It Works

User Query → Gemini AI → Composio Tools → Google APIs → Formatted Response

Composio handles OAuth and provides 250+ tools. Gemini AI understands natural language and calls the right tools automatically.

## Deploy

```bash
vercel
```

Built for Hackathon Challenge 5 with ❤️
