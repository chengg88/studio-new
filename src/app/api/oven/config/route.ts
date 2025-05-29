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
  AutoTrackOut?: boolean | number;
  BakeStepTrackIn?: boolean;
  BakeStepSpecialCheck?: boolean;
  Bind_MaterialBox?: boolean;
  BuzzerNetworkDet?: boolean;
  cz_a5_rule?: boolean;
  tj_keepstep_trackin?: boolean;
}

interface RedisConfig {
  Oven?: {
    '1'?: RedisOvenDetail;
    '2'?: RedisOvenDetail;
  };
  OvenType?: number;
  OvenNumber?: number;
  Thermometer?: number;
  Features?: RedisFeatures;
  A1019_PIN?: number[];
  ignore_time?: number;
}

interface FrontendReadyConfig extends GeneralSettingsData {
  ovenType: OvenTypeOption;
  configExists: boolean;
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
    console.log('Retrieved OVEN:config from Redis:', configString);
    const configExists = !!configString;

    if (!configExists) {
      console.warn('OVEN:config not found in Redis, returning default configuration.');
    }

    const redisConfig: RedisConfig = configExists ? JSON.parse(configString!) : {};
    const features = redisConfig.Features || {};

    // 將 AutoTrackOut 明確轉換： true → '1'、false → '0'
    const autoTrackOutValue: AutoTrackoutOption = features.AutoTrackOut === true
      ? '1'
      : features.AutoTrackOut === false
        ? '0'
        : features.AutoTrackOut !== undefined
          ? String(features.AutoTrackOut) as AutoTrackoutOption
          : '0';

    const responseData: FrontendReadyConfig = {
      configExists,
      ovenType: String(redisConfig.OvenType || '3') as OvenTypeOption,
      mesServerIp: '127.0.0.1',
      doorDetect: features.DoorDet ? '1' : '0',
      autoTrackOut: autoTrackOutValue,
      bindMaterialBox: features.Bind_MaterialBox ? '1' : '0',
      buzzerNetworkDetect: features.BuzzerNetworkDet ? '1' : '0',
      czA5Rule: features.cz_a5_rule ? '1' : '0',
      ignoreTime: redisConfig.ignore_time !== undefined ? redisConfig.ignore_time : 20,
      tjKeepingTrackin: features.tj_keepstep_trackin ? '1' : '0',
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

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
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

    const redisConfigToSave: RedisConfig = {
      Oven: {
        '1': {
          name: newSettings.ovens.oven1.name,
          program: '',
          offset: newSettings.ovens.oven1.offsets.map(Number),
        },
      },
      OvenType: Number(newSettings.ovenType) as 1 | 2 | 3 | 4,
      OvenNumber: (newSettings.ovenType === '1' || newSettings.ovenType === '2') ? 2 : 1,
      Thermometer: 0,
      Features: {
        DoorDet: newSettings.doorDetect === '1',
        AutoTrackOut: newSettings.autoTrackOut === '0'
          ? false
          : newSettings.autoTrackOut === '1'
            ? true
            : 2,
        Bind_MaterialBox: newSettings.bindMaterialBox === '1',
        BuzzerNetworkDet: newSettings.buzzerNetworkDetect === '1',
        cz_a5_rule: newSettings.czA5Rule === '1',
        tj_keepstep_trackin: newSettings.tjKeepingTrackin === '1',
      },
      A1019_PIN: newSettings.a1019Pins.map(Number),
      ignore_time: Number(newSettings.ignoreTime),
    };

    if (redisConfigToSave.OvenType === 1 || redisConfigToSave.OvenType === 2) {
      redisConfigToSave.Oven!['2'] = {
        name: newSettings.ovens.oven2.name,
        program: '',
        offset: newSettings.ovens.oven2.offsets.map(Number),
      };
    } else {
      if (redisConfigToSave.Oven) delete redisConfigToSave.Oven['2'];
    }

    await redis.set('OVEN:config', JSON.stringify(redisConfigToSave));

    return NextResponse.json({ message: 'Configuration saved successfully' });
  } catch (error: any) {
    console.error('Error saving configuration to Redis:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
