// src/app/api/oven/status/[ovenId]/route.ts
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import type { OvenState } from '@/store/oven-store';

interface RedisOvenStatus {
  state: OvenState;
  name: string;
  program: string;
  MESState: string; // "Idle", "Run", etc.
  // Optional fields only present when not IDLE for Oven2 example
  user?: string;
  password?: string;
  BatchID?: string;
  spec?: any[]; // Define more specific type if needed
  lot?: string[];
  updateTime?: number;
  TrackInTime?: number;
  spec_curStep?: number;
  spec_stepStartTime?: number;
  // Humidity is not in the provided Redis status
}

export async function GET(
  request: Request,
  { params }: { params: { ovenId: string } }
) {
  if (!redis) {
    return NextResponse.json({ error: 'Redis client not available' }, { status: 500 });
  }
  const ovenIdParam = params.ovenId; // 'oven1' or 'oven2'

  if (ovenIdParam !== 'oven1' && ovenIdParam !== 'oven2') {
    return NextResponse.json({ error: 'Invalid ovenId' }, { status: 400 });
  }

  // Redis keys are OVEN:Oven1 and OVEN:Oven2
  const redisKey = `OVEN:${ovenIdParam.charAt(0).toUpperCase() + ovenIdParam.slice(1)}`;

  try {
    const statusString = await redis.get(redisKey);
    if (!statusString) {
      // Return a default idle state if key not found, as per user spec
      const defaultStatus = {
        state: 'IDLE' as OvenState,
        name: ovenIdParam === 'oven1' ? 'Oven 1 (Default)' : 'Oven 2 (Default)',
        activeProgram: 'None',
        humidity: null, // Humidity not available
        // other fields can be omitted or set to defaults for IDLE state
      };
      return NextResponse.json(defaultStatus);
    }

    const status: RedisOvenStatus = JSON.parse(statusString);

    const responseData = {
      state: status.state || 'IDLE',
      name: status.name || (ovenIdParam === 'oven1' ? 'Oven 1' : 'Oven 2'), // Fallback name
      activeProgram: status.program || 'None',
      humidity: null, // Humidity is not provided in the Redis status structure
      // Temperature is sourced from the history API
      // Other fields from RedisOvenStatus can be added here if needed by frontend
    };
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Error fetching ${redisKey} from Redis:`, error);
    return NextResponse.json({ error: `Failed to fetch status for ${ovenIdParam}` }, { status: 500 });
  }
}
