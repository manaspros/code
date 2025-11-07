import { NextRequest, NextResponse } from "next/server";
import { executeAction } from "@/lib/composio";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { batchCreateEmbeddings } from "@/lib/nomicEmbeddings";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    console.log(`Starting email sync for user: ${userId}`);

    // Check last sync time to do incremental sync
    const db = getAdminDb();
    const statusDoc = await db.collection("sync_status").doc(userId).get();

    let query = "";
    let isInitialSync = false;

    if (statusDoc.exists) {
      // Incremental sync: only fetch emails since last sync
      const data = statusDoc.data();
      const lastSync = data?.lastSync;
      if (lastSync && lastSync.toDate) {
        const lastSyncTime = lastSync.toDate();
        const lastSyncUnix = Math.floor(lastSyncTime.getTime() / 1000);
        query = `after:${lastSyncUnix}`;
        console.log(`Incremental sync: fetching emails after ${lastSyncTime.toISOString()}`);
      } else {
        isInitialSync = true;
      }
    } else {
      isInitialSync = true;
    }

    if (isInitialSync) {
      // Initial sync: fetch last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = `after:${Math.floor(thirtyDaysAgo.getTime() / 1000)}`;
      console.log(`Initial sync: fetching emails from last 30 days`);
    }

    // Use GMAIL_FETCH_EMAILS with correct parameters
    const searchResult = await executeAction(userId, "GMAIL_FETCH_EMAILS", {
      query: query,
      max_results: 100,
      user_id: "me",
      include_payload: true,
      verbose: true,
    });

    console.log("Search result:", {
      successfull: searchResult.successfull,
      hasData: !!searchResult.data,
      dataKeys: searchResult.data ? Object.keys(searchResult.data) : [],
    });

    if (!searchResult.successfull || !searchResult.data?.emails) {
      console.log("No new emails found since last sync");
      return NextResponse.json({
        success: true,
        synced: 0,
        message: isInitialSync ? "No emails found in the last 30 days" : "No new emails since last sync",
        debug: searchResult.data || "No data returned"
      });
    }

    const messages = searchResult.data.emails;

    if (messages.length === 0) {
      console.log("Email sync: Already up to date, no new emails");
      return NextResponse.json({
        success: true,
        synced: 0,
        message: "Already up to date! No new emails since last sync.",
      });
    }

    console.log(`Processing ${messages.length} emails...`);

    // Extract email data for batch processing
    const emailsForEmbedding = messages.map((msg: any) => {
      const headers = msg.payload?.headers || [];
      return {
        id: msg.id,
        subject: headers.find((h: any) => h.name === "Subject")?.value || "",
        from: headers.find((h: any) => h.name === "From")?.value || "",
        snippet: msg.snippet || "",
        date: headers.find((h: any) => h.name === "Date")?.value || "",
        payload: msg.payload,
      };
    });

    // Create embeddings in ONE batch call (no AI analysis per email!)
    console.log("Creating embeddings with Nomic...");
    const emailEmbeddings = await batchCreateEmbeddings(emailsForEmbedding);
    console.log(`Created ${emailEmbeddings.length} embeddings`);

    let batch = db.batch();
    let synced = 0;
    let deadlinesFound = 0;
    let alertsFound = 0;
    let documentsFound = 0;
    let batchCount = 0;

    // Process emails with embeddings (no AI calls!)
    for (let i = 0; i < messages.length; i++) {
      try {
        const message = messages[i];
        const emailData = emailsForEmbedding[i];
        const embedding = emailEmbeddings[i];

        if (!embedding) {
          console.log(`Skipping email ${message.id} - no embedding created`);
          continue;
        }

        const { subject, from, date, payload } = emailData;
        const course = embedding.metadata.course || "Uncategorized";

        // Save embedding to Firestore
        const embeddingRef = db.collection("email_embeddings").doc(userId).collection("emails").doc(message.id);
        batch.set(embeddingRef, {
          emailId: message.id,
          subject,
          from,
          snippet: embedding.snippet,
          embedding: embedding.embedding,
          course,
          hasDeadline: embedding.metadata.hasDeadline,
          hasAlert: embedding.metadata.hasAlert,
          date,
          createdAt: FieldValue.serverTimestamp(),
        });
        batchCount++;

        // Save deadline if detected by metadata
        if (embedding.metadata.hasDeadline) {
          const deadlineRef = db.collection("cache_deadlines").doc(userId).collection("items").doc();
          batch.set(deadlineRef, {
            title: subject,
            dueAt: date, // Will need better date parsing
            type: "assignment",
            course,
            source: "gmail",
            emailId: message.id,
            from,
            createdAt: FieldValue.serverTimestamp(),
          });
          deadlinesFound++;
          batchCount++;
        }

        // Save alert if detected by metadata
        if (embedding.metadata.hasAlert) {
          const alertRef = db.collection("cache_alerts").doc(userId).collection("items").doc();
          batch.set(alertRef, {
            kind: "urgent",
            subject,
            link: null,
            course,
            emailId: message.id,
            from,
            date,
            createdAt: FieldValue.serverTimestamp(),
          });
          alertsFound++;
          batchCount++;
        }

        // Extract attachments
        const parts = payload?.parts || [];
        for (const part of parts) {
          const filename = part.filename || "";
          const isDocument =
            filename.endsWith(".pdf") ||
            filename.endsWith(".docx") ||
            filename.endsWith(".pptx") ||
            filename.endsWith(".ppt") ||
            filename.endsWith(".doc");

          if (isDocument && part.body?.attachmentId) {
            const docRef = db.collection("cache_documents").doc(userId).collection("files").doc();
            batch.set(docRef, {
              name: filename,
              course,
              mime: part.mimeType,
              emailId: message.id,
              attachmentId: part.body.attachmentId,
              subject,
              from,
              size: part.body.size || 0,
              createdAt: FieldValue.serverTimestamp(),
            });
            documentsFound++;
            batchCount++;
          }
        }

        synced++;

        // Log progress every 10 emails
        if (synced % 10 === 0) {
          console.log(`Progress: ${synced}/${messages.length} emails processed`);
        }

        // Firebase Admin SDK allows max 500 operations per batch
        // Commit and create new batch every 400 operations to be safe
        if (batchCount >= 400) {
          await batch.commit();
          console.log(`Committed batch at ${synced} emails (${batchCount} operations)`);
          batch = db.batch();
          batchCount = 0;
        }

      } catch (msgError) {
        console.error(`Error processing message ${message.id}:`, msgError);
      }
    }

    // Commit remaining items
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch (${batchCount} operations)`);
    }

    // Update sync status
    await db.collection("sync_status").doc(userId).set({
      lastSync: FieldValue.serverTimestamp(),
      emailsSynced: synced,
      deadlinesFound: deadlinesFound,
      alertsFound: alertsFound,
      documentsFound: documentsFound,
    });

    console.log(`
