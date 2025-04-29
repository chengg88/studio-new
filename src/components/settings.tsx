'use client';

import React, {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {useOvenStore, type CalibrationPoint} from '@/store/oven-store';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {useToast} from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import OvenSettingsForm from './oven-settings-form'; // Import the new component

// Zod schema for validation
const calibrationPointSchema = z.object({
  setpoint: z.coerce.number().min(-50, "Setpoint must be at least -50").max(350, "Setpoint must be at most 350"),
  actual: z.coerce.number().min(-50, "Actual must be at least -50").max(350, "Actual must be at most 350"),
});

const ovenSettingsSchema = z.object({
  name: z.string().min(1, 'Oven name is required').max(50, 'Name too long'),
  temperatureSetpoint: z.coerce
    .number()
    .min(0, 'Setpoint must be positive')
    .max(300, 'Setpoint cannot exceed 300°C'),
  programSchedule: z.string().optional(), // Basic validation for now
  calibrationPoints: z
    .array(calibrationPointSchema)
    .max(4, 'Maximum of 4 calibration points')
    .optional(),
});

const settingsSchema = z.object({
  isDualMode: z.boolean(),
  oven1: ovenSettingsSchema,
  oven2: ovenSettingsSchema.optional(), // Optional if not dual mode
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
export type OvenSettingsFormData = z.infer<typeof ovenSettingsSchema>;


export default function Settings() {
  const {
    isDualMode,
    ovens,
    setDualMode,
    updateOvenSettings,
    initializeStore,
  } = useOvenStore();
  const {toast} = useToast();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      isDualMode: false,
      oven1: {
        name: '',
        temperatureSetpoint: 100,
        programSchedule: '',
        calibrationPoints: [],
      },
      oven2: {
        name: '',
        temperatureSetpoint: 100,
        programSchedule: '',
        calibrationPoints: [],
      },
    },
  });

  const { control, handleSubmit, reset, watch, setValue } = form;
  const currentIsDualMode = watch('isDualMode');

  // Initialize form with store data when the component mounts or store data changes
  useEffect(() => {
    initializeStore(); // Ensure store is loaded/hydrated
    reset({
      isDualMode: isDualMode, // Use the value from the store as the default/reset value
      oven1: {
        name: ovens.oven1.name || '',
        temperatureSetpoint: ovens.oven1.temperatureSetpoint ?? 100,
        programSchedule: ovens.oven1.programSchedule || '',
        calibrationPoints: ovens.oven1.calibrationPoints || [],
      },
      oven2: {
        name: ovens.oven2.name || '',
        temperatureSetpoint: ovens.oven2.temperatureSetpoint ?? 100,
        programSchedule: ovens.oven2.programSchedule || '',
        calibrationPoints: ovens.oven2.calibrationPoints || [],
      },
    });
  }, [isDualMode, ovens, reset, initializeStore]);

  // This effect was causing the infinite loop.
  // The store's dual mode should only be updated on successful submission.
  // The form's 'isDualMode' (watched by currentIsDualMode) handles the visual state during editing.
  // useEffect(() => {
  //   setDualMode(currentIsDualMode); // Problematic: updates store on every watch change
  //   if (!currentIsDualMode) {
  //     setValue('oven2', { /* ... reset oven2 form fields ... */ });
  //   }
  // }, [currentIsDualMode, setDualMode, setValue, ovens.oven2]);


  const onSubmit = (data: SettingsFormData) => {
    try {
      // Update settings for oven1
      updateOvenSettings('oven1', data.oven1);

      // Update settings for oven2 only if in dual mode
      if (data.isDualMode && data.oven2) {
        updateOvenSettings('oven2', data.oven2);
      }
      // else {
        // Optional: Explicitly clear oven2 settings in the store if switching *off* dual mode
        // updateOvenSettings('oven2', { name: '', temperatureSetpoint: 100, programSchedule: '', calibrationPoints: [] });
      // }

      // Update the dual mode setting in the store *after* successful submission
      setDualMode(data.isDualMode);

      toast({
        title: 'Settings Saved',
        description: 'Your oven configurations have been updated.',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error Saving Settings',
        description: 'Could not save your oven configurations. Please try again.',
        variant: 'destructive',
      });
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={control}
              name="isDualMode"
              render={({field}) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Dual Oven Mode</FormLabel>
                    <FormDescription>
                      Enable this if you have a dual-door oven configuration.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange} // RHF handles the switch state internally
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div
          className={`grid gap-8 ${
            currentIsDualMode ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
          }`}
        >
            <OvenSettingsForm
                ovenId="oven1"
                control={control}
                currentIsDualMode={currentIsDualMode} // Pass watched value for conditional rendering
                toast={toast}
            />
            {/* Conditionally render Oven 2 settings based on the watched value */}
            {currentIsDualMode && (
                 <OvenSettingsForm
                    ovenId="oven2"
                    control={control}
                    currentIsDualMode={currentIsDualMode}
                    toast={toast}
                />
            )}
        </div>

        <Button type="submit">Save Settings</Button>
      </form>
    </Form>
  );
}
