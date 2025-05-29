// src/app/api/oven/limits/[ovenId]/route.ts
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
    // Fetch the latest record to get current limits
    const row = await db.get(
      `SELECT low, high FROM ${tableName} 
       ORDER BY timestamp DESC, time DESC
       LIMIT 1`
    );
    
    if (!row || row.low === null || row.high === null) {
      console.warn(`[API Limits] No valid limit data found for ${ovenIdParam} in ${tableName}. Returning defaults.`);
      // Return default/fallback limits if no valid data is found
      return NextResponse.json({ lowerLimitCelsius: 50, upperLimitCelsius: 250 });
    }
    
    return NextResponse.json({
      lowerLimitCelsius: row.low,
      upperLimitCelsius: row.high,
    });

  } catch (error) {
    console.error(`Error fetching limits for ${tableName} from SQLite:`, error);
    // Return default/fallback limits on error
    return NextResponse.json({ lowerLimitCelsius: 50, upperLimitCelsius: 250 }, { status: 500 });
  }
}
