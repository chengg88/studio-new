
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';

export type OvenState = 'Idle' | 'Preheating' | 'Running' | 'Cooling' | 'Error';
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
  temperature: number | null; // Current temperature
  humidity: number | null;    // Current humidity
  activeProgram: string | null;
  state: OvenState;
  alerts: string[];
  // temperatureSetpoint: number | null; // Removed
  // programSchedule: string; // Removed
  offsets: number[]; // Array of 4 offset values
  historicalData: HistoricalDataPoint[]; // Store historical data here
}

interface OvenStoreState {
  // Old general settings
  isDualMode: boolean; // Derived from ovenType, maybe remove? Let's keep for now for compatibility.
  ovenType: OvenTypeOption; // New setting based on old HTML

  // New general settings from old HTML
  mesServerIp: string;
  doorDetect: SelectOnOff;
  autoTrackOut: AutoTrackoutOption;
  bindMaterialBox: SelectOnOff;
  buzzerNetworkDetect: SelectOnOff;
  czA5Rule: SelectOnOff;
  ignoreTime: number;
  tjKeepingTrackin: SelectOnOff;
  a1019Pins: A1019PinValue[]; // Array of 8 values ('1' or '2')

  ovens: {
    oven1: OvenSettings;
    oven2: OvenSettings;
  };

  // Actions
  setOvenType: (ovenType: OvenTypeOption) => void;
  updateGeneralSettings: (settings: Partial<{
    mesServerIp: string;
    doorDetect: SelectOnOff;
    autoTrackOut: AutoTrackoutOption;
    bindMaterialBox: SelectOnOff;
    buzzerNetworkDetect: SelectOnOff;
    czA5Rule: SelectOnOff;
    ignoreTime: number;
    tjKeepingTrackin: SelectOnOff;
    a1019Pins: A1019PinValue[];
  }>) => void;
  updateOvenSettings: (
    ovenId: 'oven1' | 'oven2',
    // Removed temperatureSetpoint and programSchedule from the pick
    settings: Partial<Pick<OvenSettings, 'name' | 'offsets' >>
  ) => void;
  updateOvenData: (
    ovenId: 'oven1' | 'oven2',
    data: Partial<OvenSettings>
   ) => void;
   initializeStore: () => void; // Action to trigger initialization/rehydration
   _hasHydrated: boolean; // Internal flag for hydration status
   setHasHydrated: (state: boolean) => void; // Action to set hydration status
}

const initialOvenState: OvenSettings = {
  name: '',
  temperature: null,
  humidity: null,
  activeProgram: null,
  state: 'Idle',
  alerts: [],
  // temperatureSetpoint: 100, // Removed
  // programSchedule: '', // Removed
  offsets: [0, 0, 0, 0], // Initialize offsets array
  historicalData: [],
};

const initialGeneralSettings = {
    mesServerIp: '127.0.0.1', // Default example
    doorDetect: '0' as SelectOnOff,
    autoTrackOut: '0' as AutoTrackoutOption,
    bindMaterialBox: '0' as SelectOnOff,
    buzzerNetworkDetect: '0' as SelectOnOff,
    czA5Rule: '0' as SelectOnOff,
    ignoreTime: 20,
    tjKeepingTrackin: '0' as SelectOnOff,
    a1019Pins: Array(8).fill('1') as A1019PinValue[], // Default all to Oven 1
};

