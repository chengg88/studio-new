
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

interface TemperatureChartTranslations {
    tooltipTemperature: string;
    upperLimitLabel: string;
    lowerLimitLabel: string;
    legendLabel: string;
}

interface TemperatureChartProps {
  data: TemperatureDataPoint[];
  upperLimit?: number;
  lowerLimit?: number;
  translations: TemperatureChartTranslations; // Add translations prop
}

const CustomTooltip = ({ active, payload, label, translations }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const formattedDate = format(date, 'PPpp'); // Format date and time nicely
    return (
      <div className="bg-background border border-border p-2 rounded shadow-md">
        <p className="label text-sm text-muted-foreground">{`${formattedDate}`}</p>
        {/* Use translated label */}
        <p className="intro text-base font-semibold">{`${translations.tooltipTemperature}: ${payload[0].value}°C`}</p>
      </div>
    );
  }

  return null;
};


export default function TemperatureChart({
  data,
  upperLimit,
  lowerLimit,
  translations, // Destructure translations
}: TemperatureChartProps) {

  const formattedData = data.map(item => ({
    ...item,
    timeLabel: format(new Date(item.timestamp), 'MMM dd HH:mm'),
    temperature: item.temperature === null ? undefined : item.temperature
  })).filter(item => item.temperature !== undefined);


  const yDomain: [number | string, number | string] = ['auto', 'auto'];
  if (lowerLimit !== undefined) yDomain[0] = Math.min(data.reduce((min, p) => Math.min(min, p.temperature ?? Infinity), Infinity), lowerLimit) - 10;
  if (upperLimit !== undefined) yDomain[1] = Math.max(data.reduce((max, p) => Math.max(max, p.temperature ?? -Infinity), -Infinity), upperLimit) + 10;
  if (lowerLimit === undefined && data.length > 0) yDomain[0] = data.reduce((min, p) => Math.min(min, p.temperature ?? Infinity), Infinity) - 10;
  if (upperLimit === undefined && data.length > 0) yDomain[1] = data.reduce((max, p) => Math.max(max, p.temperature ?? -Infinity), -Infinity) + 10;

    if (typeof yDomain[0] === 'number') {
        yDomain[0] = Math.min(yDomain[0], 40);
    }
    if (typeof yDomain[1] === 'number') {
        yDomain[1] = Math.max(yDomain[1], 100);
    }


  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={formattedData}
        margin={{
          top: 5,
          right: 10,
          left: -15,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
           minTickGap={30}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}°C`}
          domain={yDomain}
          allowDataOverflow={true}
        />
        {/* Pass translations to CustomTooltip */}
        <Tooltip content={<CustomTooltip translations={translations} />} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1, strokeDasharray: "3 3" }} />
        <Legend verticalAlign="top" height={36}/>
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={false}
          name={translations.legendLabel} // Use translated legend label
          activeDot={{r: 6, strokeWidth: 1, fill: 'hsl(var(--primary))'}}
          isAnimationActive={true}
          animationDuration={300}

        />
        {upperLimit !== undefined && (
          <ReferenceLine
            y={upperLimit}
             // Use translated label
            label={{ value: translations.upperLimitLabel, position: 'insideTopRight', fill: 'hsl(var(--destructive))', fontSize: 10 }}
            stroke="hsl(var(--destructive))"
            strokeDasharray="3 3"
          />
        )}
        {lowerLimit !== undefined && (
          <ReferenceLine
            y={lowerLimit}
            // Use translated label
            label={{ value: translations.lowerLimitLabel, position: 'insideBottomRight', fill: 'hsl(var(--primary))', fontSize: 10 }}
            stroke="hsl(var(--primary))"
            strokeDasharray="3 3"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
