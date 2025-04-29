
'use client';

import React from 'react';
import type { Control } from 'react-hook-form';
// import { useFieldArray } from 'react-hook-form'; // Removed useFieldArray
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
// import { Trash2 } from 'lucide-react'; // Removed Trash2 import
// import { Button } from '@/components/ui/button'; // Removed Button import if only used for calibration
import type { SettingsFormData } from './settings';
// import type { useToast } from '@/hooks/use-toast'; // Removed useToast if only used for calibration

interface OvenSettingsFormProps {
  ovenId: 'oven1' | 'oven2';
  control: Control<SettingsFormData>; // Pass control from the parent form
  currentIsDualMode: boolean;
  // toast: ReturnType<typeof useToast>['toast']; // Removed toast prop if only used for calibration
}

export default function OvenSettingsForm({
  ovenId,
  control,
  currentIsDualMode,
  // toast, // Removed toast prop
}: OvenSettingsFormProps) {
  // useFieldArray is removed as calibration is removed
  // const { fields, append, remove } = useFieldArray({
  //   control,
  //   name: `${ovenId}.calibrationPoints`,
  // });

  // Removed handleAddPoint function
  // const handleAddPoint = () => {
  //   if (fields.length < 4) {
  //     append({ setpoint: 0, actual: 0 });
  //   } else {
  //     toast({
  //       title: 'Calibration Limit Reached',
  //       description: 'You can only add up to 4 calibration points.',
  //       variant: 'destructive',
  //     });
  //   }
  // };

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

        {/* Temperature Setpoint - Keep as before */}
        <FormField
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
        />

        {/* Program Schedule - Keep as before */}
        <FormField
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
        />

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

        {/* Temperature Calibration - Removed */}
        {/* <Separator />
        <div>
          <h4 className="text-md font-semibold mb-2">
            Temperature Calibration
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add up to four points for calibration. Enter the temperature you set
            (Setpoint) and the actual measured temperature (Actual).
          </p>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2 mb-2">
              <FormField
                control={control}
                name={`${ovenId}.calibrationPoints.${index}.setpoint`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">
                      Setpoint {index + 1}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Setpoint °C"
                        {...field}
                        disabled={isOven2Disabled}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${ovenId}.calibrationPoints.${index}.actual`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">
                      Actual {index + 1}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Actual °C" {...field} disabled={isOven2Disabled} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Remove calibration point"
                disabled={isOven2Disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPoint}
            disabled={fields.length >= 4 || isOven2Disabled}
          >
            Add Calibration Point
          </Button>
        </div> */}
      </CardContent>
    </Card>
  );
}

