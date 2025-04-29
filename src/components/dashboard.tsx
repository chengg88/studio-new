
'use client';

import React, {useEffect, useState} from 'react';
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
import {useOvenStore, type OvenData, type OvenState} from '@/store/oven-store';
import {getTemperatureLimits, type TemperatureLimits} from '@/services/mes';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import DateRangePicker from './date-range-picker';
import type {DateRange} from 'react-day-picker';
import {subDays} from 'date-fns';
import { cn } from '@/lib/utils'; // Import cn utility

// Mock function to fetch oven data (replace with actual API call)
async function fetchOvenData(ovenId: string): Promise<Partial<OvenData>> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate potential alerts
  const possibleAlerts = ['High Temperature', 'Door Open', 'Fan Failure'];
  const alerts = Math.random() > 0.7 ? [possibleAlerts[Math.floor(Math.random() * possibleAlerts.length)]] : [];


  // Simulate oven states
  const states: OvenState[] = ['Idle', 'Preheating', 'Running', 'Cooling', 'Error'];
  const randomState = states[Math.floor(Math.random() * states.length)];

  // Generate more realistic temperature data based on state
  let temperature = 25;
  let humidity = 40;
  if (randomState === 'Preheating') {
    temperature = Math.random() * 100 + 50; // 50-150
    humidity = Math.random() * 10 + 30; // 30-40
  } else if (randomState === 'Running') {
    temperature = Math.random() * 50 + 180; // 180-230
    humidity = Math.random() * 10 + 10; // 10-20
  } else if (randomState === 'Cooling') {
     temperature = Math.random() * 80 + 50; // 50-130
     humidity = Math.random() * 20 + 40; // 40-60
  } else if (randomState === 'Error') {
    temperature = Math.random() * 300; // Can be anything in error state
    humidity = Math.random() * 100;
  }


  // Simulate Active Program
  const activeProgram = randomState === 'Running' ? `Program ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}` : 'None';


  return {
    temperature: parseFloat(temperature.toFixed(1)),
    humidity: parseFloat(humidity.toFixed(1)),
    activeProgram: activeProgram,
    state: randomState,
    alerts: randomState === 'Error' ? ['System Malfunction', ...alerts] : alerts,
    historicalData: Array.from({length: 30}, (_, i) => ({
      timestamp: subDays(new Date(), i).toISOString(),
      temperature: Math.max(50, Math.random() * 250 + Math.sin(i/5)*20), // Example dynamic data
    })).reverse()
  };
}

function getStateIcon(state: OvenState) {
  switch (state) {
    case 'Idle':
      return <PowerOff className="w-5 h-5 text-muted-foreground" />;
    case 'Preheating':
      return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
    case 'Running':
      return <PlayCircle className="w-5 h-5 text-accent" />;
    case 'Cooling':
      return <PauseCircle className="w-5 h-5 text-blue-500" />;
    case 'Error':
      return <AlertCircle className="w-5 h-5 text-destructive" />;
    default:
      return <Settings className="w-5 h-5 text-muted-foreground" />;
  }
}

function getStateBadgeVariant(state: OvenState): "default" | "secondary" | "destructive" | "outline" {
    switch (state) {
        case 'Idle': return 'secondary';
        case 'Preheating': return 'default'; // Use primary color (blue)
        case 'Running': return 'default'; // Use accent color (teal) - Requires custom variant or using 'default' and hoping it matches theme
        case 'Cooling': return 'outline'; // Using outline might provide distinction
        case 'Error': return 'destructive';
        default: return 'secondary';
    }
}


