'use client';

import React, {useEffect} from 'react';
import {useForm, Controller, useFieldArray} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {useOvenStore, type CalibrationPoint} from '@/store/oven-store';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {useToast} from '@/hooks/use-toast';
import {Trash2} from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

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

type SettingsFormData = z.infer<typeof settingsSchema>;

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
       setValue('oven2', ovens.oven2); // Reset oven2 form data to stored state or defaults
     }
   }, [currentIsDualMode, setDualMode, setValue, ovens.oven2]);


  const onSubmit = (data: SettingsFormData) => {
    try {
      updateOvenSettings('oven1', data.oven1);
      if (data.isDualMode && data.oven2) {
        updateOvenSettings('oven2', data.oven2);
      } else if (!data.isDualMode) {
         // Optionally clear oven2 settings in store when switching to single mode
         // updateOvenSettings('oven2', { name: '', temperatureSetpoint: null, programSchedule: '', calibrationPoints: [] });
      }
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

  const renderOvenSettingsForm = (ovenId: 'oven1' | 'oven2') => {
     const { fields, append, remove } = useFieldArray({
            control,
            name: `${ovenId}.calibrationPoints`
        });

        const handleAddPoint = () => {
            if (fields.length < 4) {
                append({ setpoint: 0, actual: 0 });
            } else {
                 toast({
                    title: 'Calibration Limit Reached',
                    description: 'You can only add up to 4 calibration points.',
                    variant: 'destructive'
                 })
            }
        };

    return (
      <Card key={ovenId}>
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
            render={({field}) => (
              <FormItem>
                <FormLabel>Oven Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Main Bake Oven" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${ovenId}.temperatureSetpoint`}
            render={({field}) => (
              <FormItem>
                <FormLabel>Temperature Setpoint (°C)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${ovenId}.programSchedule`}
            render={({field}) => (
              <FormItem>
                <FormLabel>Program Schedule (Cron Expression)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 0 8 * * 1-5" {...field} />
                </FormControl>
                <FormDescription>
                  Enter a cron expression to schedule programs. Leave blank for
                  manual operation.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <div>
            <h4 className="text-md font-semibold mb-2">Temperature Calibration</h4>
             <p className="text-sm text-muted-foreground mb-4">
                Add up to four points for calibration. Enter the temperature you set (Setpoint) and the actual measured temperature (Actual).
             </p>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 mb-2">
                <FormField
                  control={control}
                  name={`${ovenId}.calibrationPoints.${index}.setpoint`}
                  render={({field}) => (
                    <FormItem className="flex-1">
                      <FormLabel className="sr-only">Setpoint {index + 1}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Setpoint °C" {...field} />
                      </FormControl>
                       <FormMessage className="text-xs"/>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={control}
                  name={`${ovenId}.calibrationPoints.${index}.actual`}
                  render={({field}) => (
                    <FormItem className="flex-1">
                       <FormLabel className="sr-only">Actual {index + 1}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Actual °C" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs"/>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label="Remove calibration point"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
             <Button type="button" variant="outline" size="sm" onClick={handleAddPoint} disabled={fields.length >= 4}>
                 Add Calibration Point
             </Button>
          </div>
        </CardContent>
      </Card>
    );
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
          {renderOvenSettingsForm('oven1')}
          {currentIsDualMode && renderOvenSettingsForm('oven2')}
        </div>

        <Button type="submit">Save Settings</Button>
      </form>
    </Form>
  );
}
