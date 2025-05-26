
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';

export type OvenState = 'IDLE' | 'RUN' | 'Preheating' | 'Cooling' | 'Error' | 'MAINT'; // Added from Redis example, original had PREHEAT, COOLING etc.
export type OvenTypeOption = '1' | '2' | '3' | '4'; // 1: double door, 2: 2 single, 3: 1 single, 4: ENOHK
export type SelectOnOff = '0' | '1'; // 0: Disable, 1: Enable
export type AutoTrackoutOption = '0' | '1' | '2'; // 'true'/'false' from redis need to map
export type A1019PinValue = '1' | '2'; // Represents Oven 1 or Oven 2

export interface HistoricalDataPoint {
    timestamp: string; // ISO string
    temperature: number | null;
}

export interface OvenSettings {
  name: string;
  temperature: number | null; // Current temperature (from t1)
  humidity: number | null;    // Current humidity (if available)
  activeProgram: string | null;
  state: OvenState;
  alerts: string[]; // Keep if needed, not in Redis example for OVEN:OvenX
  offsets: number[]; // Array of 4 offset values
  historicalData: HistoricalDataPoint[];
}

interface GeneralSettingsData {
  mesServerIp: string; // Read-only, example '127.0.0.1'
  doorDetect: SelectOnOff;
  autoTrackOut: AutoTrackoutOption;
  bindMaterialBox: SelectOnOff;
  buzzerNetworkDetect: SelectOnOff;
  czA5Rule: SelectOnOff; // Map from cz_a5_rule
  ignoreTime: number;
  tjKeepingTrackin: SelectOnOff; // Map from tj_keepstep_trackin
  a1019Pins: A1019PinValue[];
}

interface OvenStoreState extends GeneralSettingsData {
  isDualMode: boolean;
  ovenType: OvenTypeOption;

  ovens: {
    oven1: OvenSettings;
    oven2: OvenSettings;
  };

  setOvenType: (ovenType: OvenTypeOption) => void;
  updateGeneralSettings: (settings: Partial<GeneralSettingsData>) => void;
  updateOvenSettings: (
    ovenId: 'oven1' | 'oven2',
    settings: Partial<Pick<OvenSettings, 'name' | 'offsets' >>
  ) => void;
  updateOvenData: (
    ovenId: 'oven1' | 'oven2',
    data: Partial<OvenSettings>
   ) => void;
   initializeStore: () => void;
   _hasHydrated: boolean;
   setHasHydrated: (state: boolean) => void;
}

const initialOvenState: OvenSettings = {
  name: '',
  temperature: null,
  humidity: null, // Humidity not in Redis oven status or SQLite history
  activeProgram: null,
  state: 'IDLE',
  alerts: [],
  offsets: [0, 0, 0, 0],
  historicalData: [],
};

const initialGeneralSettings: GeneralSettingsData = {
    mesServerIp: '127.0.0.1', // This should ideally come from a fixed config or env if not in Redis
    doorDetect: '0',
    autoTrackOut: '0',
    bindMaterialBox: '0',
    buzzerNetworkDetect: '0',
    czA5Rule: '0',
    ignoreTime: 20,
    tjKeepingTrackin: '0',
    a1019Pins: Array(8).fill('1') as A1019PinValue[],
};

