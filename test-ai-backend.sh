#!/bin/bash

# AI Backend Testing Script
# Test all endpoints to verify functionality

echo "🚀 Testing Collegiate Inbox Navigator AI Backend"
echo "=================================================="
echo ""

# Configuration
BASE_URL="http://localhost:3000"
USER_ID="${USER_ID:-test_user_123}"

echo "Base URL: $BASE_URL"
echo "User ID: $USER_ID"
echo ""

# Test 1: Health Checks
echo "📡 Test 1: Health Checks"
echo "------------------------"
echo "GET /api/chat"
curl -s "$BASE_URL/api/chat" | jq .
echo ""
echo "GET /api/rag"
curl -s "$BASE_URL/api/rag" | jq .
echo ""

# Test 2: RAG Stats
echo "📊 Test 2: RAG Stats"
echo "--------------------"
curl -s -X POST "$BASE_URL/api/rag" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"stats\",
    \"userId\": \"$USER_ID\"
  }" | jq .
echo ""

# Test 3: RAG Sync (Index Emails)
echo "📥 Test 3: RAG Sync (Index 5 Emails)"
echo "-------------------------------------"
curl -s -X POST "$BASE_URL/api/rag" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"sync\",
    \"userId\": \"$USER_ID\",
    \"maxEmails\": 5
  }" | jq .
echo ""

# Test 4: RAG Semantic Search
echo "🔍 Test 4: RAG Semantic Search"
echo "-------------------------------"
curl -s -X POST "$BASE_URL/api/rag" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"search\",
    \"userId\": \"$USER_ID\",
    \"query\": \"professor emails\",
    \"topK\": 3
  }" | jq .
echo ""

# Test 5: Chat - Simple Message
echo "💬 Test 5: Chat - Simple Message"
echo "---------------------------------"
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"Hello, how are you?\"}
    ]
  }" | jq .
echo ""

# Test 6: Chat - Tool Execution
echo "🔧 Test 6: Chat - Tool Execution Request"
echo "-----------------------------------------"
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"Show me my unread emails\"}
    ]
  }" | jq .
echo ""

# Test 7: Chat - RAG Search
echo "🧠 Test 7: Chat - RAG Search Request"
echo "-------------------------------------"
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"Find emails about assignments\"}
    ]
  }" | jq .
echo ""

echo "✅ Testing Complete!"
echo "===================="
echo ""
echo "Check results above for any errors."
echo "For detailed docs, see:"
echo "  - QUICKSTART.md"
echo "  - AI_BACKEND_GUIDE.md"
echo "  - AI_REBUILD_COMPLETE.md"
