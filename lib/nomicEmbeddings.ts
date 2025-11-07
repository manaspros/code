/**
 * Simple email processing with Nomic embeddings
 * Store emails as embeddings, query with RAG - no complex AI needed!
 */

const NOMIC_API_KEY = process.env.NOMIC_API_KEY || "nk-dQ36AzCq4RtEI-VrvbJOO7FFzALBMHGkNvbPluUG4eM";
const NOMIC_API_URL = "https://api-atlas.nomic.ai/v1/embedding/text";

interface EmailEmbedding {
  emailId: string;
  subject: string;
  from: string;
  snippet: string;
  embedding: number[];
  metadata: {
    course?: string;
    hasDeadline: boolean;
    hasAlert: boolean;
  };
}

/**
 * Create embedding for email using Nomic
 */
export async function createEmailEmbedding(
  emailId: string,
  subject: string,
  from: string,
  snippet: string
): Promise<EmailEmbedding | null> {
  try {
    // Combine email text for embedding
    const text = `From: ${from}\nSubject: ${subject}\n${snippet}`;

    const response = await fetch(NOMIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NOMIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: "nomic-embed-text-v1.5",
        texts: [text],
      }),
    });

    if (!response.ok) {
      console.error("Nomic API error:", await response.text());
      return null;
    }

    const data = await response.json();
    const embedding = data.embeddings[0];

    // Simple metadata extraction (no AI needed!)
    const coursePattern = /\b([A-Z]{2,4}[-\s]?\d{3,4}[A-Z]?)\b/i;
    const courseMatch = text.match(coursePattern);

    const hasDeadline = /\b(due|deadline|submit|submission)\b/i.test(text);
    const hasAlert = /\b(cancelled|canceled|rescheduled|urgent)\b/i.test(text);

    return {
      emailId,
      subject,
      from,
      snippet,
      embedding,
      metadata: {
        course: courseMatch ? courseMatch[1].toUpperCase() : undefined,
        hasDeadline,
        hasAlert,
      },
    };
  } catch (error) {
    console.error("Error creating embedding:", error);
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Search emails by semantic similarity
 */
export async function searchEmailsBySemantic(
  query: string,
  storedEmails: EmailEmbedding[],
  topK: number = 5
): Promise<EmailEmbedding[]> {
  try {
    // Create embedding for query
    const response = await fetch(NOMIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NOMIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: "nomic-embed-text-v1.5",
        texts: [query],
      }),
    });

    if (!response.ok) {
      console.error("Nomic API error:", await response.text());
      return [];
    }

    const data = await response.json();
    const queryEmbedding = data.embeddings[0];

    // Calculate similarities
    const results = storedEmails.map((email) => ({
      email,
      similarity: cosineSimilarity(queryEmbedding, email.embedding),
    }));

    // Sort by similarity and return top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map((r) => r.email);
  } catch (error) {
    console.error("Error searching emails:", error);
    return [];
  }
}

/**
 * Simple batch embedding creation
 * Much faster than individual AI analysis!
 */
export async function batchCreateEmbeddings(
  emails: Array<{
    id: string;
    subject: string;
    from: string;
    snippet: string;
  }>
): Promise<EmailEmbedding[]> {
  const texts = emails.map(
    (e) => `From: ${e.from}\nSubject: ${e.subject}\n${e.snippet}`
  );

  try {
    const response = await fetch(NOMIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NOMIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: "nomic-embed-text-v1.5",
        texts: texts,
      }),
    });

    if (!response.ok) {
      console.error("Nomic API error:", await response.text());
      return [];
    }

    const data = await response.json();

    return emails.map((email, i) => {
      const text = texts[i];
      const coursePattern = /\b([A-Z]{2,4}[-\s]?\d{3,4}[A-Z]?)\b/i;
      const courseMatch = text.match(coursePattern);

      return {
        emailId: email.id,
        subject: email.subject,
        from: email.from,
        snippet: email.snippet,
        embedding: data.embeddings[i],
        metadata: {
          course: courseMatch ? courseMatch[1].toUpperCase() : undefined,
          hasDeadline: /\b(due|deadline|submit|submission)\b/i.test(text),
          hasAlert: /\b(cancelled|canceled|rescheduled|urgent)\b/i.test(text),
        },
      };
    });
  } catch (error) {
    console.error("Error batch creating embeddings:", error);
    return [];
  }
}
