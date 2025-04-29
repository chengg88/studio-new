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

  // Initialize form with store data
  useEffect(() => {
    initializeStore(); // Ensure store is loaded
    reset({
      isDualMode: isDualMode,
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

   // Update store when dual mode switch changes
   useEffect(() => {
    setDualMode(currentIsDualMode);
     // When switching from dual to single, ensure oven2 data isn't accidentally saved if form isn't submitted
     if (!currentIsDualMode) {
       // Reset oven2 form data to stored state or defaults when switching off dual mode
       // This prevents stale form data from being unintentionally saved later
       setValue('oven2', {
           name: ovens.oven2.name || '',
           temperatureSetpoint: ovens.oven2.temperatureSetpoint ?? 100,
           programSchedule: ovens.oven2.programSchedule || '',
           calibrationPoints: ovens.oven2.calibrationPoints || [],
       });
     }
   }, [currentIsDualMode, setDualMode, setValue, ovens.oven2]);


  const onSubmit = (data: SettingsFormData) => {
    try {
      updateOvenSettings('oven1', data.oven1);
      // Only update oven2 settings if in dual mode and oven2 data exists
      if (data.isDualMode && data.oven2) {
        updateOvenSettings('oven2', data.oven2);
      }
      // No need to explicitly clear oven2 settings here,
      // the `partialize` function in the store handles what gets persisted.
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
                      onCheckedChange={field.onChange}
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
                currentIsDualMode={currentIsDualMode}
                toast={toast}
            />
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