export const useOvenStore = create<OvenStoreState>()(
  persist(
    (set, get) => ({
      isDualMode: false, // Will be updated based on ovenType
      ovenType: '3', // Default to 1 single door oven
      ...initialGeneralSettings, // Spread initial general settings
      ovens: {
        oven1: {...initialOvenState, name: 'Oven 1'}, // Default names
        oven2: {...initialOvenState, name: 'Oven 2'},
      },
      _hasHydrated: false, // Initialize hydration status

      setHasHydrated: (state) => {
            set({ _hasHydrated: state });
      },

      initializeStore: () => {
          // Logic after hydration can go here if needed
      },

      setOvenType: (ovenType) => {
        const isDual = ovenType === '1' || ovenType === '2'; // 1 double door or 2 single doors
        set({ ovenType: ovenType, isDualMode: isDual });
      },

      updateGeneralSettings: (settings) => set((state) => ({ ...state, ...settings })),


      updateOvenSettings: (ovenId, settings) =>
        set((state) => ({
          ovens: {
            ...state.ovens,
            [ovenId]: {
              ...state.ovens[ovenId],
              name: settings.name ?? state.ovens[ovenId].name,
              // temperatureSetpoint: settings.temperatureSetpoint ?? state.ovens[ovenId].temperatureSetpoint, // Removed
              // programSchedule: settings.programSchedule ?? state.ovens[ovenId].programSchedule, // Removed
              offsets: settings.offsets ?? state.ovens[ovenId].offsets, // Update offsets
            },
          },
        })),

       updateOvenData: (ovenId, data) =>
        set((state) => {
          const currentOven = state.ovens[ovenId];
          // Ensure current historical data is an array before spreading
          const currentHistoricalData = Array.isArray(currentOven.historicalData) ? currentOven.historicalData : [];
          // Append new historical data if provided, keep existing otherwise
          const newHistoricalData = data.historicalData
                ? [...currentHistoricalData, ...data.historicalData] // Naive append
                : currentHistoricalData;

          // Simple approach: Keep last N points (e.g., 1000)
          const maxHistory = 1000;
          const limitedHistoricalData = newHistoricalData.slice(-maxHistory);

          return {
            ovens: {
              ...state.ovens,
              [ovenId]: {
                ...currentOven,
                temperature: data.temperature !== undefined ? data.temperature : currentOven.temperature,
                humidity: data.humidity !== undefined ? data.humidity : currentOven.humidity,
                activeProgram: data.activeProgram !== undefined ? data.activeProgram : currentOven.activeProgram,
                state: data.state !== undefined ? data.state : currentOven.state,
                alerts: data.alerts !== undefined ? data.alerts : currentOven.alerts,
                // Use the potentially limited data, ensure it's an array if source was invalid
                historicalData: data.historicalData ? limitedHistoricalData : currentHistoricalData,
              },
            },
          };
        }),
    }),
    {
      name: 'oven-view-storage', // Local storage key
      storage: createJSONStorage(() => localStorage), // Use local storage
      // Persist general settings and oven-specific settings
      partialize: (state) => ({
        ovenType: state.ovenType,
        isDualMode: state.isDualMode, // Persist derived state too for simplicity on hydration
        mesServerIp: state.mesServerIp,
        doorDetect: state.doorDetect,
        autoTrackOut: state.autoTrackOut,
        bindMaterialBox: state.bindMaterialBox,
        buzzerNetworkDetect: state.buzzerNetworkDetect,
        czA5Rule: state.czA5Rule,
        ignoreTime: state.ignoreTime,
        tjKeepingTrackin: state.tjKeepingTrackin,
        a1019Pins: state.a1019Pins,
        ovens: {
            oven1: {
                name: state.ovens.oven1.name,
                // temperatureSetpoint: state.ovens.oven1.temperatureSetpoint, // Removed
                // programSchedule: state.ovens.oven1.programSchedule, // Removed
                offsets: state.ovens.oven1.offsets, // Persist offsets
            },
            oven2: {
                name: state.ovens.oven2.name,
                // temperatureSetpoint: state.ovens.oven2.temperatureSetpoint, // Removed
                // programSchedule: state.ovens.oven2.programSchedule, // Removed
                offsets: state.ovens.oven2.offsets, // Persist offsets
            }
        }
      }),
        onRehydrateStorage: () => (state) => {
            if (state) {
                 // Ensure historicalData is initialized as an array after rehydration
                 // Also ensure a1019Pins and offsets are initialized correctly
                 const currentOvens = state.ovens;
                 if (!Array.isArray(currentOvens.oven1.historicalData)) {
                    currentOvens.oven1.historicalData = [];
                 }
                  if (!Array.isArray(currentOvens.oven2.historicalData)) {
                    currentOvens.oven2.historicalData = [];
                 }
                 if (!Array.isArray(state.a1019Pins) || state.a1019Pins.length !== 8) {
                    state.a1019Pins = Array(8).fill('1');
                 }
                 if (!Array.isArray(currentOvens.oven1.offsets) || currentOvens.oven1.offsets.length !== 4) {
                    currentOvens.oven1.offsets = [0, 0, 0, 0];
                 }
                  if (!Array.isArray(currentOvens.oven2.offsets) || currentOvens.oven2.offsets.length !== 4) {
                    currentOvens.oven2.offsets = [0, 0, 0, 0];
                 }

                state.setHasHydrated(true);
            }
        },
    }
  )
);

// Hook to check hydration status (optional, but can be useful)
export const useHasHydrated = () => useOvenStore((state) => state._hasHydrated);
