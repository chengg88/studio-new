
'use client';

import React, {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useOvenStore,
  type OvenTypeOption,
  type SelectOnOff,
  type AutoTrackoutOption,
  type A1019PinValue,
  type OvenSettings as OvenSettingsData, // Rename store type to avoid conflict
} from '@/store/oven-store';
import {Button} from '@/components/ui/button';
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
  FormMessage,
} from '@/components/ui/form';
import OvenSettingsForm from './oven-settings-form'; // Keep this for oven-specific parts
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch'; // Import Switch


// Zod schema for validation
const ovenSettingsSchema = z.object({
  name: z.string().min(1, 'Oven name is required').max(50, 'Name too long'),
  // temperatureSetpoint: z.coerce // Removed
  //   .number()
  //   .min(0, 'Setpoint must be positive')
  //   .max(300, 'Setpoint cannot exceed 300°C')
  //   .optional()
  //   .or(z.literal(0))
  //   .or(z.nan()),
  // programSchedule: z.string().optional(), // Removed
  offset1: z.coerce.number().optional().or(z.nan()), // Add offsets
  offset2: z.coerce.number().optional().or(z.nan()),
  offset3: z.coerce.number().optional().or(z.nan()),
  offset4: z.coerce.number().optional().or(z.nan()),
});


// Updated Zod schema for all settings
const settingsSchema = z.object({
  ovenType: z.enum(['1', '2', '3', '4']), // A, B, C, D
  mesServerIp: z.string().ip({ version: "v4", message: "Invalid IP address" }).optional().or(z.literal("")), // Readonly, so optional
  doorDetect: z.enum(['0', '1']),
  autoTrackOut: z.enum(['0', '1', '2']),
  bindMaterialBox: z.enum(['0', '1']),
  buzzerNetworkDetect: z.enum(['0', '1']),
  czA5Rule: z.enum(['0', '1']),
  ignoreTime: z.coerce.number().int().min(0, "Ignore time must be positive"),
  tjKeepingTrackin: z.enum(['0', '1']),
  a1019Pins: z.array(z.enum(['1', '2'])).length(8, "Must provide settings for all 8 pins"),
  oven1: ovenSettingsSchema,
  oven2: ovenSettingsSchema.optional(), // Still optional based on ovenType logic
});


export type SettingsFormData = z.infer<typeof settingsSchema>;
export type OvenSettingsFormData = z.infer<typeof ovenSettingsSchema>;


