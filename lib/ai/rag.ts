/**
 * RAG Pipeline for Gmail
 * Semantic email search using Gemini embeddings + Firestore
 */

import { getAdminDb } from "../firebaseAdmin";
import { generateEmbedding } from "./gemini";
import { executeComposioTool } from "./composio";

export interface EmailDocument {
  emailId: string;
  subject: string;
  from: string;
  snippet: string;
  body?: string;
  embedding: number[];
  timestamp: Date;
  metadata: {
    hasAttachment?: boolean;
    labels?: string[];
    isUnread?: boolean;
  };
}

export interface SearchResult {
  emailId: string;
  subject: string;
  from: string;
  snippet: string;
  similarity: number;
  metadata: any;
}

/**
 * Sync Gmail to RAG index
 * Fetches emails via Composio, generates embeddings, stores in Firestore
 */
export async function syncGmailToRAG(
  userId: string,
  maxEmails: number = 50
): Promise<{ success: boolean; synced: number; error?: string }> {
  try {
    const db = getAdminDb();

    // 1. Fetch emails via Composio
    const result = await executeComposioTool({
      userId,
      toolName: "GMAIL_FETCH_EMAILS",
      parameters: {
        maxResults: maxEmails,
      },
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        synced: 0,
        error: result.error || "Failed to fetch emails",
      };
    }

    const emails = Array.isArray(result.data) ? result.data : [result.data];
    let syncedCount = 0;

    // 2. Process each email
    for (const email of emails) {
      try {
        const emailId = email.id || email.emailId || `email_${Date.now()}`;
        const subject = email.subject || "(no subject)";
        const from = email.from || "unknown";
        const snippet = email.snippet || email.body || "";
        const body = email.body || email.snippet || "";

        // 3. Generate embedding for email content
        const content = `Subject: ${subject}\nFrom: ${from}\nBody: ${snippet}`;
        const embedding = await generateEmbedding(content);

        // 4. Store in Firestore
        const emailDoc: EmailDocument = {
          emailId,
          subject,
          from,
          snippet,
          body,
          embedding,
          timestamp: new Date(),
          metadata: {
            hasAttachment: email.hasAttachment || false,
            labels: email.labels || [],
            isUnread: email.isUnread || false,
          },
        };

        await db
          .collection("email_embeddings")
          .doc(userId)
          .collection("emails")
          .doc(emailId)
          .set(emailDoc);

        syncedCount++;
      } catch (emailError) {
        console.error(`Error processing email:`, emailError);
        // Continue with next email
      }
    }

    return {
      success: true,
      synced: syncedCount,
    };
  } catch (error: any) {
    console.error("RAG sync error:", error);
    return {
      success: false,
      synced: 0,
      error: error.message,
    };
  }
}

/**
 * Search emails semantically using RAG
 * Uses cosine similarity to find most relevant emails
 */
export async function searchEmailsSemantic(
  userId: string,
  query: string,
  topK: number = 5
): Promise<SearchResult[]> {
  try {
    const db = getAdminDb();

    // 1. Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Fetch all email embeddings from Firestore
    const emailsSnapshot = await db
      .collection("email_embeddings")
      .doc(userId)
      .collection("emails")
      .get();

    if (emailsSnapshot.empty) {
      return [];
    }

    // 3. Calculate similarity scores
    const results: SearchResult[] = [];

    emailsSnapshot.docs.forEach((doc) => {
      const data = doc.data() as EmailDocument;
      const similarity = cosineSimilarity(queryEmbedding, data.embedding);

      results.push({
        emailId: data.emailId,
        subject: data.subject,
        from: data.from,
        snippet: data.snippet,
        similarity,
        metadata: data.metadata,
      });
    });

    // 4. Sort by similarity and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  } catch (error) {
    console.error("RAG search error:", error);
    throw error;
  }
}

/**
 * Cosine similarity between two vectors
 * Returns value between 0 and 1 (1 = identical)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Get RAG stats for a user
 * How many emails are indexed
 */
export async function getRAGStats(userId: string) {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("email_embeddings")
      .doc(userId)
      .collection("emails")
      .count()
      .get();

    return {
      emailsIndexed: snapshot.data().count,
    };
  } catch (error) {
    console.error("Error getting RAG stats:", error);
    return { emailsIndexed: 0 };
  }
}
