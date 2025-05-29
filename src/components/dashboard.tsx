
'use client';

import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  Thermometer,
  Droplet,
  PlayCircle,
  PauseCircle,
  Loader,
  PowerOff,
  AlertCircle,
  Settings,
  CheckCircle,
} from 'lucide-react';
import TemperatureChart from '@/components/temperature-chart';
import {useOvenStore, type OvenData, type OvenState, type HistoricalDataPoint} from '@/store/oven-store';
import {getTemperatureLimits, type TemperatureLimits} from '@/services/mes';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import DateRangePicker from './date-range-picker';
import type {DateRange} from 'react-day-picker';
import {subDays, format} from 'date-fns';
import {cn} from '@/lib/utils';
import {useTranslations} from 'next-intl';

// Fetches current status and historical data for an oven
async function fetchFullOvenData(ovenId: string, currentStoreData: OvenData): Promise<Partial<OvenData>> {
  try {
    const [statusRes, historyRes] = await Promise.all([
      fetch(`/api/oven/status/${ovenId}`),
      fetch(`/api/oven/history/${ovenId}`),
    ]);

    let statusData: Partial<OvenData> = {};
    if (statusRes.ok) {
      statusData = await statusRes.json();
    } else {
      console.warn(`Failed to fetch status for ${ovenId}: ${statusRes.statusText}`);
    }

    let historicalData: HistoricalDataPoint[] = [];
    if (historyRes.ok) {
      const historyJson = await historyRes.json();
      if (Array.isArray(historyJson)) {
          historicalData = historyJson;
      } else {
          console.warn(`Received non-array history for ${ovenId}:`, historyJson);
      }
    } else {
      console.warn(`Failed to fetch history for ${ovenId}: ${historyRes.statusText}`);
    }
    
    // Prioritize name from status API if available, otherwise keep from store (config)
    const ovenName = statusData.name || currentStoreData.name;

    return {
      name: ovenName,
      temperature: historicalData.length > 0 ? historicalData[historicalData.length - 1].temperature : currentStoreData.temperature,
      humidity: statusData.humidity !== undefined ? statusData.humidity : null, // Will be null from API
      activeProgram: statusData.activeProgram || 'None',
      state: (statusData.state as OvenState) || 'IDLE',
      alerts: statusData.alerts || [],
      historicalData: historicalData.length > 0 ? historicalData : currentStoreData.historicalData, // Use new if available, else keep old
    };
  } catch (error) {
    console.error(`Error fetching full data for ${ovenId}:`, error);
    return {
      name: currentStoreData.name, // Keep name from store on error
      temperature: currentStoreData.temperature,
      humidity: currentStoreData.humidity,
      activeProgram: 'None',
      state: 'Error',
      alerts: ['Data Fetch Error'],
      historicalData: currentStoreData.historicalData,
    };
  }
}


