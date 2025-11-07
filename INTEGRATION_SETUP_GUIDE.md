# 🔌 Integration Setup Guide - Gmail, Drive, Classroom

Complete guide to setting up all integrations for the Collegiate Inbox Navigator.

---

## 🎯 Overview

You need to set up 3 Google integrations:
1. **Gmail** - Email access
2. **Google Drive** - File access
3. **Google Classroom** - Assignment access
4. **(Optional) Google Calendar** - Calendar events

---

## 📋 Prerequisites

### 1. Composio Account & API Key

✅ **You already have:** `COMPOSIO_API_KEY` in your `.env`

### 2. Google Cloud Project (for OAuth)

You need a Google Cloud Project with OAuth credentials. Composio will use these.

---

## 🚀 Step-by-Step Setup

### Step 1: Go to Composio Dashboard

1. Open https://app.composio.dev
2. Log in with your account

### Step 2: Set Up Gmail Integration

#### 2.1 Navigate to Integrations

1. Click **"Integrations"** in the left sidebar
2. Search for **"Gmail"**
3. Click on **Gmail**

#### 2.2 Configure Gmail Auth

You have two options:

**Option A: Use Composio's Default OAuth (Easiest)**
- Click **"Enable Integration"**
- Composio handles all OAuth setup
- **Recommended for MVP/testing**

**Option B: Use Your Own OAuth Credentials (Production)**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search "Gmail API" and enable it
4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Add authorized redirect URIs:
     ```
     https://backend.composio.dev/api/v1/auth-apps/add
     https://backend.composio.dev/api/v1/connectedAccounts
     ```
5. Copy **Client ID** and **Client Secret**
6. Back in Composio, paste these credentials

#### 2.3 Save Configuration

- Click **"Save"** or **"Enable"**
- Gmail integration is now ready!

---

### Step 3: Set Up Google Drive Integration

#### 3.1 Navigate to Integrations

1. Still in Composio Dashboard
2. Search for **"Google Drive"**
3. Click on **Google Drive**

#### 3.2 Configure Drive Auth

**Option A: Use Composio's Default OAuth (Easiest)**
- Click **"Enable Integration"**

**Option B: Use Your Own OAuth Credentials (Production)**

1. In Google Cloud Console (same project as Gmail)
2. Enable Google Drive API:
   - "APIs & Services" > "Library"
   - Search "Google Drive API" and enable it
3. Use the **same OAuth credentials** from Gmail step
   - OR create new OAuth credentials with same redirect URIs
4. In Composio, configure with Client ID & Secret

#### 3.3 Save Configuration

- Click **"Save"**
- Google Drive integration ready!

---

### Step 4: Set Up Google Classroom Integration

#### 4.1 Navigate to Integrations

1. In Composio Dashboard
2. Search for **"Google Classroom"**
3. Click on **Google Classroom**

#### 4.2 Configure Classroom Auth

**Option A: Use Composio's Default OAuth**
- Click **"Enable Integration"**

**Option B: Use Your Own OAuth Credentials**

1. In Google Cloud Console (same project)
2. Enable Google Classroom API:
   - "APIs & Services" > "Library"
   - Search "Google Classroom API" and enable it
3. Use the **same OAuth credentials** from Gmail
4. In Composio, configure with Client ID & Secret

#### 4.3 Save Configuration

- Click **"Save"**
- Google Classroom integration ready!

---

### Step 5 (Optional): Set Up Google Calendar

#### 5.1 Navigate to Integrations

1. In Composio Dashboard
2. Search for **"Google Calendar"**
3. Click on **Google Calendar**

#### 5.2 Configure Calendar Auth

Same process as above:
- Enable Google Calendar API in Google Cloud Console
- Use same OAuth credentials
- Configure in Composio

---

## ✅ Verify Setup

### Check Integrations are Active

1. In Composio Dashboard, go to **"Integrations"**
2. You should see:
   - ✅ Gmail (Active)
   - ✅ Google Drive (Active)
   - ✅ Google Classroom (Active)
   - ✅ Google Calendar (Active - optional)

---

## 🔗 Connect Your Account

Now that integrations are set up, connect YOUR Google account:

### Method 1: Via Your App UI

1. Go to http://localhost:3000/integrations
2. Click **"Connect Gmail"**
3. Authorize with your Google account
4. Repeat for Drive, Classroom, Calendar

### Method 2: Via Composio Dashboard

1. In Composio, go to **"Connections"**
2. Click **"New Connection"**
3. Select **Gmail**
4. Select entity: `mOeydGrEYhdA9LNftbNrVc8LuGI3` (your Firebase UID)
5. Click **"Connect"**
6. Authorize with your Google account
7. Repeat for other integrations

---

## 🧪 Test Connections

Once connected, test in your app:

```bash
# 1. Check connections
curl http://localhost:3000/api/integrations/list?userId=mOeydGrEYhdA9LNftbNrVc8LuGI3

# Should return:
# {
#   "connections": [
#     { "app": "gmail", "status": "ACTIVE" },
#     { "app": "googledrive", "status": "ACTIVE" },
#     { "app": "googleclassroom", "status": "ACTIVE" }
#   ]
# }
```

---

## 🎯 Test AI Backend with Real Data

Once Gmail is connected:

### 1. Sync Emails to RAG

```bash
curl -X POST http://localhost:3000/api/rag \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sync",
    "userId": "mOeydGrEYhdA9LNftbNrVc8LuGI3",
    "maxEmails": 10
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "synced": 10,
  "message": "Successfully synced 10 emails to RAG index"
}
```

### 2. Search Emails Semantically

