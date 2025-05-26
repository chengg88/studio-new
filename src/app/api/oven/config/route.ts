// src/app/api/oven/config/route.ts
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function GET() {
  if (!redis) {
    return NextResponse.json({ error: 'Redis client not available' }, { status: 500 });
  }
  try {
    const configString = await redis.get('OVEN:config');
    if (!configString) {
      return NextResponse.json({ error: 'OVEN:config not found in Redis' }, { status: 404 });
    }
    const config = JSON.parse(configString);

    // Transform features to match frontend expectations (boolean to '0'/'1' or specific values)
    const features = config.Features || {};
    const transformedFeatures = {
      DoorDet: features.DoorDet ? '1' : '0',
      AutoTrackOut: features.AutoTrackOut !== undefined ? String(features.AutoTrackOut) : '0', // Keep as string '0', '1', '2'
      Bind_MaterialBox: features.Bind_MaterialBox ? '1' : '0',
      BuzzerNetworkDet: features.BuzzerNetworkDet ? '1' : '0',
      cz_a5_rule: features.cz_a5_rule ? '1' : '0', // Assuming these might be in Features
      tj_keepstep_trackin: features.tj_keepstep_trackin ? '1' : '0',
    };

    const responseData = {
      Oven: config.Oven,
      OvenType: String(config.OvenType || '3'), // Default to '3' if not present
      OvenNumber: config.OvenNumber || 1,
      Thermometer: config.Thermometer || 0,
      Features: transformedFeatures,
      A1019_PIN: (config.A1019_PIN || Array(8).fill(1)).map(String), // Ensure array of strings
      // Add other top-level config like ignore_time if it exists
      ignore_time: config.ignore_time !== undefined ? config.ignore_time : 20, // default 20
      // mesServerIp is typically read-only and part of a device's fixed config, not in dynamic OVEN:config
      // If it IS in OVEN:config, it would be: mesServerIp: config.MESServerIP || '127.0.0.1'
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching OVEN:config from Redis:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}
