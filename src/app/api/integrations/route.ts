import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Local log file to simulate Google Sheets
const LOG_FILE = path.join(process.cwd(), 'google_sheets_log.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, payload, sheetUrl } = body;

    console.log(`[Integration API] Triggered ${type} integration`);

    if (type === 'google_sheets') {
      // Simulate Google Sheets Append
      let currentLogs: any[] = [];
      
      try {
        if (fs.existsSync(LOG_FILE)) {
          const content = fs.readFileSync(LOG_FILE, 'utf8');
          currentLogs = JSON.parse(content || '[]');
        }
      } catch (e) {
        console.warn('Could not read google_sheets_log.json:', e);
      }

      currentLogs.push({
        appended_at: new Date().toISOString(),
        sheet_url: sheetUrl || 'https://docs.google.com/spreadsheets/d/default/edit',
        row_data: payload
      });

      try {
        fs.writeFileSync(LOG_FILE, JSON.stringify(currentLogs, null, 2), 'utf8');
        console.log(`[Integration API] Appended row to mock Google Sheets log file: ${LOG_FILE}`);
      } catch (e) {
        console.error('Could not write google_sheets_log.json:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${type} integration executed successfully.`,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Integration API] Error handling integration:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
