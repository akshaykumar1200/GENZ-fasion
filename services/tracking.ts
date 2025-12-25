
import { TrackingLog, UserProfile } from '../types';

/**
 * GOOGLE SHEETS INTEGRATION INSTRUCTIONS:
 * 1. Create a Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste the following code:
 * 
 * function doPost(e) {
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *   var data = JSON.parse(e.postData.contents);
 *   sheet.appendRow([
 *     data.timestamp,
 *     data.userId,
 *     data.userEmail,
 *     data.userName || 'N/A',
 *     data.action,
 *     data.details,
 *     JSON.stringify(data.metadata)
 *   ]);
 *   return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
 * }
 * 
 * 4. Click 'Deploy' > 'New Deployment' > Select 'Web App'.
 * 5. Set 'Execute as' to 'Me' and 'Who has access' to 'Anyone'.
 * 6. Copy the Web App URL and paste it into the constant below.
 */

const GOOGLE_SCRIPT_URL = ''; // Paste your Google Apps Script Web App URL here
const SPREADSHEET_SIM_KEY = 'vibecheck_db_simulation';

export const TrackingService = {
  logAction: async (action: TrackingLog['action'] | 'SESSION_START' | 'SESSION_END', user: UserProfile, details: string = '') => {
    const entry = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action,
      details,
      metadata: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        bodyType: user.bodyType,
        styleVibe: user.styleVibe
      }
    };

    // 1. Always update local simulation for the "Daily Tracker" view
    const currentDb = JSON.parse(localStorage.getItem(SPREADSHEET_SIM_KEY) || '[]');
    currentDb.push(entry);
    localStorage.setItem(SPREADSHEET_SIM_KEY, JSON.stringify(currentDb));

    // 2. Real Google Sheets Integration
    if (GOOGLE_SCRIPT_URL) {
      try {
        if (action === 'SESSION_END') {
          // Use sendBeacon for exit events to ensure they complete
          navigator.sendBeacon(GOOGLE_SCRIPT_URL, JSON.stringify(entry));
        } else {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors or specialized handling
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
          });
        }
      } catch (error) {
        console.error('Failed to sync with Google Sheets:', error);
      }
    }

    console.log(`[DATA SYNC]: ${action} for ${user.email}`);
  },

  getDailyStats: () => {
    return JSON.parse(localStorage.getItem(SPREADSHEET_SIM_KEY) || '[]');
  }
};
