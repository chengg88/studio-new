import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';

export type OvenState = 'Idle' | 'Preheating' | 'Running' | 'Cooling' | 'Error';

export interface CalibrationPoint {
  setpoint: number;
  actual: number;
}

export interface HistoricalDataPoint {
    timestamp: string; // ISO string
    temperature: number | null;
}

export interface OvenData {
  name: string;
  temperature: number | null; // Current temperature
  humidity: number | null;    // Current humidity
  activeProgram: string | null;
  state: OvenState;
  alerts: string[];
  temperatureSetpoint: number | null;
  programSchedule: string; // Cron expression or empty
  calibrationPoints: CalibrationPoint[];
  historicalData: HistoricalDataPoint[]; // Store historical data here
}

interface OvenStoreState {
  isDualMode: boolean;
  ovens: {
    oven1: OvenData;
    oven2: OvenData;
  };
  setDualMode: (isDual: boolean) => void;
  updateOvenSettings: (
    ovenId: 'oven1' | 'oven2',
    settings: Partial<Pick<OvenData, 'name' | 'temperatureSetpoint' | 'programSchedule' | 'calibrationPoints'>>
  ) => void;
  updateOvenData: (
    ovenId: 'oven1' | 'oven2',
    data: Partial<OvenData>
   ) => void;
   initializeStore: () => void; // Action to trigger initialization/rehydration
   _hasHydrated: boolean; // Internal flag for hydration status
   setHasHydrated: (state: boolean) => void; // Action to set hydration status
}

const initialOvenState: OvenData = {
  name: '',
  temperature: null,
  humidity: null,
  activeProgram: null,
  state: 'Idle',
  alerts: [],
  temperatureSetpoint: 100, // Default setpoint
  programSchedule: '',
  calibrationPoints: [],
  historicalData: [],
};

export const useOvenStore = create<OvenStoreState>()(
  persist(
    (set, get) => ({
      isDualMode: false,
      ovens: {
        oven1: {...initialOvenState, name: 'Oven 1'}, // Default names
        oven2: {...initialOvenState, name: 'Oven 2'},
      },
      _hasHydrated: false, // Initialize hydration status

      setHasHydrated: (state) => {
            set({ _hasHydrated: state });
      },

      // This action needs to be called explicitly after store creation or in a useEffect
      initializeStore: () => {
          // Logic to potentially run after hydration can go here,
          // but Zustand's persist middleware handles the rehydration itself.
          // We mainly use this to ensure consumers wait for hydration if needed.
          // console.log("Store initialized/rehydrated.");
          // If you need to run logic *after* hydration is complete, use the onRehydrateStorage callback
      },

      setDualMode: (isDual) => set({isDualMode: isDual}),

      updateOvenSettings: (ovenId, settings) =>
        set((state) => ({
          ovens: {
            ...state.ovens,
            [ovenId]: {
              ...state.ovens[ovenId],
              name: settings.name ?? state.ovens[ovenId].name,
              temperatureSetpoint: settings.temperatureSetpoint ?? state.ovens[ovenId].temperatureSetpoint,
              programSchedule: settings.programSchedule ?? state.ovens[ovenId].programSchedule,
              calibrationPoints: settings.calibrationPoints ?? state.ovens[ovenId].calibrationPoints,
            },
          },
        })),

       updateOvenData: (ovenId, data) =>
        set((state) => {
          const currentOven = state.ovens[ovenId];
           // Append new historical data if provided, keep existing otherwise
          const newHistoricalData = data.historicalData
                ? [...currentOven.historicalData, ...data.historicalData] // Naive append, consider limiting size
                : currentOven.historicalData;

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
                historicalData: data.historicalData ? limitedHistoricalData : currentOven.historicalData, // Use the limited data
              },
            },
          };
        }),
    }),
    {
      name: 'oven-view-storage', // Local storage key
      storage: createJSONStorage(() => localStorage), // Use local storage
      // Only persist settings, not real-time data like current temp/humidity/state/alerts/history
      partialize: (state) => ({
        isDualMode: state.isDualMode,
        ovens: {
            oven1: {
                name: state.ovens.oven1.name,
                temperatureSetpoint: state.ovens.oven1.temperatureSetpoint,
                programSchedule: state.ovens.oven1.programSchedule,
                calibrationPoints: state.ovens.oven1.calibrationPoints,
                // DO NOT persist these:
                // temperature: null,
                // humidity: null,
                // activeProgram: null,
                // state: 'Idle',
                // alerts: [],
                // historicalData: []
            },
            oven2: {
                name: state.ovens.oven2.name,
                temperatureSetpoint: state.ovens.oven2.temperatureSetpoint,
                programSchedule: state.ovens.oven2.programSchedule,
                calibrationPoints: state.ovens.oven2.calibrationPoints,
            }
        }
      }),
        onRehydrateStorage: () => (state) => {
            if (state) state.setHasHydrated(true)
        },
    }
  )
);

// Hook to check hydration status (optional, but can be useful)
export const useHasHydrated = () => useOvenStore((state) => state._hasHydrated);