export default function Settings() {
  const {
    // Destructure all settings and actions from the store
    ovenType: storeOvenType,
    mesServerIp: storeMesIp,
    doorDetect: storeDoorDetect,
    autoTrackOut: storeAutoTrackout,
    bindMaterialBox: storeBindMaterial,
    buzzerNetworkDetect: storeBuzzer,
    czA5Rule: storeCzRule,
    ignoreTime: storeIgnoreTime,
    tjKeepingTrackin: storeTjKeep,
    a1019Pins: storePins,
    ovens,
    setOvenType,
    updateGeneralSettings,
    updateOvenSettings,
    initializeStore,
    _hasHydrated // Use hydration status
  } = useOvenStore();
  const {toast} = useToast();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    // Default values should reflect the initial state structure
    defaultValues: {
      ovenType: '3',
      mesServerIp: '',
      doorDetect: '0',
      autoTrackOut: '0',
      bindMaterialBox: '0',
      buzzerNetworkDetect: '0',
      czA5Rule: '0',
      ignoreTime: 20,
      tjKeepingTrackin: '0',
      a1019Pins: Array(8).fill('1'),
      oven1: {
        name: '',
        // temperatureSetpoint: 100, // Removed
        // programSchedule: '', // Removed
        offset1: 0, // Initialize offsets
        offset2: 0,
        offset3: 0,
        offset4: 0,
      },
      oven2: {
        name: '',
        // temperatureSetpoint: 100, // Removed
        // programSchedule: '', // Removed
        offset1: 0, // Initialize offsets
        offset2: 0,
        offset3: 0,
        offset4: 0,
      },
    },
  });

  const { control, handleSubmit, reset, watch, setValue } = form;
  const currentOvenType = watch('ovenType');
  const currentIsDualMode = currentOvenType === '1' || currentOvenType === '2'; // Determine dual mode from oven type

  // Initialize form with store data only after hydration
   useEffect(() => {
    if (!_hasHydrated) {
       initializeStore(); // Ensure store attempts hydration if not already done
       return; // Exit if not hydrated yet
    }
    reset({
      ovenType: storeOvenType,
      mesServerIp: storeMesIp,
      doorDetect: storeDoorDetect,
      autoTrackOut: storeAutoTrackout,
      bindMaterialBox: storeBindMaterial,
      buzzerNetworkDetect: storeBuzzer,
      czA5Rule: storeCzRule,
      ignoreTime: storeIgnoreTime,
      tjKeepingTrackin: storeTjKeep,
      a1019Pins: storePins,
      oven1: {
        name: ovens.oven1.name || '',
        // temperatureSetpoint: ovens.oven1.temperatureSetpoint ?? 100, // Removed
        // programSchedule: ovens.oven1.programSchedule || '', // Removed
        offset1: ovens.oven1.offsets?.[0] ?? 0, // Map stored offsets
        offset2: ovens.oven1.offsets?.[1] ?? 0,
        offset3: ovens.oven1.offsets?.[2] ?? 0,
        offset4: ovens.oven1.offsets?.[3] ?? 0,
      },
      oven2: {
        name: ovens.oven2.name || '',
        // temperatureSetpoint: ovens.oven2.temperatureSetpoint ?? 100, // Removed
        // programSchedule: ovens.oven2.programSchedule || '', // Removed
        offset1: ovens.oven2.offsets?.[0] ?? 0, // Map stored offsets
        offset2: ovens.oven2.offsets?.[1] ?? 0,
        offset3: ovens.oven2.offsets?.[2] ?? 0,
        offset4: ovens.oven2.offsets?.[3] ?? 0,
      },
    });
  }, [_hasHydrated, storeOvenType, storeMesIp, storeDoorDetect, storeAutoTrackout, storeBindMaterial, storeBuzzer, storeCzRule, storeIgnoreTime, storeTjKeep, storePins, ovens, reset, initializeStore]);


  // Disable Oven 2 Name input based on ovenType
  useEffect(() => {
      const disableOven2 = currentOvenType === '3' || currentOvenType === '4';
       // Check if the field exists before trying to set disabled property
      const oven2NameInput = document.getElementById('oven2.name'); // Assuming you give the input an ID
       if (oven2NameInput) {
          // Potential issue: RHF might control disabled state better
          // Consider using RHF's 'disabled' prop in FormField if this causes issues
          // (oven2NameInput as HTMLInputElement).disabled = disableOven2;
       }
       // RHF way (preferred if OvenSettingsForm uses RHF field props)
       // You might need to pass 'disabled' prop down to OvenSettingsForm and apply it to the Input
  }, [currentOvenType]);

  const onSubmit = (data: SettingsFormData) => {
    try {
       // Update oven type which also updates isDualMode internally
       setOvenType(data.ovenType as OvenTypeOption);

      // Update general settings
      updateGeneralSettings({
        // mesServerIp is read-only, don't update it from form
        doorDetect: data.doorDetect as SelectOnOff,
        autoTrackOut: data.autoTrackOut as AutoTrackoutOption,
        bindMaterialBox: data.bindMaterialBox as SelectOnOff,
        buzzerNetworkDetect: data.buzzerNetworkDetect as SelectOnOff,
        czA5Rule: data.czA5Rule as SelectOnOff,
        ignoreTime: data.ignoreTime,
        tjKeepingTrackin: data.tjKeepingTrackin as SelectOnOff,
        a1019Pins: data.a1019Pins as A1019PinValue[],
      });


      // Update settings for oven1
      const oven1Settings: Partial<OvenSettingsData> = { // Use Partial<OvenSettingsData> from store
        name: data.oven1.name,
        // temperatureSetpoint: data.oven1.temperatureSetpoint, // Removed
        // programSchedule: data.oven1.programSchedule, // Removed
        offsets: [ // Map form offsets to store format
          data.oven1.offset1 ?? 0,
          data.oven1.offset2 ?? 0,
          data.oven1.offset3 ?? 0,
          data.oven1.offset4 ?? 0,
        ]
      };
      updateOvenSettings('oven1', oven1Settings);


      // Update settings for oven2 only if in dual mode according to ovenType
      if ((data.ovenType === '1' || data.ovenType === '2') && data.oven2) {
         const oven2Settings: Partial<OvenSettingsData> = { // Use Partial<OvenSettingsData> from store
            name: data.oven2.name,
            // temperatureSetpoint: data.oven2.temperatureSetpoint, // Removed
            // programSchedule: data.oven2.programSchedule, // Removed
            offsets: [ // Map form offsets to store format
              data.oven2.offset1 ?? 0,
              data.oven2.offset2 ?? 0,
              data.oven2.offset3 ?? 0,
              data.oven2.offset4 ?? 0,
            ]
          };
        updateOvenSettings('oven2', oven2Settings);
      }

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


  // Render loading state if not hydrated
  if (!_hasHydrated) {
      return <div>Loading settings...</div>;
  }


  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

         {/* Oven Type Selection */}
         <Card>
            <CardHeader>
                <CardTitle>Oven Configuration</CardTitle>
                <CardDescription>Select the type of oven configuration.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                control={control}
                name="ovenType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormControl>
                        <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          // When changing oven type, ensure Oven 2 pin assignments are reset if needed
                          if (value === '3' || value === '4') {
                              const currentPins = form.getValues('a1019Pins');
                              const updatedPins = currentPins.map(pin => pin === '2' ? '1' : pin); // Force pins assigned to Oven 2 back to Oven 1
                              setValue('a1019Pins', updatedPins as A1019PinValue[]);
                          }
                         }}
                        value={field.value}
                        className="flex flex-col space-y-1"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="1" />
                            </FormControl>
                            <FormLabel className="font-normal">
                            A. 1 double door oven
                            </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="2" />
                            </FormControl>
                            <FormLabel className="font-normal">
                             B. 2 single door ovens
                            </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                             <RadioGroupItem value="3" />
                            </FormControl>
                            <FormLabel className="font-normal">
                             C. 1 single door oven
                            </FormLabel>
                        </FormItem>
                         <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                             <RadioGroupItem value="4" />
                            </FormControl>
                            <FormLabel className="font-normal">
                             D. ENOHK Oven
                            </FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
        </Card>


        {/* Oven Specific Settings (using existing component) */}
        <div
          className={`grid gap-8 ${
            currentIsDualMode ? 'lg:grid-cols-2' : 'grid-cols-1' // Simplified layout
          }`}
        >
            <OvenSettingsForm
                ovenId="oven1"
                control={control}
                currentIsDualMode={currentIsDualMode} // Pass watched value for conditional rendering
            />
            {/* Conditionally render Oven 2 settings based on the watched value */}
            {currentIsDualMode && (
                 <OvenSettingsForm
                    ovenId="oven2"
                    control={control}
                    currentIsDualMode={currentIsDualMode}
                 />
            )}
        </div>

         {/* A1019 PIN Settings */}
         <Card>
            <CardHeader>
                <CardTitle>A1019 PIN Setting</CardTitle>
                <CardDescription>Assign each A1019 PIN to an Oven.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <FormField
                        key={index}
                        control={control}
                        name={`a1019Pins.${index}`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>PIN[{index}]</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value as A1019PinValue}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Oven" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="1">OVEN 1</SelectItem>
                                    {/* Only show Oven 2 option if dual mode is possible */}
                                    {currentIsDualMode && (
                                      <SelectItem value="2">OVEN 2</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                ))}
            </CardContent>
        </Card>

        {/* Other General Settings */}
        <Card>
             <CardHeader>
                <CardTitle>General Settings</CardTitle>
            </CardHeader>
             <CardContent className="space-y-6">
                 <FormField
                    control={control}
                    name="mesServerIp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>MES Server IP</FormLabel>
                        <FormControl>
                            {/* Make this input read-only */}
                            <Input {...field} readOnly placeholder="MES IP Address" />
                        </FormControl>
                         <FormDescription>This value is read-only.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                 <Separator />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                         control={control}
                         name="doorDetect"
                         render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                                <FormLabel className="text-base">Door Detect</FormLabel>
                             </div>
                             <FormControl>
                                <Switch
                                    checked={field.value === '1'}
                                    onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                                />
                             </FormControl>
                         </FormItem>
                         )}
                     />

                     <FormField
                         control={control}
                         name="bindMaterialBox"
                          render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                                <FormLabel className="text-base">Bind MaterialBox</FormLabel>
                             </div>
                             <FormControl>
                                <Switch
                                    checked={field.value === '1'}
                                    onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                                />
                             </FormControl>
                         </FormItem>
                         )}
                     />

                    <FormField
                         control={control}
                         name="buzzerNetworkDetect"
                         render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                                <FormLabel className="text-base">[Buzzer] Network Detect</FormLabel>
                             </div>
                             <FormControl>
                                <Switch
                                    checked={field.value === '1'}
                                    onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                                />
                             </FormControl>
                         </FormItem>
                         )}
                     />

                     <FormField
                         control={control}
                         name="czA5Rule"
                         render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                                <FormLabel className="text-base">CZ A5 Rule</FormLabel>
                              </div>
                             <FormControl>
                                <Switch
                                    checked={field.value === '1'}
                                    onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                                />
                             </FormControl>
                         </FormItem>
                         )}
                     />

                     <FormField
                         control={control}
                         name="tjKeepingTrackin"
                         render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                                <FormLabel className="text-base">TJ Keeping Trackin</FormLabel>
                              </div>
                             <FormControl>
                                <Switch
                                    checked={field.value === '1'}
                                    onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                                />
                             </FormControl>
                         </FormItem>
                         )}
                     />

                     <FormField
                        control={control}
                        name="ignoreTime"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Ignore Time (seconds)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} value={field.value || 0} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
                            </FormControl>
                             <FormDescription>
                                Time in seconds to ignore certain events or triggers.
                             </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>

                 <Separator />

                 <FormField
                     control={control}
                     name="autoTrackOut"
                     render={({ field }) => (
                         <FormItem>
                         <FormLabel>Auto TrackOUT Rule</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value as AutoTrackoutOption}>
                         <FormControl>
                             <SelectTrigger>
                             <SelectValue placeholder="Select auto trackout rule" />
                             </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                             <SelectItem value="0">0) Disable</SelectItem>
                             <SelectItem value="1">1) All Specs Done</SelectItem>
                             <SelectItem value="2">2) Baking Spec Done</SelectItem>
                         </SelectContent>
                         </Select>
                          <FormDescription>
                             0: Disable auto-trackout. 1: Trigger after all specs complete. 2: Trigger after baking spec completes.
                          </FormDescription>
                         <FormMessage />
                         </FormItem>
                     )}
                 />

             </CardContent>
        </Card>


        {/* Save Button */}
        <Button type="submit">Save Settings</Button>
      </form>
    </Form>
  );
}