```bash
curl -X POST http://localhost:3000/api/rag \
  -H "Content-Type: application/json" \
  -d '{
    "action": "search",
    "userId": "mOeydGrEYhdA9LNftbNrVc8LuGI3",
    "query": "professor emails about assignments",
    "topK": 5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "count": 5,
  "results": [
    {
      "emailId": "...",
      "subject": "Assignment 3 Due Date",
      "from": "professor@university.edu",
      "snippet": "...",
      "similarity": 0.87
    }
  ]
}
```

### 3. Chat with AI Agent

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "mOeydGrEYhdA9LNftbNrVc8LuGI3",
    "messages": [{
      "role": "user",
      "content": "Show me my unread emails from professors"
    }]
  }'
```

**Expected Response:**
```json
{
  "text": "I found 3 unread emails from professors:\n1. Prof. Smith - Assignment Extension\n2. Dr. Johnson - Exam Schedule\n3. Prof. Lee - Office Hours",
  "toolCalls": [{
    "tool": "fetch_gmail_emails",
    "result": { ... }
  }],
  "ragUsed": false
}
```

---

## 🔧 Troubleshooting

### Error: "Auth config not found"

**Cause:** Integration not enabled in Composio dashboard

**Fix:**
1. Go to https://app.composio.dev/integrations
2. Enable Gmail/Drive/Classroom
3. Make sure each shows "Active" status

---

### Error: "No active connection"

**Cause:** You haven't connected your Google account yet

**Fix:**
1. Go to http://localhost:3000/integrations
2. Click "Connect" for each service
3. Authorize with your Google account

---

### Error: "Invalid credentials"

**Cause:** OAuth credentials are incorrect or expired

**Fix:**
1. In Composio, check integration settings
2. Verify Client ID and Secret are correct
3. Make sure redirect URIs match exactly

---

### Error: "Access denied"

**Cause:** Missing OAuth scopes

**Fix:**
1. In Google Cloud Console, edit OAuth consent screen
2. Add required scopes:
   - Gmail: `https://www.googleapis.com/auth/gmail.readonly`
   - Drive: `https://www.googleapis.com/auth/drive.readonly`
   - Classroom: `https://www.googleapis.com/auth/classroom.courses.readonly`
3. Reconnect in your app

---

## 📊 Integration Status Checklist

Use this checklist to track setup:

### Composio Dashboard Setup
- [ ] Composio account created
- [ ] API key in `.env` file
- [ ] Gmail integration enabled
- [ ] Google Drive integration enabled
- [ ] Google Classroom integration enabled
- [ ] Google Calendar integration enabled (optional)

### Google Cloud Console (if using own OAuth)
- [ ] Google Cloud project created
- [ ] Gmail API enabled
- [ ] Drive API enabled
- [ ] Classroom API enabled
- [ ] Calendar API enabled (optional)
- [ ] OAuth credentials created
- [ ] Redirect URIs configured
- [ ] Credentials added to Composio

### User Connection
- [ ] Connected Gmail in app
- [ ] Connected Google Drive in app
- [ ] Connected Google Classroom in app
- [ ] Connected Google Calendar in app (optional)

### Testing
- [ ] `/api/integrations/list` returns connections
- [ ] `/api/rag` sync works
- [ ] `/api/rag` search returns results
- [ ] `/api/chat` can fetch emails
- [ ] `/api/chat` can access Drive files
- [ ] `/api/chat` can list assignments

---

## 🎯 What You Can Do After Setup

Once all integrations are connected:

### Email Operations (Gmail)
```
"Show me unread emails"
"Find emails from Dr. Smith"
"Search emails about machine learning"
"Summarize emails from last week"
```

### File Operations (Drive)
```
"Find PDF files about algorithms"
"Show me recent documents"
"Search for lecture notes"
```

### Assignment Operations (Classroom)
```
"List all my assignments"
"What's due this week?"
"Show assignments from Data Structures course"
```

### Calendar Operations (Calendar)
```
"What's on my calendar today?"
"Add assignment deadlines to calendar"
"Create event for project meeting"
```

### Combined Operations (All)
```
"Find all assignment deadlines and add them to my calendar"
"Show me emails with attachments from my CS professor"
"Summarize all course updates from this week"
```

---

## 📚 Next Steps

1. **Complete setup checklist above**
2. **Test each integration** with the curl commands
3. **Try AI agent** with combined queries
4. **Integrate with your UI** (already built!)
5. **Deploy to production** when ready

---

## 🔐 Security Notes

### For Production Deployment:

1. **Use your own OAuth credentials** (not Composio's default)
2. **Restrict OAuth scopes** to only what you need
3. **Set up OAuth consent screen** verification
4. **Add authorized domains** in Google Cloud Console
5. **Rotate API keys** regularly
6. **Enable 2FA** on Composio account
7. **Monitor API usage** in Composio dashboard

---

## 💡 Tips for Success

### 1. Start with One Integration
- Get Gmail working first
- Test thoroughly before adding others
- This helps isolate issues

### 2. Use Composio's Default OAuth Initially
- Faster to set up
- Good for MVP/testing
- Switch to own OAuth for production

### 3. Test Incrementally
- Test connection first
- Then test data fetch
- Then test AI agent integration
- Finally test UI integration

### 4. Monitor Composio Logs
- Go to https://app.composio.dev/logs
- Check for any errors
- Useful for debugging connection issues

---

## 📞 Getting Help

### Composio Documentation
- **Main Docs:** https://docs.composio.dev
- **Integration Guides:** https://docs.composio.dev/integrations
- **API Reference:** https://docs.composio.dev/api-reference

### Your AI Backend Docs
- **QUICKSTART.md** - Testing guide
- **AI_BACKEND_GUIDE.md** - API reference
- **TEST_RESULTS.md** - Verified tests

---

**Ready to connect! 🚀**

Follow this guide step-by-step and all your integrations will work perfectly with the AI backend!