export default function Dashboard() {
  const {ovens, isDualMode, updateOvenData, initializeStore} = useOvenStore();
  const [isLoading, setIsLoading] = useState(true);
  const [limits, setLimits] = useState<{[key: string]: TemperatureLimits}>({});
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    initializeStore(); // Load settings from local storage
    setIsLoading(false); // Assume store initialization is fast
  }, [initializeStore]);

  useEffect(() => {
    if (isLoading) return; // Don't fetch if store hasn't initialized

    const fetchData = async () => {
      try {
        const ovenIdsToFetch = isDualMode ? ['oven1', 'oven2'] : ['oven1'];
        const dataPromises = ovenIdsToFetch.map(id => fetchOvenData(id));
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
        // Handle error state in UI if needed
      }
    };

    fetchData(); // Initial fetch

    const intervalId = setInterval(fetchData, 5000); // Refresh data every 5 seconds

    return () => clearInterval(intervalId);
  }, [isDualMode, updateOvenData, isLoading]);


  const renderOvenCard = (ovenId: 'oven1' | 'oven2') => {
    const oven = ovens[ovenId];
    const ovenLimits = limits[ovenId];
    const ovenName = isDualMode ? (ovenId === 'oven1' ? oven.name || 'Oven 1' : oven.name || 'Oven 2') : (oven.name || 'Oven');

    if (!oven) return null; // Should not happen if initialized

    const filteredData = oven.historicalData?.filter(d => {
        const timestamp = new Date(d.timestamp);
        const from = dateRange?.from ? new Date(dateRange.from.setHours(0,0,0,0)) : undefined;
        const to = dateRange?.to ? new Date(dateRange.to.setHours(23,59,59,999)): undefined;
        if (!from || !to) return true; // Show all if no range selected
        return timestamp >= from && timestamp <= to;
    }) || [];

    return (
      <Card key={ovenId} className="flex flex-col">
        <CardHeader>
          <CardTitle>{ovenName}</CardTitle>
           <CardDescription>
             <Badge variant={getStateBadgeVariant(oven.state)} className="capitalize">{oven.state}</Badge>
           </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 flex-grow">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className="text-lg font-semibold">
                  {oven.temperature !== null ? `${oven.temperature}°C` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Droplet className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Humidity</p>
                <p className="text-lg font-semibold">
                  {oven.humidity !== null ? `${oven.humidity}%` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStateIcon(oven.state)}
              <div>
                <p className="text-sm text-muted-foreground">State</p>
                <p className="text-lg font-semibold capitalize">{oven.state}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
               <div>
                <p className="text-sm text-muted-foreground">Active Program</p>
                <p className="text-lg font-semibold">{oven.activeProgram || 'None'}</p>
              </div>
            </div>
          </div>

          {oven.alerts && oven.alerts.length > 0 && (
             <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Alerts</AlertTitle>
               <AlertDescription>
                 {oven.alerts.join(', ')}
               </AlertDescription>
             </Alert>
           )}


          <Card className="mt-4 flex-grow">
            <CardHeader>
                <CardTitle>Temperature History</CardTitle>
                 <CardDescription>
                    Showing data from {dateRange?.from ? dateRange.from.toLocaleDateString() : '...'} to {dateRange?.to ? dateRange.to.toLocaleDateString() : '...'}
                 </CardDescription>
            </CardHeader>
            <CardContent className="h-64 sm:h-80">
              <TemperatureChart
                data={filteredData}
                upperLimit={ovenLimits?.upperLimitCelsius}
                lowerLimit={ovenLimits?.lowerLimitCelsius}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  };

   if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader className="w-8 h-8 animate-spin" /> Loading...</div>;
   }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Oven Status</h2>
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </div>
       {/* Adjust grid layout based on isDualMode */}
       <div
         className={cn(
           'grid gap-6',
           isDualMode
             ? 'grid-cols-1 lg:grid-cols-2' // 2 columns for dual mode on large screens
             : 'grid-cols-1 md:grid-cols-[minmax(0,_800px)] justify-center' // Single centered column with max-width for single mode
         )}
       >
         {renderOvenCard('oven1')}
         {isDualMode && renderOvenCard('oven2')}
      </div>
    </div>
  );
}

