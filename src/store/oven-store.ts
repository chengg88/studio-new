
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';

export type OvenState = 'IDLE' | 'RUN' | 'Preheating' | 'Cooling' | 'Error' | 'MAINT';
export type OvenTypeOption = '1' | '2' | '3' | '4'; // 1: double door, 2: 2 single, 3: 1 single, 4: ENOHK
export type SelectOnOff = '0' | '1'; // 0: Disable, 1: Enable
export type AutoTrackoutOption = '0' | '1' | '2';
export type A1019PinValue = '1' | '2'; // Represents Oven 1 or Oven 2

export interface HistoricalDataPoint {
    timestamp: string; // ISO string
    temperature: number | null;
}

export interface OvenSettings {
  name: string;
  temperature: number | null;
  humidity: number | null;
  activeProgram: string | null;
  state: OvenState;
  alerts: string[];
  offsets: number[];
  historicalData: HistoricalDataPoint[];
}

export interface GeneralSettingsData {
  mesServerIp: string;
  doorDetect: SelectOnOff;
  autoTrackOut: AutoTrackoutOption;
  bindMaterialBox: SelectOnOff;
  buzzerNetworkDetect: SelectOnOff;
  czA5Rule: SelectOnOff;
  ignoreTime: number;
  tjKeepingTrackin: SelectOnOff;
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
   initializeStore: () => Promise<void>; // Make async
   _hasHydrated: boolean;
   setHasHydrated: (state: boolean) => void;
}

const initialOvenState: OvenSettings = {
  name: '',
  temperature: null,
  humidity: null,
  activeProgram: null,
  state: 'IDLE',
  alerts: [],
  offsets: [0, 0, 0, 0],
  historicalData: [],
};