export const useOvenStore = create<OvenStoreState>()(
  persist(
    (set, get) => ({
      ...initialGeneralSettings,
      isDualMode: false, // Derived from ovenType
      ovenType: '3', // Default, will be overwritten by API
      ovens: {
        oven1: {...initialOvenState, name: 'Oven 1'},
        oven2: {...initialOvenState, name: 'Oven 2'},
      },
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      initializeStore: async () => {
        if (!get()._hasHydrated) return; // Prevent running if not hydrated or already run
        try {
          const response = await fetch('/api/oven/config');
          if (!response.ok) {
            console.error('Failed to fetch initial config:', response.statusText);
            return;
          }
          const config = await response.json();

          const ovenType = config.OvenType as OvenTypeOption;
          const isDual = ovenType === '1' || ovenType === '2';

          set({
            ovenType: ovenType,
            isDualMode: isDual,
            a1019Pins: config.A1019_PIN.map(String), // Ensure they are strings
            doorDetect: config.Features.DoorDet,
            autoTrackOut: config.Features.AutoTrackOut,
            bindMaterialBox: config.Features.Bind_MaterialBox,
            buzzerNetworkDetect: config.Features.BuzzerNetworkDet,
            czA5Rule: config.Features.cz_a5_rule,
            ignoreTime: config.ignore_time,
            tjKeepingTrackin: config.Features.tj_keepstep_trackin,
            // mesServerIp is not in OVEN:config in example, keep default or set if available
            ovens: {
              oven1: {
                ...get().ovens.oven1,
                name: config.Oven['1']?.name || 'Oven 1',
                offsets: config.Oven['1']?.offset || [0,0,0,0],
              },
              oven2: {
                ...get().ovens.oven2,
                name: config.Oven['2']?.name || 'Oven 2',
                offsets: config.Oven['2']?.offset || [0,0,0,0],
              },
            },
          });
        } catch (error) {
          console.error('Error initializing store from API:', error);
        }
      },

      setOvenType: (ovenType) => {
        const isDual = ovenType === '1' || ovenType === '2';
        set({ ovenType: ovenType, isDualMode: isDual });
        // If switching to single oven mode, ensure A1019 pins for oven2 are reset to oven1
        if (!isDual) {
            const currentPins = get().a1019Pins;
            const updatedPins = currentPins.map(pin => pin === '2' ? '1' : pin);
            set({ a1019Pins: updatedPins as A1019PinValue[] });
        }
      },

      updateGeneralSettings: (settings) => set((state) => ({ ...state, ...settings })),

      updateOvenSettings: (ovenId, settings) =>
        set((state) => ({
          ovens: {
            ...state.ovens,
            [ovenId]: {
              ...state.ovens[ovenId],
              name: settings.name ?? state.ovens[ovenId].name,
              offsets: settings.offsets ?? state.ovens[ovenId].offsets,
            },
          },
        })),

       updateOvenData: (ovenId, data) =>
        set((state) => {
          const currentOven = state.ovens[ovenId];
          const currentHistoricalData = Array.isArray(currentOven.historicalData) ? currentOven.historicalData : [];
          
          let newHistoricalData = currentHistoricalData;
          if (data.historicalData && Array.isArray(data.historicalData)) {
            // More robust append: filter out potential duplicates by timestamp before appending
            const existingTimestamps = new Set(currentHistoricalData.map(d => d.timestamp));
            const uniqueNewData = data.historicalData.filter(d => !existingTimestamps.has(d.timestamp));
            newHistoricalData = [...currentHistoricalData, ...uniqueNewData];
          }
          
          const maxHistory = 1000;
          const limitedHistoricalData = newHistoricalData.slice(-maxHistory);

          return {
            ovens: {
              ...state.ovens,
              [ovenId]: {
                ...currentOven,
                // name is part of config, not dynamic status typically
                // name: data.name !== undefined ? data.name : currentOven.name,
                temperature: data.temperature !== undefined ? data.temperature : currentOven.temperature,
                humidity: data.humidity !== undefined ? data.humidity : currentOven.humidity,
                activeProgram: data.activeProgram !== undefined ? data.activeProgram : currentOven.activeProgram,
                state: data.state !== undefined ? data.state : currentOven.state,
                alerts: data.alerts !== undefined ? data.alerts : currentOven.alerts,
                historicalData: limitedHistoricalData,
              },
            },
          };
        }),
    }),
    {
      name: 'oven-view-storage-v2', // New storage key to avoid conflicts with old structure
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist settings that are user-configurable and should survive sessions
        ovenType: state.ovenType,
        isDualMode: state.isDualMode,
        a1019Pins: state.a1019Pins,
        doorDetect: state.doorDetect,
        autoTrackOut: state.autoTrackOut,
        bindMaterialBox: state.bindMaterialBox,
        buzzerNetworkDetect: state.buzzerNetworkDetect,
        czA5Rule: state.czA5Rule,
        ignoreTime: state.ignoreTime,
        tjKeepingTrackin: state.tjKeepingTrackin,
        ovens: {
            oven1: { name: state.ovens.oven1.name, offsets: state.ovens.oven1.offsets },
            oven2: { name: state.ovens.oven2.name, offsets: state.ovens.oven2.offsets }
        }
        // mesServerIp is generally not persisted as it's often a fixed config.
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          // Trigger fetching config from API after hydration
          // setTimeout(() => state.initializeStore(), 0); // Ensure it runs after current stack
        }
      },
    }
  )
);

export const useHasHydrated = () => useOvenStore((state) => state._hasHydrated);

// Call initializeStore once after the store is created and potentially rehydrated
// This needs to be managed carefully to only run once on client-side.
if (typeof window !== 'undefined') {
  useOvenStore.getState().initializeStore();
}
