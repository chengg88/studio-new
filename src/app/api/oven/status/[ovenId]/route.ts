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
    return NextResponse.json({ error: 'Redis client is unavailable' }, { status: 500 });
  }

  const ovenIdParam = params.ovenId.toLowerCase(); // 確保大小寫統一

  if (!['oven1', 'oven2'].includes(ovenIdParam)) {
    return NextResponse.json({ error: 'Invalid ovenId, must be "oven1" or "oven2"' }, { status: 400 });
  }

  const redisKey = `OVEN:${ovenIdParam.charAt(0).toUpperCase() + ovenIdParam.slice(1)}`;

  try {
    const statusString = await redis.get(redisKey);

    if (!statusString) {
      console.warn(`Redis key ${redisKey} not found, returning default idle state.`);
      return NextResponse.json({
        state: 'IDLE' as OvenState,
        name: ovenIdParam === 'oven1' ? 'Oven 1 (Default)' : 'Oven 2 (Default)',
        activeProgram: 'None',
        humidity: null,
      });
    }

    const status: RedisOvenStatus = JSON.parse(statusString);

    return NextResponse.json({
      state: status.state || 'IDLE',
      name: status.name || (ovenIdParam === 'oven1' ? 'Oven 1' : 'Oven 2'),
      activeProgram: status.program || 'None',
      humidity: null, // Redis 內無該數據，保持為 `null`
    });

  } catch (error) {
    console.error(`Error fetching ${redisKey} from Redis:`, error);
    return NextResponse.json({ error: `Failed to fetch status for ${ovenIdParam}: ${error.message}` }, { status: 500 });
  }
}
