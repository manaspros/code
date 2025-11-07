/**
 * Semantic search using embeddings
 * Much more efficient than analyzing every email with Gemini
 */

// Simple embedding using Nomic or similar service
// For now, we'll use a keyword-based approach that's almost as good

interface EmailDocument {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  timestamp: Date;
  labels?: string[];
}

/**
 * Extract keywords and metadata from email without AI
 * This is INSTANT and FREE - no API calls!
 */
export function extractEmailMetadata(subject: string, from: string, snippet: string) {
  const text = `${subject} ${from} ${snippet}`.toLowerCase();

  // Detect course codes
  const coursePattern = /\b([A-Z]{2,4}[-\s]?\d{3,4}[A-Z]?)\b/gi;
  const courses = text.match(coursePattern) || [];

  // Detect deadline keywords and dates
  const hasDeadline = /\b(due|deadline|submit|submission|by|before)\b/i.test(text);
  const datePattern = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+ \d{1,2}(?:st|nd|rd|th)?)\b/gi;
  const dates = text.match(datePattern) || [];

  // Detect alert keywords
  const alertKeywords = ['cancelled', 'canceled', 'rescheduled', 'postponed', 'urgent', 'room change'];
  const alerts = alertKeywords.filter(kw => text.includes(kw));

  // Detect content type
  const isAssignment = /\b(assignment|homework|hw|problem set|ps)\b/i.test(text);
  const isExam = /\b(exam|test|quiz|midterm|final)\b/i.test(text);
  const isAnnouncement = /\b(announcement|update|notice|reminder)\b/i.test(text);

  // Detect sender type
  const isProfessor = /\b(professor|prof|instructor|dr\.|teacher)\b/i.test(from);
  const isTA = /\b(ta|teaching assistant)\b/i.test(from);
  const isAdmin = /\b(admin|office|registrar|department)\b/i.test(from);

  return {
    courses: [...new Set(courses.map(c => c.toUpperCase()))],
    hasDeadline,
    dates,
    alerts,
    contentType: isAssignment ? 'assignment' : isExam ? 'exam' : isAnnouncement ? 'announcement' : 'other',
    senderType: isProfessor ? 'professor' : isTA ? 'ta' : isAdmin ? 'admin' : 'other',
    isAcademic: courses.length > 0 || isAssignment || isExam,
    needsAttention: alerts.length > 0 || hasDeadline,
  };
}

/**
 * Smart filtering: Only analyze emails that need AI
 * Returns: { needsAnalysis, reason, metadata }
 */
export function shouldAnalyzeWithAI(subject: string, from: string, snippet: string) {
  const metadata = extractEmailMetadata(subject, from, snippet);

  // Skip non-academic emails entirely
  if (!metadata.isAcademic) {
    return {
      needsAnalysis: false,
      reason: 'not_academic',
      metadata,
    };
  }

  // If course is detected and no deadline/alert, skip AI
  if (metadata.courses.length > 0 && !metadata.hasDeadline && metadata.alerts.length === 0) {
    return {
      needsAnalysis: false,
      reason: 'simple_course_email',
      metadata,
    };
  }

  // If it has deadlines or alerts, needs AI analysis
  if (metadata.hasDeadline || metadata.alerts.length > 0) {
    return {
      needsAnalysis: true,
      reason: 'has_important_info',
      metadata,
    };
  }

  // Default: skip analysis
  return {
    needsAnalysis: false,
    reason: 'no_important_info',
    metadata,
  };
}

/**
 * Query emails semantically without embeddings
 * Uses smart keyword matching and metadata
 */
export function searchEmails(
  emails: EmailDocument[],
  query: string,
  filters?: {
    course?: string;
    hasDeadline?: boolean;
    contentType?: string;
  }
): EmailDocument[] {
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(' ').filter(w => w.length > 2);

  return emails
    .map(email => {
      const metadata = extractEmailMetadata(email.subject, email.from, email.snippet);
      const text = `${email.subject} ${email.from} ${email.snippet}`.toLowerCase();

      // Calculate relevance score
      let score = 0;

      // Keyword matching
      keywords.forEach(keyword => {
        if (text.includes(keyword)) score += 1;
      });

      // Boost for matching course
      if (filters?.course && metadata.courses.some(c => c.includes(filters.course!.toUpperCase()))) {
        score += 5;
      }

      // Boost for deadline emails
      if (filters?.hasDeadline && metadata.hasDeadline) {
        score += 3;
      }

      // Boost for matching content type
      if (filters?.contentType && metadata.contentType === filters.contentType) {
        score += 2;
      }

      return { email, score, metadata };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ email }) => email);
}

/**
 * Batch categorize emails efficiently
 * Returns course assignments without calling AI for most emails
 */
export function quickCategorizeEmails(emails: Array<{ subject: string; from: string; snippet: string }>) {
  return emails.map(email => {
    const metadata = extractEmailMetadata(email.subject, email.from, email.snippet);
    const shouldAnalyze = shouldAnalyzeWithAI(email.subject, email.from, email.snippet);

    return {
      course: metadata.courses[0] || null, // Use first detected course
      needsAIAnalysis: shouldAnalyze.needsAnalysis,
      metadata,
      ...email,
    };
  });
}
