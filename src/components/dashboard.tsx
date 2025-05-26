
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
async function fetchFullOvenData(ovenId: string): Promise<Partial<OvenData>> {
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
      historicalData = await historyRes.json();
    } else {
      console.warn(`Failed to fetch history for ${ovenId}: ${historyRes.statusText}`);
    }
    
    // The name comes from config, not status API, so we don't map it here.
    // It's populated in the store by initializeStore.
    return {
      temperature: statusData.temperature, // This should now come from t1 in history or status
      humidity: statusData.humidity !== undefined ? statusData.humidity : null, // Humidity might not be available
      activeProgram: statusData.activeProgram || 'None',
      state: (statusData.state as OvenState) || 'IDLE',
      alerts: statusData.alerts || [],
      historicalData: historicalData,
    };
  } catch (error) {
    console.error(`Error fetching full data for ${ovenId}:`, error);
    return {
      temperature: null,
      humidity: null,
      activeProgram: 'None',
      state: 'Error',
      alerts: ['Data Fetch Error'],
      historicalData: [],
    };
  }
}


export default function Dashboard() {
  const t = useTranslations('Dashboard');
  const {ovens, isDualMode, updateOvenData, initializeStore, _hasHydrated, setHasHydrated} = useOvenStore();
  const [isLoading, setIsLoading] = useState(true); // For initial full load
  const [limits, setLimits] = useState<{[key: string]: TemperatureLimits}>({});
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

   const stateTranslations = useMemo(() => ({
    IDLE: t('stateIdle'),
    Preheating: t('statePreheating'), // Assuming 'Preheating' maps to a state from API, Redis uses 'RUN', 'IDLE' etc.
    RUN: t('stateRunning'),
    Cooling: t('stateCooling'), // Assuming 'Cooling' maps to a state
    Error: t('stateError'),
    MAINT: "Maintenance", // Add if needed
    // Map other states from your Redis/API if they differ
  }), [t]);

  useEffect(() => {
    if (!_hasHydrated) {
      // This ensures client-side hydration completes before attempting to load persisted state
      // and then potentially fetching from API via initializeStore.
      setHasHydrated(true);
    }
  }, [_hasHydrated, setHasHydrated]);

  useEffect(() => {
    if (_hasHydrated && !useOvenStore.getState().ovenType) { // Check if config is already loaded
      initializeStore(); // Load settings from API (which populates store)
    }
  }, [_hasHydrated, initializeStore]);


  const fetchData = useCallback(async () => {
    try {
      const ovenIdsToFetch = isDualMode ? ['oven1', 'oven2'] : ['oven1'];
      
      const dataPromises = ovenIdsToFetch.map(id => fetchFullOvenData(id));
      const limitsPromises = ovenIdsToFetch.map(id => getTemperatureLimits(id).then(lim => ({id, lim})));

      const [ovenDataResults, limitsResults] = await Promise.all([
          Promise.all(dataPromises),
          Promise.all(limitsPromises)
      ]);

      ovenDataResults.forEach((data, index) => {
          const ovenId = ovenIdsToFetch[index];
          updateOvenData(ovenId, data);
      });

      const newLimits = limitsResults.reduce((acc, {id, lim}) => {
          acc[id] = lim;
          return acc;
      }, {} as {[key: string]: TemperatureLimits});
      setLimits(newLimits);

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
        if (isLoading) setIsLoading(false); // Set loading to false after initial fetch
    }
  }, [isDualMode, updateOvenData, isLoading]);


  useEffect(() => {
    if (!_hasHydrated) return; // Don't fetch if not hydrated

    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, 5000); // Refresh data every 5 seconds
    return () => clearInterval(intervalId);
  }, [_hasHydrated, fetchData]); // Add fetchData to dependency array

  function getStateIcon(state: OvenState) {
    switch (state) {
      case 'IDLE':
        return <PowerOff className="w-5 h-5 text-muted-foreground" />;
      case 'Preheating': // Or map your actual preheating state string
        return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'RUN':
        return <PlayCircle className="w-5 h-5 text-accent" />;
      case 'Cooling': // Or map your actual cooling state string
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
          case 'Preheating': return 'default';
          case 'RUN': return 'default';
          case 'Cooling': return 'outline';
          case 'Error': return 'destructive';
          case 'MAINT': return 'default'; // Example variant for MAINT
          default: return 'secondary';
      }
  }


  const renderOvenCard = (ovenId: 'oven1' | 'oven2') => {
    const oven = ovens[ovenId];
    const ovenLimits = limits[ovenId];
    // Name is now primarily from Zustand store, populated by OVEN:config
    const customOvenName = oven.name || (isDualMode ? (ovenId === 'oven1' ? t('oven1') : t('oven2')) : t('oven'));


    if (!oven) return null;

    const filteredData = oven.historicalData?.filter(d => {
        const timestamp = new Date(d.timestamp);
        const from = dateRange?.from ? new Date(dateRange.from.setHours(0,0,0,0)) : undefined;
        const to = dateRange?.to ? new Date(dateRange.to.setHours(23,59,59,999)): undefined;
        if (!from || !to) return true;
        return timestamp >= from && timestamp <= to;
    }) || [];

    const translatedState = stateTranslations[oven.state as keyof typeof stateTranslations] || oven.state;

    return (
      <Card key={ovenId} className="flex flex-col">
        <CardHeader>
          <CardTitle>{customOvenName}</CardTitle>
           <CardDescription>
             <Badge variant={getStateBadgeVariant(oven.state)} className="capitalize">{translatedState}</Badge>
           </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 flex-grow">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('temperature')}</p>
                <p className="text-lg font-semibold">
                  {oven.temperature !== null ? `${oven.temperature}${t('temperatureUnit')}` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Droplet className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">{t('humidity')}</p>
                <p className="text-lg font-semibold">
                  {oven.humidity !== null ? `${oven.humidity}${t('humidityUnit')}` : 'N/A'}
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

   if (isLoading && !_hasHydrated) { // Show loading if either initial hydration or data fetch is pending
    return <div className="flex justify-center items-center h-64"><Loader className="w-8 h-8 animate-spin" /> {t('loading')}</div>;
   }


  return (
    <div className="space-y-6 w-full"> {/* Ensure full width */}
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
           isDualMode
             ? 'grid-cols-1 lg:grid-cols-2'
             : 'grid-cols-1 w-full' // Ensure single oven card takes full width available in its container
         )}
       >
         {renderOvenCard('oven1')}
         {isDualMode && renderOvenCard('oven2')}
      </div>
    </div>
  );
}
