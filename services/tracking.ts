
import { TrackingLog, UserProfile } from '../types';

/**
 * DATA EXTRACTION ENGINE (Google Sheets Setup):
 * 1. Create a Google Sheet titled "DesiDrip_Analytics".
 * 2. Go to Extensions > Apps Script and paste the following:
 * 
 * function doPost(e) {
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *   var data = JSON.parse(e.postData.contents);
 *   // Define the extraction columns
 *   sheet.appendRow([
 *     data.timestamp,
 *     data.userId,
 *     data.userEmail,
 *     data.userName,
 *     data.action,
 *     data.details,
 *     data.metadata.platform,
 *     data.metadata.userAgent,
 *     data.metadata.screenResolution,
 *     data.metadata.bodyType,
 *     data.metadata.styleVibe,
 *     data.metadata.connectionType || 'Unknown',
 *     data.metadata.isPWA ? 'App' : 'Web'
 *   ]);
 *   return ContentService.createTextOutput("Extracted").setMimeType(ContentService.MimeType.TEXT);
 * }
 */

const GOOGLE_SCRIPT_URL = ''; // ONCE PUBLISHED: Paste your Apps Script URL here
const SPREADSHEET_SIM_KEY = 'desidrip_extraction_v1';

export const TrackingService = {
  logAction: async (action: TrackingLog['action'] | 'SESSION_START' | 'SESSION_END', user: UserProfile, details: string = '') => {
    // Comprehensive Data Extraction Object
    const entry = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action,
      details,
      metadata: {
        platform: (navigator as any).platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        bodyType: user.bodyType,
        styleVibe: user.styleVibe,
        isPWA: window.matchMedia('(display-mode: standalone)').matches,
        // @ts-ignore - experimental API
        connectionType: navigator.connection?.effectiveType || 'unknown'
      }
    };

    // LOCAL PERSISTENCE (Extraction Fallback)
    const currentDb = JSON.parse(localStorage.getItem(SPREADSHEET_SIM_KEY) || '[]');
    currentDb.push(entry);
    localStorage.setItem(SPREADSHEET_SIM_KEY, JSON.stringify(currentDb));

    // EXTERNAL EXTRACTION (Production)
    if (GOOGLE_SCRIPT_URL) {
      try {
        if (action === 'SESSION_END' || action === 'LOGOUT') {
          // sendBeacon is vital for capturing exit data
          navigator.sendBeacon(GOOGLE_SCRIPT_URL, JSON.stringify(entry));
        } else {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
          });
        }
      } catch (error) {
        console.warn('[EXTRACTION ERROR]: Failed to sync event', error);
      }
    }

    console.debug(`[EXTRACTED]: ${action} event logged for analytics.`);
  },

  // Helper to allow manual download of data as JSON
  exportData: () => {
    const data = localStorage.getItem(SPREADSHEET_SIM_KEY);
    const blob = new Blob([data || '[]'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desidrip_data_${new Date().toISOString()}.json`;
    a.click();
  }
};
