# Setup Guide - Collegiate Inbox Navigator

This guide will walk you through setting up the Collegiate Inbox Navigator application from scratch.

## Prerequisites

- Node.js 20+ installed
- A Google account (for Firebase and testing)
- Basic understanding of environment variables

## Step 1: Install Dependencies

The dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

## Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or "Create a project"
3. Enter project name: `collegiate-inbox-navigator` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Enable Firebase Authentication

1. In Firebase Console, click "Authentication" in the left sidebar
2. Click "Get Started"
3. Enable these sign-in methods:
   - **Google**: Click Google → Enable → Save
   - **Email/Password**: Click Email/Password → Enable → Save

### Create Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to you)
5. Click "Enable"

### Get Firebase Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the Web icon `</>`
5. Register app name: `collegiate-inbox-navigator-web`
6. Copy the configuration values

## Step 3: Create Composio Account

1. Go to [Composio Dashboard](https://app.composio.dev)
2. Sign up with your email or GitHub
3. After signing in, go to [Settings](https://app.composio.dev/settings)
4. Copy your **API Key**

## Step 4: Get Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Select "Create API key in new project" or choose an existing project
4. Copy the generated API key

## Step 5: Configure Environment Variables

1. In the `code` folder, create a file named `.env.local`:

```bash
# Copy from .env.example
cp .env.example .env.local
```

2. Open `.env.local` and fill in the values:

```env
# Composio API Key (from Step 3)
COMPOSIO_API_KEY=your_composio_api_key_here

# Google Gemini API Key (from Step 4)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (from Step 2)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Run the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

## Step 7: Test the Application

### Test Authentication

1. Open http://localhost:3000
2. You should see the landing page with "Collegiate Inbox Navigator"
3. Click "Sign In with Google"
4. Sign in with your Google account
5. You should be redirected to the dashboard

### Test Integration Connection

1. After signing in, click "Integrations" in the top navigation
2. Click "Connect" on Gmail
3. You'll be redirected to Composio's OAuth page
4. Grant permissions to Gmail
5. You'll be redirected back to the app
6. Gmail should now show as "Connected"

Repeat for:
- Google Classroom
- Google Calendar
- Google Drive

### Test AI Chat

1. Go to Dashboard (click "Dashboard" in top nav)
2. In the chat interface, try typing:
   - "Show me all deadlines this week"
   - "Find unread emails from professors"
   - "What assignments are due soon?"

The AI will use Composio to fetch real data from your connected accounts!

## Common Issues

### Issue: "Firebase not configured"

**Solution**: Make sure all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`

### Issue: "Composio API key invalid"

**Solution**:
1. Check that `COMPOSIO_API_KEY` is correct
2. Verify you copied the key from https://app.composio.dev/settings
3. Make sure there are no extra spaces

### Issue: "Gemini AI error"

**Solution**:
1. Verify `GEMINI_API_KEY` is correct
2. Check you have API credits at https://aistudio.google.com
3. Ensure the key has proper permissions

### Issue: "No connected account" when using chat

**Solution**:
1. Go to `/integrations` page
2. Connect Gmail, Classroom, and Calendar
3. Each should show "Connected" status
4. Try the chat again

### Issue: Port 3000 already in use

**Solution**:
```bash
# Windows
taskkill /F /IM node.exe

# Mac/Linux
killall node

# Then run again
npm run dev
```

## Project Structure

```
code/
├── app/
│   ├── api/                  # API routes
│   │   ├── chat/            # AI chat endpoint
│   │   └── integrations/    # OAuth endpoints
│   ├── dashboard/           # Main dashboard page
│   ├── integrations/        # Integrations page
│   ├── page.tsx            # Landing page
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ChatInterface.tsx
│   └── IntegrationManager.tsx
├── lib/                    # Utility libraries
│   ├── firebase.ts
│   ├── composio.ts
│   └── gemini.ts
├── hooks/                  # React hooks
│   └── useFirebaseAuth.ts
└── .env.local             # Environment variables (create this!)
```

## Next Steps

Now that your app is running, you can:

1. **Connect your academic accounts**: Connect your university Gmail, Google Classroom, and Calendar
2. **Try the AI assistant**: Ask natural language questions about your deadlines and emails
3. **Explore the codebase**: Look at the components and API routes to understand how it works
4. **Add more features**: Extend with the bonus features listed in the README

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors (F12 → Console tab)
2. Check the terminal where `npm run dev` is running for server errors
3. Verify all environment variables are set correctly
4. Make sure Firebase Auth and Firestore are enabled
5. Ensure you have active internet connection for API calls

## Support

For issues specific to:
- **Firebase**: https://firebase.google.com/support
- **Composio**: https://docs.composio.dev or Discord
- **Gemini**: https://ai.google.dev/gemini-api/docs

## Success! 🎉

If you can:
- ✅ Sign in with Google
- ✅ See the dashboard
- ✅ Connect integrations
- ✅ Chat with the AI assistant

Then you're all set! The Collegiate Inbox Navigator is working correctly.
