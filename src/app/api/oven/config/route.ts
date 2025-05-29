
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import type { OvenSettings as StoreOvenSettings, OvenTypeOption, SelectOnOff, AutoTrackoutOption, A1019PinValue, GeneralSettingsData } from '@/store/oven-store';

// This interface represents the structure of the "Oven" object within OVEN:config
interface RedisOvenDetail {
  name: string;
  program: string;
  offset: number[];
}

// This interface represents the structure of the "Features" object within OVEN:config
interface RedisFeatures {
  DoorDet?: boolean;
  AutoTrackOut?: boolean | number; // Can be boolean or 0, 1, 2
  BakeStepTrackIn?: boolean;
  BakeStepSpecialCheck?: boolean;
  Bind_MaterialBox?: boolean;
  BuzzerNetworkDet?: boolean;
  cz_a5_rule?: boolean;       // Added from old settings
  tj_keepstep_trackin?: boolean; // Added from old settings
}

// This interface represents the overall structure of the OVEN:config JSON object
interface RedisConfig {
  Oven?: {
    '1'?: RedisOvenDetail;
    '2'?: RedisOvenDetail;
  };
  OvenType?: 1 | 2 | 3 | 4; // 1: double, 2: 2 single, 3: 1 single, 4: ENOHK
  OvenNumber?: number;
  Thermometer?: number;
  Features?: RedisFeatures;
  A1019_PIN?: (1 | 2)[]; // Array of 1s or 2s
  ignore_time?: number; // Added from old settings
}

// This is the structure the frontend settings page expects (matches SettingsFormData in settings.tsx)
interface FrontendReadyConfig extends GeneralSettingsData {
  ovenType: OvenTypeOption;
  configExists: boolean; // To indicate if config was found or defaults are used
  ovens: {
    oven1: Pick<StoreOvenSettings, 'name' | 'offsets'>;
    oven2: Pick<StoreOvenSettings, 'name' | 'offsets'>;
  };
}

const initialGeneralSettingsDefaults: Omit<GeneralSettingsData, 'mesServerIp'> = {
  doorDetect: '0',
  autoTrackOut: '0',
  bindMaterialBox: '0',
  buzzerNetworkDetect: '0',
  czA5Rule: '0',
  ignoreTime: 20,
  tjKeepingTrackin: '0',
  a1019Pins: Array(8).fill('1') as A1019PinValue[],
};


