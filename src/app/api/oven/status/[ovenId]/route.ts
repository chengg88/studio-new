// src/app/api/oven/status/[ovenId]/route.ts
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function GET(
  request: Request,
  { params }: { params: { ovenId: string } }
) {
  if (!redis) {
    return NextResponse.json({ error: 'Redis client not available' }, { status: 500 });
  }
  const ovenId = params.ovenId; // 'oven1' or 'oven2'

  if (ovenId !== 'oven1' && ovenId !== 'oven2') {
    return NextResponse.json({ error: 'Invalid ovenId' }, { status: 400 });
  }

  // Redis keys are OVEN:Oven1 and OVEN:Oven2
  const redisKey = `OVEN:${ovenId.charAt(0).toUpperCase() + ovenId.slice(1)}`;

  try {
    const statusString = await redis.get(redisKey);
    if (!statusString) {
      return NextResponse.json({ error: `Status for ${redisKey} not found in Redis` }, { status: 404 });
    }
    const status = JSON.parse(statusString);
    // Adapt this to match OvenSettings structure expected by dashboard's updateOvenData
    const responseData = {
      state: status.state || 'Idle',
      name: status.name || (ovenId === 'oven1' ? 'Oven 1' : 'Oven 2'), // Fallback name
      activeProgram: status.program || 'None',
      // MESState, user, password, BatchID, spec, lot, updateTime, TrackInTime, spec_curStep, spec_stepStartTime
      // are not directly used by the dashboard's current OvenSettings structure for immediate display,
      // but you could include them if needed for other purposes or future enhancements.
      // For now, we only map what's needed for the dashboard display.
      // Humidity is not in the Redis status example, if it is, map it here.
      humidity: status.humidity !== undefined ? status.humidity : null, // Example if humidity was in Redis
    };
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Error fetching ${redisKey} from Redis:`, error);
    return NextResponse.json({ error: `Failed to fetch status for ${ovenId}` }, { status: 500 });
  }
}
