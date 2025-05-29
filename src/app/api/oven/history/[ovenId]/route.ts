// src/app/api/oven/history/[ovenId]/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { ovenId: string } }
) {
  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: 'SQLite client not available' }, { status: 500 });
  }

  const ovenIdParam = params.ovenId.toLowerCase(); // 'oven1' or 'oven2'
  const tableName = ovenIdParam === 'oven1' ? 'oven1_history' : ovenIdParam === 'oven2' ? 'oven2_history' : null;

  if (!tableName) {
    return NextResponse.json({ error: 'Invalid ovenId' }, { status: 400 });
  }

  try {
    // Fetch recent data, e.g., last 1000 points, ordered by timestamp and time.
    // Assumes 'timestamp' is a date string (YYYY-MM-DD) and 'time' is a time string (HH:MM:SS).
    const rows = await db.all(
      `SELECT timestamp, time, t1, t2, t3, t4 FROM ${tableName} 
       ORDER BY timestamp DESC, time DESC
       LIMIT 1000`
    );
    
    const historicalData = rows.map(row => {
      let formattedTimestamp = "Invalid Timestamp";
    
      // Combine date and time to form a full ISO 8601 timestamp string
      // Assuming timestamps are recorded in UTC or should be treated as such.
      // If they are local time, this might need timezone handling.
      if (row.timestamp && row.time) {
        try {
          // Attempt to parse, assuming row.timestamp is YYYY-MM-DD and row.time is HH:MM:SS
          const combinedDateTimeString = `${row.timestamp}T${row.time}Z`; // Append 'Z' for UTC
          const parsedDate = new Date(combinedDateTimeString);
          if (!isNaN(parsedDate.getTime())) {
            formattedTimestamp = parsedDate.toISOString();
          } else {
            console.warn(`[API History] Could not parse combined datetime: ${combinedDateTimeString} for ${tableName}`);
          }
        } catch (e) {
            console.error(`[API History] Error parsing date for ${tableName}: `, e);
        }
      } else {
        console.warn(`[API History] Missing timestamp or time for a record in ${tableName}`);
      }
    
      return {
        timestamp: formattedTimestamp,
        temperature: row.t1, // Using t1 as the representative temperature
        // t2: row.t2, // Include if you plan to use them
        // t3: row.t3,
        // t4: row.t4,
      };
    }).filter(item => item.timestamp !== "Invalid Timestamp").reverse(); // Reverse to have oldest first for chart
    
    return NextResponse.json(historicalData);

  } catch (error) {
    console.error(`Error fetching history for ${tableName} from SQLite:`, error);
    return NextResponse.json({ error: `Failed to fetch history for ${ovenIdParam}` }, { status: 500 });
  }
}
