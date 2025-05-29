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

  const ovenId = params.ovenId; // 'oven1' or 'oven2'
  const tableName = ovenId === 'oven1' ? 'oven1_history' : ovenId === 'oven2' ? 'oven2_history' : null;

  if (!tableName) {
    return NextResponse.json({ error: 'Invalid ovenId' }, { status: 400 });
  }

  try {
    // Fetch the latest record to get current limits
    const row = await db.get(
      `SELECT low, high FROM ${tableName} 
       ORDER BY timestamp DESC 
       LIMIT 1`
    );
    
    if (!row || row.low === null || row.high === null) {
      return NextResponse.json({ error: `No valid limit data found for ${ovenId}` }, { status: 404 });
    }
    
    return NextResponse.json({
      lowerLimitCelsius: row.low,
      upperLimitCelsius: row.high,
    });

  } catch (error) {
    console.error(`Error fetching limits for ${tableName} from SQLite:`, error);
    return NextResponse.json({ error: `Failed to fetch limits for ${ovenId}` }, { status: 500 });
  }
}
