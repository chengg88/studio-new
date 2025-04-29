
'use client';

import React from 'react';
import type { Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { SettingsFormData } from './settings';

interface OvenSettingsFormProps {
  ovenId: 'oven1' | 'oven2';
  control: Control<SettingsFormData>; // Pass control from the parent form
  currentIsDualMode: boolean;
}

export default function OvenSettingsForm({
  ovenId,
  control,
  currentIsDualMode,
}: OvenSettingsFormProps) {

  const isOven2Disabled = !currentIsDualMode && ovenId === 'oven2';

  return (
    <Card className={isOven2Disabled ? 'opacity-50 pointer-events-none' : ''}>
      <CardHeader>
        <CardTitle>
          {currentIsDualMode
            ? ovenId === 'oven1'
              ? 'Oven 1 Settings'
              : 'Oven 2 Settings'
            : 'Oven Settings'}
        </CardTitle>
        <CardDescription>
          Configure the parameters for{' '}
          {currentIsDualMode ? `oven ${ovenId.slice(-1)}` : 'your oven'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name={`${ovenId}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Oven Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Main Bake Oven" {...field} disabled={isOven2Disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Temperature Setpoint - Removed */}
        {/* <FormField
          control={control}
          name={`${ovenId}.temperatureSetpoint`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temperature Setpoint (°C)</FormLabel>
              <FormControl>
                <Input type="number" {...field} disabled={isOven2Disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        {/* Program Schedule - Removed */}
        {/* <FormField
          control={control}
          name={`${ovenId}.programSchedule`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program Schedule (Cron Expression)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 0 8 * * 1-5" {...field} disabled={isOven2Disabled} />
              </FormControl>
              <FormDescription>
                Enter a cron expression to schedule programs. Leave blank for
                manual operation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        /> */}

         {/* Temperature Offsets */}
         <Separator />
         <div>
           <h4 className="text-md font-semibold mb-2">Temperature Offsets</h4>
           <div className="grid grid-cols-2 gap-4">
             {[1, 2, 3, 4].map((index) => (
               <FormField
                 key={index}
                 control={control}
                 name={`${ovenId}.offset${index}` as const} // Use 'as const' for type safety
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Offset {index}</FormLabel>
                     <FormControl>
                       <Input type="number" placeholder="Offset °C" {...field} value={field.value || 0} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} disabled={isOven2Disabled} />
                     </FormControl>
                     <FormMessage className="text-xs" />
                   </FormItem>
                 )}
               />
             ))}
           </div>
         </div>
      </CardContent>
    </Card>
  );
}
