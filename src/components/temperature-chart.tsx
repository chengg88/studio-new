'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface TemperatureDataPoint {
  timestamp: string; // ISO string format
  temperature: number | null;
}

interface TemperatureChartProps {
  data: TemperatureDataPoint[];
  upperLimit?: number;
  lowerLimit?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const formattedDate = format(date, 'PPpp'); // Format date and time nicely
    return (
      <div className="bg-background border border-border p-2 rounded shadow-md">
        <p className="label text-sm text-muted-foreground">{`${formattedDate}`}</p>
        <p className="intro text-base font-semibold">{`Temperature: ${payload[0].value}°C`}</p>
      </div>
    );
  }

  return null;
};


export default function TemperatureChart({
  data,
  upperLimit,
  lowerLimit,
}: TemperatureChartProps) {

  const formattedData = data.map(item => ({
    ...item,
    // Format timestamp for XAxis display (e.g., 'MMM dd HH:mm')
    // Recharts automatically handles Date objects well for tooltips if timestamp is passed as epoch or parsable string
    timeLabel: format(new Date(item.timestamp), 'MMM dd HH:mm'),
    // Ensure temperature is a number for the chart
    temperature: item.temperature === null ? undefined : item.temperature
  })).filter(item => item.temperature !== undefined); // Filter out null temperature points


  const yDomain: [number | string, number | string] = ['auto', 'auto'];
  if (lowerLimit !== undefined) yDomain[0] = Math.min(data.reduce((min, p) => Math.min(min, p.temperature ?? Infinity), Infinity), lowerLimit) - 10;
  if (upperLimit !== undefined) yDomain[1] = Math.max(data.reduce((max, p) => Math.max(max, p.temperature ?? -Infinity), -Infinity), upperLimit) + 10;
   // Add padding if limits aren't defined
  if (lowerLimit === undefined && data.length > 0) yDomain[0] = data.reduce((min, p) => Math.min(min, p.temperature ?? Infinity), Infinity) - 10;
  if (upperLimit === undefined && data.length > 0) yDomain[1] = data.reduce((max, p) => Math.max(max, p.temperature ?? -Infinity), -Infinity) + 10;


   // Ensure domain minimum is not excessively low if data minimum is close to 0 or negative
    if (typeof yDomain[0] === 'number') {
        yDomain[0] = Math.min(yDomain[0], 40); // Don't let Y axis start too far below typical lower limits
    }
     // Ensure domain maximum is not excessively high if data maximum is close to 0
    if (typeof yDomain[1] === 'number') {
        yDomain[1] = Math.max(yDomain[1], 100); // Ensure y axis goes up to at least 100
    }


  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={formattedData}
        margin={{
          top: 5,
          right: 10, // Adjusted margin
          left: -15, // Adjusted margin
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="timestamp" // Use the original timestamp for correct time scaling
          tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')} // Format tick label
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          // Consider adding interval="preserveStartEnd" or dynamic interval based on data density
           // interval={Math.max(0, Math.floor(formattedData.length / 10) -1)} // Show ~10 ticks max
           minTickGap={30} // Minimum px gap between ticks
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}°C`}
          domain={yDomain}
          allowDataOverflow={true} // Prevent lines going outside plot area if limits are tight
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1, strokeDasharray: "3 3" }} />
        <Legend verticalAlign="top" height={36}/>
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="hsl(var(--chart-1))" // Use primary color (blue)
          strokeWidth={2}
          dot={false}
          name="Temperature"
          activeDot={{r: 6, strokeWidth: 1, fill: 'hsl(var(--primary))'}}
          isAnimationActive={true}
          animationDuration={300}

        />
        {upperLimit !== undefined && (
          <ReferenceLine
            y={upperLimit}
            label={{ value: `Max: ${upperLimit}°C`, position: 'insideTopRight', fill: 'hsl(var(--destructive))', fontSize: 10 }}
            stroke="hsl(var(--destructive))"
            strokeDasharray="3 3"
          />
        )}
        {lowerLimit !== undefined && (
          <ReferenceLine
            y={lowerLimit}
            label={{ value: `Min: ${lowerLimit}°C`, position: 'insideBottomRight', fill: 'hsl(var(--primary))', fontSize: 10 }}
            stroke="hsl(var(--primary))"
            strokeDasharray="3 3"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
