// src/app/api/oven/config/route.ts
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import type { OvenSettings as StoreOvenSettings, OvenTypeOption, SelectOnOff, AutoTrackoutOption, A1019PinValue, GeneralSettingsData } from '@/store/oven-store';

interface RedisOvenDetail {
  name: string;
  program: string;
  offset: number[];
}

interface RedisFeatures {
  DoorDet?: boolean;
  AutoTrackOut?: boolean;
  BakeStepTrackIn?: boolean; // Not used in current UI settings
  BakeStepSpecialCheck?: boolean; // Not used in current UI settings
  Bind_MaterialBox?: boolean;
  BuzzerNetworkDet?: boolean;
  cz_a5_rule?: boolean; // Added for compatibility
  tj_keepstep_trackin?: boolean; // Added for compatibility
}

interface RedisConfig {
  Oven?: {
    '1'?: RedisOvenDetail;
    '2'?: RedisOvenDetail;
  };
  OvenType?: number; // 1, 2, 3, 4
  OvenNumber?: number;
  Thermometer?: number;
  Features?: RedisFeatures;
  A1019_PIN?: number[]; // Array of 1s and 2s
  ignore_time?: number; // Added for compatibility
  // MESServerIP is not in the provided Redis structure for OVEN:config
}

// Frontend expects specific string values for some settings
interface FrontendReadyConfig extends GeneralSettingsData {
  ovenType: OvenTypeOption;
  ovens: {
    oven1: Pick<StoreOvenSettings, 'name' | 'offsets'>;
    oven2: Pick<StoreOvenSettings, 'name' | 'offsets'>;
  };
}

export async function GET() {
  if (!redis) {
    return NextResponse.json({ error: 'Redis client not available' }, { status: 500 });
  }
  try {
    const configString = await redis.get('OVEN:config');
    if (!configString) {
      // Provide a default structure if OVEN:config is not found
      console.warn('OVEN:config not found in Redis, returning default configuration.');
      const defaultConfig: FrontendReadyConfig = {
        ovenType: '3',
        mesServerIp: '127.0.0.1', // Default read-only value
        doorDetect: '0',
        autoTrackOut: '0',
        bindMaterialBox: '0',
        buzzerNetworkDetect: '0',
        czA5Rule: '0',
        ignoreTime: 20,
        tjKeepingTrackin: '0',
        a1019Pins: Array(8).fill('1') as A1019PinValue[],
        ovens: {
          oven1: { name: 'Oven 1', offsets: [0, 0, 0, 0] },
          oven2: { name: 'Oven 2', offsets: [0, 0, 0, 0] },
        },
      };
      return NextResponse.json(defaultConfig);
    }
    const redisConfig: RedisConfig = JSON.parse(configString);

    const features = redisConfig.Features || {};
    const responseData: FrontendReadyConfig = {
      ovenType: String(redisConfig.OvenType || '3') as OvenTypeOption, // Default to '3' (1 single door oven)
      mesServerIp: '127.0.0.1', // This is read-only and not in OVEN:config, provide default
      doorDetect: features.DoorDet ? '1' : '0',
      autoTrackOut: features.AutoTrackOut !== undefined ? (features.AutoTrackOut ? '1' : '0') : '0', // Example, adjust if AutoTrackOut can be '2'
      bindMaterialBox: features.Bind_MaterialBox ? '1' : '0',
      buzzerNetworkDetect: features.BuzzerNetworkDet ? '1' : '0',
      czA5Rule: features.cz_a5_rule ? '1' : '0', // Default to '0' if not in features
      ignoreTime: redisConfig.ignore_time !== undefined ? redisConfig.ignore_time : 20, // Default if not present
      tjKeepingTrackin: features.tj_keepstep_trackin ? '1' : '0', // Default to '0' if not in features
      a1019Pins: (redisConfig.A1019_PIN || Array(8).fill(1)).map(String) as A1019PinValue[],
      ovens: {
        oven1: {
          name: redisConfig.Oven?.['1']?.name || 'Oven 1',
          offsets: redisConfig.Oven?.['1']?.offset || [0, 0, 0, 0],
        },
        oven2: {
          name: redisConfig.Oven?.['2']?.name || 'Oven 2',
          offsets: redisConfig.Oven?.['2']?.offset || [0, 0, 0, 0],
        },
      },
    };
     // Adjust AutoTrackOut if it can be '0', '1', '2'
     if (typeof features.AutoTrackOut === 'number') {
        responseData.autoTrackOut = String(features.AutoTrackOut) as AutoTrackoutOption;
     } else if (typeof features.AutoTrackOut === 'boolean') {
        responseData.autoTrackOut = features.AutoTrackOut ? '1' : '0';
     }


    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching OVEN:config from Redis:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!redis) {
    return NextResponse.json({ error: 'Redis client not available' }, { status: 500 });
  }
  try {
    const newSettings: FrontendReadyConfig = await request.json();

    // Transform frontend data to the Redis structure
    const redisConfigToSave: RedisConfig = {
      Oven: {
        '1': {
          name: newSettings.ovens.oven1.name,
          program: '', // Program is part of status, not static config here
          offset: newSettings.ovens.oven1.offsets.map(Number),
        },
      },
      OvenType: Number(newSettings.ovenType) as 1 | 2 | 3 | 4,
      OvenNumber: (newSettings.ovenType === '1' || newSettings.ovenType === '2') ? 2 : 1, // Determine based on OvenType
      Thermometer: 0, // Assuming default or fetch if available
      Features: {
        DoorDet: newSettings.doorDetect === '1',
        AutoTrackOut: newSettings.autoTrackOut !== '0' ? (newSettings.autoTrackOut === '2' ? 2 : true) : false, // Handle '0', '1', '2' for AutoTrackOut
        Bind_MaterialBox: newSettings.bindMaterialBox === '1',
        BuzzerNetworkDet: newSettings.buzzerNetworkDetect === '1',
        cz_a5_rule: newSettings.czA5Rule === '1',
        tj_keepstep_trackin: newSettings.tjKeepingTrackin === '1',
        // BakeStepTrackIn and BakeStepSpecialCheck are not in the UI, default to false or omit
      },
      A1019_PIN: newSettings.a1019Pins.map(Number),
      ignore_time: Number(newSettings.ignoreTime),
    };

    if (redisConfigToSave.OvenType === 1 || redisConfigToSave.OvenType === 2) {
      if (redisConfigToSave.Oven) { // Ensure Oven is initialized
        redisConfigToSave.Oven['2'] = {
          name: newSettings.ovens.oven2.name,
          program: '',
          offset: newSettings.ovens.oven2.offsets.map(Number),
        };
      }
    } else {
      if (redisConfigToSave.Oven) delete redisConfigToSave.Oven['2'];
    }

    // Specific handling for AutoTrackOut: Redis expects boolean or number (0,1,2)
    // The form sends '0', '1', '2'.
    if (newSettings.autoTrackOut === '0') {
        redisConfigToSave.Features!.AutoTrackOut = false; // Or 0, depending on exact backend expectation for "disable"
    } else if (newSettings.autoTrackOut === '1') {
        redisConfigToSave.Features!.AutoTrackOut = true; // Or 1
    } else if (newSettings.autoTrackOut === '2') {
        redisConfigToSave.Features!.AutoTrackOut = 2; // Number 2
    }


    await redis.set('OVEN:new_config', JSON.stringify(redisConfigToSave));

    return NextResponse.json({ message: 'Configuration saved successfully to OVEN:new_config' });
  } catch (error) {
    console.error('Error saving configuration to Redis:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