export async function GET() {
  console.log('[API /api/oven/config GET] Attempting to connect to Redis. REDIS_URL:', process.env.REDIS_URL);
  if (!redis) {
    console.error('[API /api/oven/config GET] Redis client is not available. REDIS_URL:', process.env.REDIS_URL);
    return NextResponse.json({ error: 'Redis client not available' }, { status: 500 });
  }
  console.log('[API /api/oven/config GET] Redis client status:', redis.status);


  try {
    const configString = await redis.get('OVEN:config');
    console.log('[API /api/oven/config GET] Retrieved OVEN:config from Redis:', configString);
    const configExists = !!configString;

    if (!configExists) {
        console.warn('[API /api/oven/config GET] OVEN:config not found in Redis, returning default configuration.');
    }

    const redisConfig: RedisConfig = configExists ? JSON.parse(configString!) : {};
    const features = redisConfig.Features || {};

    // Convert AutoTrackOut: true -> '1', false -> '0', number -> string
    let autoTrackOutValue: AutoTrackoutOption = '0'; // Default to '0'
    if (typeof features.AutoTrackOut === 'boolean') {
        autoTrackOutValue = features.AutoTrackOut ? '1' : '0';
    } else if (typeof features.AutoTrackOut === 'number') {
        autoTrackOutValue = String(features.AutoTrackOut) as AutoTrackoutOption;
    }


    const responseData: FrontendReadyConfig = {
      configExists,
      ovenType: String(redisConfig.OvenType || '3') as OvenTypeOption, // Default to '3' (1 single door oven) if not set
      // MES Server IP is typically static or from another source, not in this Redis config
      mesServerIp: '127.0.0.1', // Placeholder or fetch from elsewhere if needed
      doorDetect: features.DoorDet ? '1' : '0',
      autoTrackOut: autoTrackOutValue,
      bindMaterialBox: features.Bind_MaterialBox ? '1' : '0',
      buzzerNetworkDetect: features.BuzzerNetworkDet ? '1' : '0',
      // czA5Rule and tjKeepingTrackin - map from Redis or use defaults
      czA5Rule: features.cz_a5_rule ? '1' : initialGeneralSettingsDefaults.czA5Rule,
      ignoreTime: redisConfig.ignore_time !== undefined ? redisConfig.ignore_time : initialGeneralSettingsDefaults.ignoreTime,
      tjKeepingTrackin: features.tj_keepstep_trackin ? '1' : initialGeneralSettingsDefaults.tjKeepingTrackin,
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
    console.log('[API /api/oven/config GET] Parsed responseData:', JSON.stringify(responseData, null, 2));
    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'no-store' }, // Ensure fresh data
    });
  } catch (error: any) {
    console.error('[API /api/oven/config GET] Error fetching/parsing OVEN:config from Redis:', error);
    // Return a default structure on error to prevent frontend from breaking
    const errorResponse: FrontendReadyConfig = {
        configExists: false,
        ovenType: '3',
        mesServerIp: '127.0.0.1',
        ...initialGeneralSettingsDefaults,
        ovens: {
            oven1: { name: 'Oven 1 (Error)', offsets: [0,0,0,0]},
            oven2: { name: 'Oven 2 (Error)', offsets: [0,0,0,0]},
        }
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}


export async function POST(request: Request) {
  console.log('[API /api/oven/config POST] Received request to save settings.');
  console.log('[API /api/oven/config POST] Attempting to connect to Redis. REDIS_URL:', process.env.REDIS_URL);
  if (!redis) {
    console.error('[API /api/oven/config POST] Redis client is not available. REDIS_URL:', process.env.REDIS_URL);
    return NextResponse.json({ error: 'Redis client not available' }, { status: 500 });
  }
  console.log('[API /api/oven/config POST] Redis client status:', redis.status);

  try {
    const newSettings: FrontendReadyConfig = await request.json();
    console.log('[API /api/oven/config POST] Received settings payload:', JSON.stringify(newSettings, null, 2));

    // Transform FrontendReadyConfig back to RedisConfig structure
    const ovenTypeNum = Number(newSettings.ovenType) as 1 | 2 | 3 | 4;
    let ovenNumber = 1;
    if (ovenTypeNum === 1 || ovenTypeNum === 2) { // 1: double door (counts as 2 for some backend logic), 2: 2 single
        ovenNumber = 2;
    }


    const redisConfigToSave: RedisConfig = {
      Oven: {
        '1': {
          name: newSettings.ovens.oven1.name,
          program: '', // Program is not part of settings form, keep empty or from existing if needed
          offset: newSettings.ovens.oven1.offsets.map(Number),
        },
      },
      OvenType: ovenTypeNum,
      OvenNumber: ovenNumber,
      Thermometer: 0, // Assuming this is static or managed elsewhere
      Features: {
        DoorDet: newSettings.doorDetect === '1',
        // AutoTrackOut: true for '1', false for '0', number for '2' (as per original logic)
        AutoTrackOut: newSettings.autoTrackOut === '0'
                        ? false
                        : newSettings.autoTrackOut === '1'
                            ? true
                            : Number(newSettings.autoTrackOut), // handles '2'
        Bind_MaterialBox: newSettings.bindMaterialBox === '1',
        BuzzerNetworkDet: newSettings.buzzerNetworkDetect === '1',
        cz_a5_rule: newSettings.czA5Rule === '1',
        tj_keepstep_trackin: newSettings.tjKeepingTrackin === '1',
        // BakeStepTrackIn and BakeStepSpecialCheck are not on the form, default to false or fetch existing
        BakeStepTrackIn: false,
        BakeStepSpecialCheck: false,
      },
      A1019_PIN: newSettings.a1019Pins.map(Number) as (1 | 2)[],
      ignore_time: Number(newSettings.ignoreTime),
    };

    if (ovenTypeNum === 1 || ovenTypeNum === 2) { // Double door or 2 singles
      redisConfigToSave.Oven!['2'] = {
        name: newSettings.ovens.oven2.name,
        program: '', // Program is not part of settings form
        offset: newSettings.ovens.oven2.offsets.map(Number),
      };
    } else {
      // If not dual mode, ensure Oven['2'] does not exist or is removed if it was there before
      if (redisConfigToSave.Oven) delete redisConfigToSave.Oven['2'];
    }
    console.log('[API /api/oven/config POST] Prepared Redis config to save:', JSON.stringify(redisConfigToSave, null, 2));

    await redis.set('OVEN:new_config', JSON.stringify(redisConfigToSave));
    console.log('[API /api/oven/config POST] Configuration saved to OVEN:new_config successfully.');

    return NextResponse.json({ message: 'Configuration saved successfully' });
  } catch (error: any) {
    console.error('[API /api/oven/config POST] Error saving configuration to Redis:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