╔════════════════════════════════════════════════════════╗
║              SYNC COMPLETE!                            ║
╠════════════════════════════════════════════════════════╣
║ Emails processed:    ${synced.toString().padStart(4)} emails                     ║
║ Embeddings created:  ${emailEmbeddings.length.toString().padStart(4)} embeddings               ║
║ Deadlines found:     ${deadlinesFound.toString().padStart(4)} deadlines                  ║
║ Alerts found:        ${alertsFound.toString().padStart(4)} alerts                     ║
║ Documents found:     ${documentsFound.toString().padStart(4)} documents                  ║
║                                                        ║
║ NOMIC EMBEDDINGS:                                      ║
║ NO AI CALLS USED! Pure embeddings + pattern matching  ║
║ Ready for RAG-based semantic search in chat           ║
╚════════════════════════════════════════════════════════╝
    `);

    return NextResponse.json({
      success: true,
      synced: synced,
      deadlines: deadlinesFound,
      alerts: alertsFound,
      documents: documentsFound,
    });

  } catch (error: any) {
    console.error("Email sync error:", error);
    return NextResponse.json(
      { error: error.message || "Sync failed" },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("user-id");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const db = getAdminDb();
    const statusDoc = await db.collection("sync_status").doc(userId).get();

    if (!statusDoc.exists) {
      return NextResponse.json({ synced: false });
    }

    return NextResponse.json({
      synced: true,
      ...statusDoc.data()
    });

  } catch (error: any) {
    console.error("Error checking sync status:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
