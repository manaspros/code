# 🚀 AI Backend Guide - Collegiate Inbox Navigator

## 📁 Files Created

All new AI backend files are in `lib/ai/`:

```
lib/ai/
├── composio.ts    # Composio tool execution (Gmail, Calendar, Drive, Classroom)
├── gemini.ts      # Gemini AI + embeddings
├── mcp.ts         # MCP manifest (tool discovery)
├── rag.ts         # Gmail RAG pipeline (semantic search)
└── agent.ts       # Main orchestrator

app/api/
├── chat/route.ts  # Main chat endpoint
└── rag/route.ts   # RAG sync/search testing
```

---

## ⚙️ Environment Setup

Make sure your `.env` or `.env.local` has:

```bash
# Composio (get from composio.dev)
COMPOSIO_API_KEY=your_composio_api_key

# Gemini (get from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key

# Firebase Admin (existing)
FIREBASE_ADMIN_SDK_JSON={"type":"service_account",...}
```

---

## 🧪 Testing Steps

### 1️⃣ Test RAG Sync (Index Emails)

**Endpoint:** `POST /api/rag`

**Request:**
```json
{
  "action": "sync",
  "userId": "your_firebase_uid",
  "maxEmails": 20
}
```

**Expected Response:**
```json
{
  "success": true,
  "synced": 20,
  "message": "Successfully synced 20 emails to RAG index"
}
```

**What it does:**
- Fetches emails via Composio Gmail integration
- Generates embeddings using Gemini
- Stores in Firestore at `email_embeddings/{userId}/emails/{emailId}`

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/api/rag \
  -H "Content-Type: application/json" \
  -d '{"action":"sync","userId":"YOUR_UID","maxEmails":20}'
