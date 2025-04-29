
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
  type OvenSettings as OvenSettingsData,
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
import OvenSettingsForm from './oven-settings-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {useTranslations} from 'next-intl'; // Import useTranslations

// Zod schema for validation (remains the same, validation logic doesn't need translation)
const ovenSettingsSchema = z.object({
  name: z.string().min(1, 'ovenNameRequired').max(50, 'ovenNameTooLong'), // Use keys for error messages
  offset1: z.coerce.number().optional().or(z.nan()),
  offset2: z.coerce.number().optional().or(z.nan()),
  offset3: z.coerce.number().optional().or(z.nan()),
  offset4: z.coerce.number().optional().or(z.nan()),
});

const settingsSchema = z.object({
  ovenType: z.enum(['1', '2', '3', '4']),
  mesServerIp: z.string().ip({ version: "v4", message: "mesIpInvalid" }).optional().or(z.literal("")),
  doorDetect: z.enum(['0', '1']),
  autoTrackOut: z.enum(['0', '1', '2']),
  bindMaterialBox: z.enum(['0', '1']),
  buzzerNetworkDetect: z.enum(['0', '1']),
  czA5Rule: z.enum(['0', '1']),
  ignoreTime: z.coerce.number().int().min(0, "ignoreTimePositive"),
  tjKeepingTrackin: z.enum(['0', '1']),
  a1019Pins: z.array(z.enum(['1', '2'])).length(8, "Must provide settings for all 8 pins"), // No easy way to translate length error
  oven1: ovenSettingsSchema,
  oven2: ovenSettingsSchema.optional(),
});


export type SettingsFormData = z.infer<typeof settingsSchema>;
export type OvenSettingsFormData = z.infer<typeof ovenSettingsSchema>;


