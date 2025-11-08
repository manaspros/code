/**
 * Composio Action Names Reference
 *
 * This file contains the correct action names for Composio integrations.
 * Use these constants instead of hardcoding action names to avoid typos.
 *
 * IMPORTANT: Composio expects lowercase action names with underscores
 * Example: gmail_send_email, google_classroom_list_courses
 */

// ==================== GMAIL ACTIONS ====================
export const GMAIL_ACTIONS = {
  LIST_EMAILS: "gmail_list_emails",
  GET_EMAIL: "gmail_get_email",
  SEND_EMAIL: "gmail_send_email",
  GET_PROFILE: "gmail_get_profile",
  CREATE_DRAFT: "gmail_create_draft",
  SEARCH_EMAILS: "gmail_search_emails",
} as const;

// ==================== GOOGLE CLASSROOM ACTIONS ====================
export const CLASSROOM_ACTIONS = {
  LIST_COURSES: "google_classroom_list_courses",
  GET_COURSE: "google_classroom_get_course",
  LIST_COURSEWORK: "google_classroom_list_course_work",
  GET_COURSEWORK: "google_classroom_get_course_work",
  LIST_STUDENTS: "google_classroom_list_students",
  LIST_SUBMISSIONS: "google_classroom_list_student_submissions",
} as const;

// ==================== GOOGLE CALENDAR ACTIONS ====================
export const CALENDAR_ACTIONS = {
  LIST_EVENTS: "googlecalendar_list_events",
  GET_EVENT: "googlecalendar_get_event",
  CREATE_EVENT: "googlecalendar_create_event",
  UPDATE_EVENT: "googlecalendar_update_event",
  DELETE_EVENT: "googlecalendar_delete_event",
  LIST_CALENDARS: "googlecalendar_list_calendars",
} as const;

// ==================== GOOGLE DRIVE ACTIONS ====================
export const DRIVE_ACTIONS = {
  LIST_FILES: "googledrive_list_files",
  GET_FILE: "googledrive_get_file",
  SEARCH_FILES: "googledrive_search_files",
  DOWNLOAD_FILE: "googledrive_download_file",
  CREATE_FILE: "googledrive_create_file",
  UPDATE_FILE: "googledrive_update_file",
  DELETE_FILE: "googledrive_delete_file",
} as const;

// ==================== APP NAMES ====================
// Use these when connecting integrations
export const APP_NAMES = {
  GMAIL: "gmail",
  GOOGLE_CLASSROOM: "google_classroom", // Note: underscore, not googleclassroom
  GOOGLE_CALENDAR: "googlecalendar", // Note: no underscore
  GOOGLE_DRIVE: "googledrive", // Note: no underscore
  GOOGLE_SHEETS: "googlesheets",
  GOOGLE_MEET: "googlemeet",
  GOOGLE_DOCS: "googledocs",
  NOTION: "notion",
  WHATSAPP: "whatsapp",
  LINKEDIN: "linkedin",
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Execute a Composio action with proper error handling
 */
export async function executeComposioAction(
  entity: any,
  actionName: string,
  params: any = {}
) {
  try {
    console.log(`Executing Composio action: ${actionName}`, params);
    const result = await entity.execute(actionName, params);
    console.log(`Action ${actionName} completed successfully`);
    return result;
  } catch (error: any) {
    console.error(`Error executing ${actionName}:`, error.message);

    // Log more details for debugging
    if (error.response) {
      console.error("Response error:", error.response.data);
    }

    throw new Error(`Failed to execute ${actionName}: ${error.message}`);
  }
}

/**
 * Get all available actions for debugging
 */
export function getAllComposioActions() {
  return {
    gmail: Object.values(GMAIL_ACTIONS),
    classroom: Object.values(CLASSROOM_ACTIONS),
    calendar: Object.values(CALENDAR_ACTIONS),
    drive: Object.values(DRIVE_ACTIONS),
  };
}