```

---

### 2️⃣ Test RAG Search (Semantic Email Search)

**Endpoint:** `POST /api/rag`

**Request:**
```json
{
  "action": "search",
  "userId": "your_firebase_uid",
  "query": "emails from professors",
  "topK": 5
}
```

**Expected Response:**
```json
{
  "success": true,
  "query": "emails from professors",
  "count": 5,
  "results": [
    {
      "emailId": "abc123",
      "subject": "Assignment Extension",
      "from": "professor@university.edu",
      "snippet": "The machine learning assignment...",
      "similarity": 0.87
    }
  ]
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/api/rag \
  -H "Content-Type: application/json" \
  -d '{"action":"search","userId":"YOUR_UID","query":"professor emails","topK":3}'
```

---

### 3️⃣ Test Chat Endpoint

**Endpoint:** `POST /api/chat`

**Request:**
```json
{
  "userId": "your_firebase_uid",
  "messages": [
    {
      "role": "user",
      "content": "Show me unread emails"
    }
  ]
}
```

**Expected Response:**
```json
{
  "text": "You have 5 unread emails. Here they are...",
  "toolCalls": [
    {
      "tool": "fetch_gmail_emails",
      "params": { "query": "is:unread" },
      "result": { "success": true, "data": [...] }
    }
  ],
  "ragUsed": false
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_UID","messages":[{"role":"user","content":"Show my emails"}]}'
```

---

## 🎯 Example Prompts

### Email Operations
```
"Show me unread emails from professors"
"Find emails about exam reschedule"
"Search emails mentioning machine learning"
```

### Calendar Operations
```
"Add all my assignment deadlines to calendar"
"Create calendar event for project meeting tomorrow at 3pm"
"What's on my calendar today?"
```

### Classroom Operations
```
"List all my upcoming assignments"
"What's due this week in Data Structures?"
"Show me assignments from all my courses"
```

### RAG Semantic Search
```
"Find emails with PDF attachments about algorithms"
"Search for emails from Dr. Smith about the final exam"
"Show me emails discussing the midterm"
```

---

## 🛠️ How the System Works

### Agent Flow

```
User Message
    ↓
[Agent] Analyze with Gemini + MCP manifest
    ↓
Decision:
├─ Tool needed? → Execute via Composio (Gmail, Calendar, etc.)
├─ Knowledge search? → Use RAG (semantic email search)
└─ Simple answer? → Return Gemini response
    ↓
Return structured result
```

### MCP (Model Context Protocol)

All tools are defined in `lib/ai/mcp.ts`:

```typescript
{
  name: "fetch_gmail_emails",
  description: "Fetch emails from Gmail",
  app: "gmail",
  composioAction: "GMAIL_FETCH_EMAILS",
  parameters: { ... }
}
```

The agent uses this manifest to:
1. Discover available tools
2. Generate Gemini function declarations
3. Route tool calls to Composio or internal handlers (RAG)

---

## 🔌 Adding a New Tool (Example: WhatsApp)

### Step 1: Add to MCP Manifest

Edit `lib/ai/mcp.ts`:

```typescript
{
  name: "send_whatsapp_message",
  description: "Send a WhatsApp message",
  app: "whatsapp",
  composioAction: "WHATSAPP_SEND_MESSAGE",
  parameters: {
    type: "object",
    properties: {
      to: { type: "string", description: "Phone number" },
      message: { type: "string", description: "Message content" }
    },
    required: ["to", "message"]
  }
}
```

### Step 2: Update App Mapping

In `lib/ai/composio.ts`, add to `getAppFromToolName()`:

```typescript
if (upper.includes("WHATSAPP")) return "whatsapp";
```

### Step 3: Connect WhatsApp in Composio

1. Go to composio.dev
2. Connect WhatsApp integration
3. Link to your user entity

### Step 4: Test

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_UID",
    "messages": [{
      "role": "user",
      "content": "Send WhatsApp to +1234567890 saying hello"
    }]
  }'
```

**That's it!** The agent automatically discovers and uses the new tool.

---

## 🧩 Architecture Summary

### Composio (`lib/ai/composio.ts`)
- Initializes Composio client
- Manages entities (Firebase UID → Composio entity)
- Executes tool actions (Gmail, Calendar, Drive, Classroom)

### Gemini (`lib/ai/gemini.ts`)
- Text generation (chat responses)
- Function calling (tool detection)
- Embeddings (for RAG)

### MCP (`lib/ai/mcp.ts`)
- Tool registry/manifest
- Routes tool calls to Composio or internal handlers
- Provides Gemini function declarations

### RAG (`lib/ai/rag.ts`)
- Syncs Gmail to Firestore with embeddings
- Semantic search via cosine similarity
- Fast knowledge retrieval

### Agent (`lib/ai/agent.ts`)
- Orchestrates everything
- Decides: tool call, RAG search, or simple response
- Returns structured results

---

## 🐛 Troubleshooting

### "No active gmail connection for user"
→ User needs to connect Gmail via Composio:
```
https://app.composio.dev/connections
```

### "API rate limit reached"
→ Gemini free tier has 30 RPM limit. Wait a minute or upgrade.

### "Firebase Admin credentials not configured"
→ Set `FIREBASE_ADMIN_SDK_JSON` in `.env`

### RAG search returns no results
→ Run sync first: `POST /api/rag` with `action: "sync"`

### TypeScript errors
→ Run `npm install` to ensure all dependencies are installed

---

## 📊 Performance Tips

1. **Sync emails incrementally**: Use `maxEmails: 50` for first sync
2. **RAG is faster than live search**: Use semantic search for repeat queries
3. **Tool calls take 2-5s**: Composio API calls are async
4. **Batch operations**: Group similar tasks in one prompt

---

## 🚀 Next Steps

1. ✅ Test Gmail fetch via `/api/rag` sync
2. ✅ Test semantic search
3. ✅ Test chat with tool execution
4. 🔄 Connect Calendar, Classroom, Drive in Composio
5. 🔄 Add more MCP tools as needed
6. 🔄 Implement streaming for real-time responses
7. 🔄 Add error handling for edge cases

---

## 📝 API Quick Reference

### Chat API
- **POST** `/api/chat` - Main AI interaction
- **GET** `/api/chat` - Health check

### RAG API
- **POST** `/api/rag` - Sync/search emails
- **GET** `/api/rag` - Usage info

### Request Format

**Chat:**
```json
{
  "userId": "string",
  "messages": [{ "role": "user|assistant", "content": "string" }]
}
```

**RAG Sync:**
```json
{
  "action": "sync",
  "userId": "string",
  "maxEmails": 50
}
```

**RAG Search:**
```json
{
  "action": "search",
  "userId": "string",
  "query": "string",
  "topK": 5
}
```

---

**Built with ❤️ for fast MVP deployment. Ready to ship! 🚢**
