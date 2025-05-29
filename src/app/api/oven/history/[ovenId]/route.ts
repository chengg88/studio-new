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

  const ovenId = params.ovenId; // 'oven1' or 'oven2'
  const tableName = ovenId === 'oven1' ? 'oven1_history' : ovenId === 'oven2' ? 'oven2_history' : null;

  if (!tableName) {
    return NextResponse.json({ error: 'Invalid ovenId' }, { status: 400 });
  }

  try {
    // Fetch recent data, e.g., last 1000 points, ordered by timestamp
    // The query attempts to create a sortable datetime string for ordering.
    // If `timestamp` is already a UNIX epoch or full ISO, this can be simplified.
    const rows = await db.all(
      `SELECT timestamp, time, t1, t2, t3, t4 FROM ${tableName} 
       ORDER BY STRFTIME('%s', time) DESC 
       LIMIT 1000`
    );
    
    const historicalData = rows.map(row => {
      let formattedTimestamp = "Invalid Timestamp";
    
      if (row.timestamp && row.time) {
        const parsedDate = Date.parse(row.time);
        formattedTimestamp = !isNaN(parsedDate) ? new Date(parsedDate).toISOString() : "Invalid Timestamp";
      }
    
      return {
        timestamp: formattedTimestamp,
        temperature: row.t1,
      };
    }).reverse();
    
    return NextResponse.json(historicalData);

  } catch (error) {
    console.error(`Error fetching history for ${tableName} from SQLite:`, error);
    return NextResponse.json({ error: `Failed to fetch history for ${ovenId}` }, { status: 500 });
  }
}