export default function Settings() {
  const t = useTranslations('Settings'); // Initialize translations
  const {
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
    _hasHydrated
  } = useOvenStore();
  const {toast} = useToast();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema, {
        // Use t function to translate error messages from keys
        // This requires zod v3.23+ for async resolvers or custom error maps
        // For simplicity here, we'll keep the keys and translate them in the UI where FormMessage is used
    }),
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
      oven1: { name: '', offset1: 0, offset2: 0, offset3: 0, offset4: 0 },
      oven2: { name: '', offset1: 0, offset2: 0, offset3: 0, offset4: 0 },
    },
  });

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = form;
  const currentOvenType = watch('ovenType');
  const currentIsDualMode = currentOvenType === '1' || currentOvenType === '2';

   useEffect(() => {
    if (!_hasHydrated) {
       initializeStore();
       return;
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
        offset1: ovens.oven1.offsets?.[0] ?? 0,
        offset2: ovens.oven1.offsets?.[1] ?? 0,
        offset3: ovens.oven1.offsets?.[2] ?? 0,
        offset4: ovens.oven1.offsets?.[3] ?? 0,
      },
      oven2: {
        name: ovens.oven2.name || '',
        offset1: ovens.oven2.offsets?.[0] ?? 0,
        offset2: ovens.oven2.offsets?.[1] ?? 0,
        offset3: ovens.oven2.offsets?.[2] ?? 0,
        offset4: ovens.oven2.offsets?.[3] ?? 0,
      },
    });
  }, [_hasHydrated, storeOvenType, storeMesIp, storeDoorDetect, storeAutoTrackout, storeBindMaterial, storeBuzzer, storeCzRule, storeIgnoreTime, storeTjKeep, storePins, ovens, reset, initializeStore]);

  const onSubmit = (data: SettingsFormData) => {
    try {
       setOvenType(data.ovenType as OvenTypeOption);
       updateGeneralSettings({
        doorDetect: data.doorDetect as SelectOnOff,
        autoTrackOut: data.autoTrackOut as AutoTrackoutOption,
        bindMaterialBox: data.bindMaterialBox as SelectOnOff,
        buzzerNetworkDetect: data.buzzerNetworkDetect as SelectOnOff,
        czA5Rule: data.czA5Rule as SelectOnOff,
        ignoreTime: data.ignoreTime,
        tjKeepingTrackin: data.tjKeepingTrackin as SelectOnOff,
        a1019Pins: data.a1019Pins as A1019PinValue[],
      });

      const oven1Settings: Partial<OvenSettingsData> = {
        name: data.oven1.name,
        offsets: [ data.oven1.offset1 ?? 0, data.oven1.offset2 ?? 0, data.oven1.offset3 ?? 0, data.oven1.offset4 ?? 0 ]
      };
      updateOvenSettings('oven1', oven1Settings);

      if ((data.ovenType === '1' || data.ovenType === '2') && data.oven2) {
         const oven2Settings: Partial<OvenSettingsData> = {
            name: data.oven2.name,
            offsets: [ data.oven2.offset1 ?? 0, data.oven2.offset2 ?? 0, data.oven2.offset3 ?? 0, data.oven2.offset4 ?? 0 ]
          };
        updateOvenSettings('oven2', oven2Settings);
      }

      toast({
        title: t('saveSuccessTitle'),
        description: t('saveSuccessDescription'),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: t('saveErrorTitle'),
        description: t('saveErrorDescription'),
        variant: 'destructive',
      });
    }
  };


  if (!_hasHydrated) {
      return <div className="flex justify-center items-center h-64">{t('loading')}</div>;
  }

  // Helper function to translate Zod error messages
  const translateError = (fieldError: any) => {
    if (!fieldError || !fieldError.message) return null;
    // Assume error message is a translation key
    return t(fieldError.message as any); // Use 'any' for potential key mismatches
  };


  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

         {/* Oven Type Selection */}
         <Card>
            <CardHeader>
                <CardTitle>{t('ovenConfigurationTitle')}</CardTitle>
                <CardDescription>{t('ovenConfigurationDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
               <FormField
                 control={control}
                 name="ovenType"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>{t('ovenTypeLabel')}</FormLabel>
                     <Select
                        onValueChange={(value) => {
                            field.onChange(value);
                            if (value === '3' || value === '4') {
                                const currentPins = form.getValues('a1019Pins');
                                const updatedPins = currentPins.map(pin => pin === '2' ? '1' : pin);
                                setValue('a1019Pins', updatedPins as A1019PinValue[]);
                            }
                        }}
                        value={field.value as OvenTypeOption}
                      >
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder={t('ovenTypePlaceholder')} />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="1">{t('ovenType1')}</SelectItem>
                         <SelectItem value="2">{t('ovenType2')}</SelectItem>
                         <SelectItem value="3">{t('ovenType3')}</SelectItem>
                         <SelectItem value="4">{t('ovenType4')}</SelectItem>
                       </SelectContent>
                     </Select>
                     <FormMessage>{translateError(errors.ovenType)}</FormMessage>
                   </FormItem>
                 )}
               />
            </CardContent>
        </Card>


        {/* Oven Specific Settings */}
        <div
          className={`grid gap-8 ${
            currentIsDualMode ? 'lg:grid-cols-2' : 'grid-cols-1'
          }`}
        >
            <OvenSettingsForm
                ovenId="oven1"
                control={control}
                currentIsDualMode={currentIsDualMode}
            />
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
                <CardTitle>{t('a1019Title')}</CardTitle>
                <CardDescription>{t('a1019Description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <FormField
                        key={index}
                        control={control}
                        name={`a1019Pins.${index}`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('pinLabel', { index })}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value as A1019PinValue}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('pinSelectPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="1">{t('pinOven1')}</SelectItem>
                                    {currentIsDualMode && (
                                      <SelectItem value="2">{t('pinOven2')}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                             {/* Error message for individual pin might be complex to show, handle array level error */}
                             {index === 7 && errors.a1019Pins?.message && (
                                 <FormMessage className="col-span-full text-center">{translateError(errors.a1019Pins)}</FormMessage>
                             )}
                        </FormItem>
                        )}
                    />
                ))}
            </CardContent>
        </Card>

        {/* Other General Settings */}
        <Card>
             <CardHeader>
                <CardTitle>{t('generalSettingsTitle')}</CardTitle>
            </CardHeader>
             <CardContent className="space-y-6">
                 <FormField
                    control={control}
                    name="mesServerIp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('mesIpLabel')}</FormLabel>
                        <FormControl>
                            <Input {...field} readOnly placeholder={t('mesIpPlaceholder')} />
                        </FormControl>
                         <FormDescription>{t('mesIpDescription')}</FormDescription>
                        <FormMessage>{translateError(errors.mesServerIp)}</FormMessage>
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
                                <FormLabel className="text-base">{t('doorDetectLabel')}</FormLabel>
                             </div>
                             <FormControl>
                                <Switch
                                    checked={field.value === '1'}
                                    onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                                    aria-label={t('doorDetectLabel')}
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
                                <FormLabel className="text-base">{t('bindMaterialBoxLabel')}</FormLabel>
                             </div>
                             <FormControl>
                                <Switch
                                    checked={field.value === '1'}
                                    onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                                    aria-label={t('bindMaterialBoxLabel')}
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
                                <FormLabel className="text-base">{t('buzzerNetworkDetectLabel')}</FormLabel>
                             </div>
                             <FormControl>
                                <Switch
                                    checked={field.value === '1'}
                                    onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                                    aria-label={t('buzzerNetworkDetectLabel')}
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
                                <FormLabel className="text-base">{t('czA5RuleLabel')}</FormLabel>
                              </div>
                             <FormControl>
                                <Switch
                                    checked={field.value === '1'}
                                    onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                                     aria-label={t('czA5RuleLabel')}
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
                                <FormLabel className="text-base">{t('tjKeepingTrackinLabel')}</FormLabel>
                              </div>
                             <FormControl>
                                <Switch
                                    checked={field.value === '1'}
                                    onCheckedChange={(checked) => field.onChange(checked ? '1' : '0')}
                                     aria-label={t('tjKeepingTrackinLabel')}
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
                            <FormLabel>{t('ignoreTimeLabel')}</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} value={field.value || 0} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
                            </FormControl>
                             <FormDescription>
                                {t('ignoreTimeDescription')}
                             </FormDescription>
                             <FormMessage>{translateError(errors.ignoreTime)}</FormMessage>
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
                         <FormLabel>{t('autoTrackOutLabel')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value as AutoTrackoutOption}>
                         <FormControl>
                             <SelectTrigger>
                             <SelectValue placeholder={t('autoTrackOutPlaceholder')} />
                             </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                             <SelectItem value="0">{t('autoTrackOutOption0')}</SelectItem>
                             <SelectItem value="1">{t('autoTrackOutOption1')}</SelectItem>
                             <SelectItem value="2">{t('autoTrackOutOption2')}</SelectItem>
                         </SelectContent>
                         </Select>
                          <FormDescription>
                             {t('autoTrackOutDescription')}
                          </FormDescription>
                          <FormMessage>{translateError(errors.autoTrackOut)}</FormMessage>
                         </FormItem>
                     )}
                 />

             </CardContent>
        </Card>


        {/* Save Button */}
        <Button type="submit">{t('saveButton')}</Button>
      </form>
    </Form>
  );
}