export default function Dashboard() {
  const t = useTranslations('Dashboard');
  const {ovens, isDualMode, updateOvenData, initializeStore, _hasHydrated, setHasHydrated} = useOvenStore();
  const [isLoading, setIsLoading] = useState(true);
  const [limits, setLimits] = useState<{[key: string]: TemperatureLimits}>({});
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

   const stateTranslations = useMemo(() => ({
    IDLE: t('stateIdle'),
    Preheating: t('statePreheating'),
    RUN: t('stateRunning'),
    Cooling: t('stateCooling'),
    Error: t('stateError'),
    MAINT: "Maintenance", // Add if needed, ensure translation exists
  }), [t]);

  useEffect(() => {
    if (!_hasHydrated) {
      setHasHydrated(true); // This will trigger initializeStore via onRehydrateStorage or direct call
    }
  }, [_hasHydrated, setHasHydrated]);

  // initializeStore is now called via setHasHydrated -> onRehydrateStorage or directly in setHasHydrated in store.
  // So, no need to call it directly here unless specific conditions warrant it.

  const fetchData = useCallback(async () => {
    if (!useOvenStore.getState()._hasHydrated) return; // Ensure store is hydrated before fetching

    try {
      const currentStore = useOvenStore.getState();
      const ovenIdsToFetch = currentStore.isDualMode ? ['oven1', 'oven2'] : ['oven1'];
      
      const dataPromises = ovenIdsToFetch.map(id => fetchFullOvenData(id, currentStore.ovens[id as 'oven1' | 'oven2']));
      const limitsPromises = ovenIdsToFetch.map(id => getTemperatureLimits(id).then(lim => ({id, lim})));

      const [ovenDataResults, limitsResults] = await Promise.all([
          Promise.all(dataPromises),
          Promise.all(limitsPromises)
      ]);

      ovenDataResults.forEach((data, index) => {
          const ovenId = ovenIdsToFetch[index];
           // Ensure historicalData is initialized if missing or not an array
           const currentOven = useOvenStore.getState().ovens[ovenId as 'oven1' | 'oven2'];
           const existingHistoricalData = Array.isArray(currentOven.historicalData) ? currentOven.historicalData : [];
           const incomingHistoricalData = Array.isArray(data.historicalData) ? data.historicalData : [];

          updateOvenData(ovenId, {
            ...data,
            // Merge historical data carefully
            historicalData: [...existingHistoricalData, ...incomingHistoricalData.filter(d => !existingHistoricalData.find(ed => ed.timestamp === d.timestamp))]
          }); 
      });

      const newLimits = limitsResults.reduce((acc, {id, lim}) => {
          acc[id] = lim;
          return acc;
      }, {} as {[key: string]: TemperatureLimits});
      setLimits(newLimits);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
        if (isLoading) setIsLoading(false);
    }
  }, [updateOvenData, isLoading]); // Removed isDualMode from here as it's read from store inside


  useEffect(() => {
    if (!_hasHydrated) return;

    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [_hasHydrated, fetchData]);

  function getStateIcon(state: OvenState) {
    switch (state) {
      case 'IDLE':
        return <PowerOff className="w-5 h-5 text-muted-foreground" />;
      case 'Preheating':
        return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'RUN':
        return <PlayCircle className="w-5 h-5 text-accent" />;
      case 'Cooling':
        return <PauseCircle className="w-5 h-5 text-blue-500" />;
      case 'Error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'MAINT':
        return <Settings className="w-5 h-5 text-orange-500" />;
      default:
        return <Settings className="w-5 h-5 text-muted-foreground" />;
    }
  }

  function getStateBadgeVariant(state: OvenState): "default" | "secondary" | "destructive" | "outline" {
      switch (state) {
          case 'IDLE': return 'secondary';
          case 'Preheating': return 'default'; // Consider bg-yellow-500 text-yellow-foreground if theme supports
          case 'RUN': return 'default'; // Consider bg-green-500 text-green-foreground
          case 'Cooling': return 'outline'; // Consider bg-blue-500 text-blue-foreground
          case 'Error': return 'destructive';
          case 'MAINT': return 'default'; // Consider bg-orange-500 text-orange-foreground
          default: return 'secondary';
      }
  }


  const renderOvenCard = (ovenId: 'oven1' | 'oven2') => {
    const oven = ovens[ovenId];
    const ovenLimits = limits[ovenId];
    // Name now comes from store, primarily populated by OVEN:config
    // but can be updated by status API if logic in updateOvenData handles it.
    const customOvenName = oven.name || (useOvenStore.getState().isDualMode ? (ovenId === 'oven1' ? t('oven1') : t('oven2')) : t('oven'));


    if (!oven) return null; // Should not happen if store is initialized correctly

    const filteredData = (Array.isArray(oven.historicalData) ? oven.historicalData : []).filter(d => {
        if (!d || !d.timestamp) return false; // Ensure data point and timestamp exist
        const timestamp = new Date(d.timestamp);
        if (isNaN(timestamp.getTime())) return false; // Ensure valid date

        const from = dateRange?.from ? new Date(dateRange.from.setHours(0,0,0,0)) : undefined;
        const to = dateRange?.to ? new Date(dateRange.to.setHours(23,59,59,999)): undefined;
        if (!from || !to) return true;
        return timestamp >= from && timestamp <= to;
    });

    const translatedState = stateTranslations[oven.state as keyof typeof stateTranslations] || oven.state;

    return (
      <Card key={ovenId} className="flex flex-col">
        <CardHeader>
          <CardTitle>{customOvenName}</CardTitle>
           <CardDescription>
             <Badge variant={getStateBadgeVariant(oven.state)} className={cn("capitalize", 
                oven.state === 'RUN' ? 'bg-accent text-accent-foreground' : '',
                oven.state === 'Preheating' ? 'bg-yellow-500 text-yellow-foreground' : '', // Example custom colors
                oven.state === 'Cooling' ? 'bg-blue-500 text-blue-foreground' : ''
              )}>
                {translatedState}
              </Badge>
           </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 flex-grow">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('temperature')}</p>
                <p className="text-lg font-semibold">
                  {typeof oven.temperature === 'number' ? `${oven.temperature.toFixed(1)}${t('temperatureUnit')}` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Droplet className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">{t('humidity')}</p>
                <p className="text-lg font-semibold">
                  {typeof oven.humidity === 'number' ? `${oven.humidity.toFixed(1)}${t('humidityUnit')}` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStateIcon(oven.state)}
              <div>
                <p className="text-sm text-muted-foreground">{t('state')}</p>
                <p className="text-lg font-semibold capitalize">{translatedState}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
               <div>
                <p className="text-sm text-muted-foreground">{t('activeProgram')}</p>
                <p className="text-lg font-semibold">{oven.activeProgram || t('none')}</p>
              </div>
            </div>
          </div>

          {oven.alerts && oven.alerts.length > 0 && (
             <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>{t('alerts')}</AlertTitle>
               <AlertDescription>
                 {oven.alerts.join(', ')}
               </AlertDescription>
             </Alert>
           )}


          <Card className="mt-4 flex-grow">
            <CardHeader>
                <CardTitle>{t('temperatureHistory')}</CardTitle>
                 <CardDescription>
                     {dateRange?.from && dateRange?.to
                         ? t('showingData', {
                             from: format(dateRange.from, 'yyyy/MM/dd'),
                             to: format(dateRange.to, 'yyyy/MM/dd'),
                           })
                         : t('pickDateRange')}
                 </CardDescription>
            </CardHeader>
            <CardContent className="h-64 sm:h-80">
              <TemperatureChart
                data={filteredData}
                upperLimit={ovenLimits?.upperLimitCelsius}
                lowerLimit={ovenLimits?.lowerLimitCelsius}
                translations={{
                    tooltipTemperature: t('temperature'),
                    upperLimitLabel: t('tempChartUpperLimit', { limit: ovenLimits?.upperLimitCelsius ?? 'N/A' }),
                    lowerLimitLabel: t('tempChartLowerLimit', { limit: ovenLimits?.lowerLimitCelsius ?? 'N/A' }),
                    legendLabel: t('tempChartTitle')
                }}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  };

   if (isLoading && !_hasHydrated) {
    return <div className="flex justify-center items-center h-64"><Loader className="w-8 h-8 animate-spin" /> {t('loading')}</div>;
   }


  return (
    <div className="space-y-6 w-full mx-auto"> {/* Changed to w-full */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{t('ovenStatus')}</h2>
        <DateRangePicker
           date={dateRange}
           onDateChange={setDateRange}
           placeholderText={t('pickDateRange')}
         />
      </div>
       <div
         className={cn(
           'grid gap-6',
            // Always use grid-cols-1 on smaller screens
            // On lg screens and up, use grid-cols-2 if isDualMode is true, otherwise grid-cols-1 but with a max-width to prevent it from becoming too wide
           isDualMode 
             ? 'grid-cols-1 lg:grid-cols-2' 
             : 'grid-cols-1 lg:grid-cols-1 lg:max-w-3xl lg:mx-auto' // Adjust max-width as needed
         )}
       >
         {renderOvenCard('oven1')}
         {isDualMode && renderOvenCard('oven2')}
      </div>
    </div>
  );
}
