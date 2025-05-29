import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import type { OvenState } from '@/store/oven-store';

interface RedisOvenStatus {
  state: OvenState;
  name: string;
  program: string;
  MESState: string; // "Idle", "Run", etc.
  user?: string;
  password?: string;
  BatchID?: string;
  spec?: any[];
  lot?: string[];
  updateTime?: number;
  TrackInTime?: number;
  spec_curStep?: number;
  spec_stepStartTime?: number;
}

export async function GET(
  request: Request,
  { params }: { params: { ovenId: string } }
) {
  if (!redis) {
    console.error('Redis client is not available.');
    return NextResponse.json(
      { error: 'Redis client is unavailable' },
      { status: 500 }
    );
  }

  // 統一轉小寫以避免大小寫問題
  const ovenIdParam = params.ovenId.toLowerCase();

  if (!['oven1', 'oven2'].includes(ovenIdParam)) {
    return NextResponse.json(
      { error: 'Invalid ovenId, must be "oven1" or "oven2"' },
      { status: 400 }
    );
  }

  // 組合 Redis key，例如 "OVEN:Oven1" 或 "OVEN:Oven2"
  const redisKey =
    `OVEN:${ovenIdParam.charAt(0).toUpperCase() + ovenIdParam.slice(1)}`;

  try {
    const statusString = await redis.get(redisKey);
    console.log(`Retrieved statusString for ${redisKey}:`, statusString);

    if (!statusString) {
      console.warn(
        `Redis key ${redisKey} not found, returning default idle state.`
      );
      return NextResponse.json(
        {
          state: 'IDLE' as OvenState,
          name: ovenIdParam === 'oven1' ? 'Oven 1 (Default)' : 'Oven 2 (Default)',
          activeProgram: 'None',
          humidity: null,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const status: RedisOvenStatus = JSON.parse(statusString);

    return NextResponse.json(
      {
        state: status.state || 'IDLE',
        name: status.name || (ovenIdParam === 'oven1' ? 'Oven 1' : 'Oven 2'),
        activeProgram: status.program || 'None',
        humidity: null,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error(`Error fetching ${redisKey} from Redis:`, error);
    return NextResponse.json(
      { error: `Failed to fetch status for ${ovenIdParam}: ${error.message}` },
      { status: 500 }
    );
  }
}