const initialGeneralSettings: GeneralSettingsData = {
    mesServerIp: '127.0.0.1', // Default read-only
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
      isDualMode: false,
      ovenType: '3',
      ovens: {
        oven1: {...initialOvenState, name: 'Oven 1 (Default)'}, // Provide default names
        oven2: {...initialOvenState, name: 'Oven 2 (Default)'},
      },
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
        if (state) {
          // Trigger fetching config from API after hydration
          // Use setTimeout to ensure it runs after the current synchronous execution stack
          setTimeout(() => get().initializeStore(), 0);
        }
      },

      initializeStore: async () => {
        // Removed check for _hasHydrated here, setHasHydrated will call this.
        // Avoid multiple calls if initializeStore is called from elsewhere too.
        // const alreadyInitialized = get().ovenType !== '3' || get().ovens.oven1.name !== 'Oven 1 (Default)';
        // if (alreadyInitialized && get()._hasHydrated) return;
        try {
          const response = await fetch('/api/oven/config');
          if (!response.ok) {
            console.error('Failed to fetch initial config from API:', response.statusText);
            // Keep defaults if API fails
            set((state) => ({
              ovenType: state.ovenType || '3',
              isDualMode: (state.ovenType === '1' || state.ovenType === '2'),
              mesServerIp: state.mesServerIp || '127.0.0.1',
              ovens: {
                oven1: state.ovens.oven1 || {...initialOvenState, name: 'Oven 1 (API Fail)'},
                oven2: state.ovens.oven2 || {...initialOvenState, name: 'Oven 2 (API Fail)'},
              }
            }));
            return;
          }
          const config = await response.json();

          const ovenType = config.ovenType as OvenTypeOption;
          const isDual = ovenType === '1' || ovenType === '2';

          set({
            ovenType: ovenType,
            isDualMode: isDual,
            mesServerIp: config.mesServerIp || '127.0.0.1', // Comes from API default or actual
            doorDetect: config.doorDetect,
            autoTrackOut: config.autoTrackOut,
            bindMaterialBox: config.bindMaterialBox,
            buzzerNetworkDetect: config.buzzerNetworkDetect,
            czA5Rule: config.czA5Rule,
            ignoreTime: config.ignoreTime,
            tjKeepingTrackin: config.tjKeepingTrackin,
            a1019Pins: config.a1019Pins.map(String) as A1019PinValue[],
            ovens: {
              oven1: {
                ...get().ovens.oven1, // Preserve existing dynamic data like temp, state
                name: config.ovens.oven1.name,
                offsets: config.ovens.oven1.offsets.map(Number),
              },
              oven2: {
                ...get().ovens.oven2,
                name: config.ovens.oven2.name,
                offsets: config.ovens.oven2.offsets.map(Number),
              },
            },
          });
        } catch (error) {
          console.error('Error initializing store from API:', error);
          // Optionally set some state to indicate error or use defaults
        }
      },

      setOvenType: (ovenType) => {
        const isDual = ovenType === '1' || ovenType === '2';
        set((state) => {
            let newPins = [...state.a1019Pins];
            if (!isDual) {
                newPins = state.a1019Pins.map(pin => pin === '2' ? '1' : pin) as A1019PinValue[];
            }
            return { ovenType: ovenType, isDualMode: isDual, a1019Pins: newPins };
        });
      },

      updateGeneralSettings: (settings) => set((state) => ({ ...state, ...settings })),

      updateOvenSettings: (ovenId, settings) =>
        set((state) => ({
          ovens: {
            ...state.ovens,
            [ovenId]: {
              ...state.ovens[ovenId],
              name: settings.name !== undefined ? settings.name : state.ovens[ovenId].name,
              offsets: settings.offsets !== undefined ? settings.offsets.map(Number) : state.ovens[ovenId].offsets,
            },
          },
        })),

       updateOvenData: (ovenId, data) =>
        set((state) => {
          const currentOven = state.ovens[ovenId];
          const existingHistoricalData = Array.isArray(currentOven.historicalData) ? currentOven.historicalData : [];
          
          let newHistoricalData = existingHistoricalData;
          if (data.historicalData && Array.isArray(data.historicalData)) {
            const existingTimestamps = new Set(existingHistoricalData.map(d => d.timestamp));
            const uniqueNewData = data.historicalData.filter(d => !existingTimestamps.has(d.timestamp));
            newHistoricalData = [...existingHistoricalData, ...uniqueNewData];
          }
          
          const maxHistory = 1000; // Keep last 1000 points
          const limitedHistoricalData = newHistoricalData.slice(-maxHistory);

          return {
            ovens: {
              ...state.ovens,
              [ovenId]: {
                ...currentOven,
                // Oven name is primarily from config, status might confirm/override if logic desired
                name: data.name !== undefined ? data.name : currentOven.name,
                temperature: data.temperature !== undefined ? data.temperature : currentOven.temperature,
                humidity: data.humidity !== undefined ? data.humidity : currentOven.humidity, // Will be null
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
      name: 'oven-view-storage-v3', // Incremented version for new structure
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist settings that are user-configurable
        ovenType: state.ovenType,
        isDualMode: state.isDualMode, // This is derived, but useful to persist for initial UI render
        a1019Pins: state.a1019Pins,
        doorDetect: state.doorDetect,
        autoTrackOut: state.autoTrackOut,
        bindMaterialBox: state.bindMaterialBox,
        buzzerNetworkDetect: state.buzzerNetworkDetect,
        czA5Rule: state.czA5Rule,
        ignoreTime: state.ignoreTime,
        tjKeepingTrackin: state.tjKeepingTrackin,
        ovens: { // Only persist names and offsets, not dynamic data
            oven1: { name: state.ovens.oven1.name, offsets: state.ovens.oven1.offsets },
            oven2: { name: state.ovens.oven2.name, offsets: state.ovens.oven2.offsets }
        }
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          // initializeStore is now called within setHasHydrated
        }
      },
    }
  )
);

export const useHasHydrated = () => useOvenStore((state) => state._hasHydrated);

// Call initializeStore once after the store is created and potentially rehydrated
// This logic has been moved into setHasHydrated to ensure it runs after rehydration
// and only once on the client-side.
// if (typeof window !== 'undefined') {
//   useOvenStore.getState().initializeStore();
// }
