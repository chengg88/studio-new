
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
  type OvenSettings as OvenStoreSettingsData, // Renamed to avoid conflict
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
import {useTranslations} from 'next-intl';
import { Loader } from 'lucide-react'; // For loading state

// Zod schema for individual oven settings
const ovenSettingsSchema = z.object({
  name: z.string().min(1, 'ovenNameRequired').max(50, 'ovenNameTooLong'),
  offset1: z.coerce.number().optional().or(z.nan()), // Using coerce for number conversion
  offset2: z.coerce.number().optional().or(z.nan()),
  offset3: z.coerce.number().optional().or(z.nan()),
  offset4: z.coerce.number().optional().or(z.nan()),
});

// Zod schema for all settings
const settingsSchema = z.object({
  ovenType: z.enum(['1', '2', '3', '4']) as z.ZodType<OvenTypeOption>,
  mesServerIp: z.string().ip({ version: "v4", message: "mesIpInvalid" }).optional().or(z.literal("")),
  doorDetect: z.enum(['0', '1']) as z.ZodType<SelectOnOff>,
  autoTrackOut: z.enum(['0', '1', '2']) as z.ZodType<AutoTrackoutOption>,
  bindMaterialBox: z.enum(['0', '1']) as z.ZodType<SelectOnOff>,
  buzzerNetworkDetect: z.enum(['0', '1']) as z.ZodType<SelectOnOff>,
  czA5Rule: z.enum(['0', '1']) as z.ZodType<SelectOnOff>,
  ignoreTime: z.coerce.number().int().min(0, "ignoreTimePositive"),
  tjKeepingTrackin: z.enum(['0', '1']) as z.ZodType<SelectOnOff>,
  a1019Pins: z.array(z.enum(['1', '2'])).length(8, "Must provide settings for all 8 pins") as z.ZodType<A1019PinValue[]>,
  oven1: ovenSettingsSchema,
  oven2: ovenSettingsSchema.optional(), // oven2 is optional
});


export type SettingsFormData = z.infer<typeof settingsSchema>;
export type OvenSettingsFormData = z.infer<typeof ovenSettingsSchema>;


export default function Settings() {
  const t = useTranslations('Settings');
  const {
    // Destructure all relevant state and actions from the store
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
    updateOvenSettings, // For individual oven name/offsets
    initializeStore,
    _hasHydrated,
    setHasHydrated
  } = useOvenStore();
  const {toast} = useToast();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { // Initial defaults before store hydration
      ovenType: '3',
      mesServerIp: '',
      doorDetect: '0',
      autoTrackOut: '0',
      bindMaterialBox: '0',
      buzzerNetworkDetect: '0',
      czA5Rule: '0',
      ignoreTime: 20,
      tjKeepingTrackin: '0',
      a1019Pins: Array(8).fill('1') as A1019PinValue[],
      oven1: { name: '', offset1: 0, offset2: 0, offset3: 0, offset4: 0 },
      oven2: { name: '', offset1: 0, offset2: 0, offset3: 0, offset4: 0 },
    },
  });

  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = form;
  const currentOvenType = watch('ovenType');
  const currentIsDualMode = currentOvenType === '1' || currentOvenType === '2';

  useEffect(() => {
    if (!_hasHydrated) {
      setHasHydrated(true); // Mark as hydrated on client
    }
  }, [_hasHydrated, setHasHydrated]);

   useEffect(() => {
    if (_hasHydrated) {
      // Ensure initializeStore is called to fetch config if it hasn't been fetched yet
      // This might be redundant if initializeStore is also called globally in store, but safe.
      if (!useOvenStore.getState().ovenType) { // Simple check if config might be missing
           initializeStore();
      }

      // Reset form with values from the store once hydrated and store is populated
      // Check if store values are defaults or have been populated by API
      const oven1StoreSettings = ovens.oven1;
      const oven2StoreSettings = ovens.oven2;

      reset({
        ovenType: storeOvenType || '3', // Fallback to default if store not yet populated
        mesServerIp: storeMesIp || '',
        doorDetect: storeDoorDetect || '0',
        autoTrackOut: storeAutoTrackout || '0',
        bindMaterialBox: storeBindMaterial || '0',
        buzzerNetworkDetect: storeBuzzer || '0',
        czA5Rule: storeCzRule || '0',
        ignoreTime: storeIgnoreTime === undefined ? 20 : storeIgnoreTime,
        tjKeepingTrackin: storeTjKeep || '0',
        a1019Pins: storePins && storePins.length === 8 ? storePins.map(String) as A1019PinValue[] : Array(8).fill('1') as A1019PinValue[],
        oven1: {
          name: oven1StoreSettings?.name || '',
          offset1: oven1StoreSettings?.offsets?.[0] ?? 0,
          offset2: oven1StoreSettings?.offsets?.[1] ?? 0,
          offset3: oven1StoreSettings?.offsets?.[2] ?? 0,
          offset4: oven1StoreSettings?.offsets?.[3] ?? 0,
        },
        oven2: currentIsDualMode ? { // Only populate oven2 if dual mode from store
          name: oven2StoreSettings?.name || '',
          offset1: oven2StoreSettings?.offsets?.[0] ?? 0,
          offset2: oven2StoreSettings?.offsets?.[1] ?? 0,
          offset3: oven2StoreSettings?.offsets?.[2] ?? 0,
          offset4: oven2StoreSettings?.offsets?.[3] ?? 0,
        } : undefined, // Or provide default empty if needed by schema even when not dual
      });
    }
  }, [
    _hasHydrated, storeOvenType, storeMesIp, storeDoorDetect, storeAutoTrackout,
    storeBindMaterial, storeBuzzer, storeCzRule, storeIgnoreTime, storeTjKeep,
    storePins, ovens, reset, initializeStore, currentIsDualMode // Added currentIsDualMode
  ]);


  // Handle OvenType change to conditionally manage oven2 settings
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'ovenType') {
        const newIsDualMode = value.ovenType === '1' || value.ovenType === '2';
        if (!newIsDualMode) {
          // If switching to single oven, you might want to clear or disable oven2 fields
          // For now, just make sure it's not submitted if not dual mode.
          // Also, reset A1019 pins for Oven 2 to Oven 1
          const currentPins = form.getValues('a1019Pins');
          const updatedPins = currentPins.map(pin => pin === '2' ? '1' : pin);
          setValue('a1019Pins', updatedPins as A1019PinValue[], { shouldValidate: true });
        }
        // Optionally reset oven2 fields if switching from dual to single
        // setValue('oven2', { name: '', offset1: 0, offset2: 0, offset3: 0, offset4: 0 });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, form]);


  const onSubmit = (data: SettingsFormData) => {
    // NOTE: This currently saves to Zustand/localStorage.
    // To save to Redis, you'd need a POST API endpoint and call it here.
    try {
       setOvenType(data.ovenType as OvenTypeOption); // This updates isDualMode in store
       updateGeneralSettings({
        // mesServerIp: data.mesServerIp, // mesServerIp is read-only
        doorDetect: data.doorDetect as SelectOnOff,
        autoTrackOut: data.autoTrackOut as AutoTrackoutOption,
        bindMaterialBox: data.bindMaterialBox as SelectOnOff,
        buzzerNetworkDetect: data.buzzerNetworkDetect as SelectOnOff,
        czA5Rule: data.czA5Rule as SelectOnOff,
        ignoreTime: data.ignoreTime,
        tjKeepingTrackin: data.tjKeepingTrackin as SelectOnOff,
        a1019Pins: data.a1019Pins.map(String) as A1019PinValue[], // Ensure strings
      });

      const oven1SettingsUpdate: Partial<OvenStoreSettingsData> = {
        name: data.oven1.name,
        offsets: [ data.oven1.offset1 ?? 0, data.oven1.offset2 ?? 0, data.oven1.offset3 ?? 0, data.oven1.offset4 ?? 0 ]
      };
      updateOvenSettings('oven1', oven1SettingsUpdate);

      const actualIsDualMode = data.ovenType === '1' || data.ovenType === '2';
      if (actualIsDualMode && data.oven2) {
         const oven2SettingsUpdate: Partial<OvenStoreSettingsData> = {
            name: data.oven2.name,
            offsets: [ data.oven2.offset1 ?? 0, data.oven2.offset2 ?? 0, data.oven2.offset3 ?? 0, data.oven2.offset4 ?? 0 ]
          };
        updateOvenSettings('oven2', oven2SettingsUpdate);
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
      return <div className="flex justify-center items-center h-64"><Loader className="w-8 h-8 animate-spin" /> {t('loading')}</div>;
  }

  const translateError = (fieldError: any) => {
    if (!fieldError || !fieldError.message) return null;
    return t(fieldError.message as any);
  };


  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
            {/* Conditionally render Oven2SettingsForm based on currentIsDualMode */}
            {currentIsDualMode && (
                 <OvenSettingsForm
                    ovenId="oven2"
                    control={control}
                    currentIsDualMode={currentIsDualMode} // This prop enables/disables fields inside
                 />
            )}
        </div>

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
                            <Select
                                onValueChange={field.onChange}
                                value={field.value as A1019PinValue}
                                disabled={!currentIsDualMode && field.value === '2'} // Disable selecting Oven 2 if not dual mode
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('pinSelectPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="1">{t('pinOven1')}</SelectItem>
                                    {/* Only show Oven 2 option if dual mode is active */}
                                    {currentIsDualMode && (
                                      <SelectItem value="2">{t('pinOven2')}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                             {errors.a1019Pins?.[index] && (
                                 <FormMessage>{translateError(errors.a1019Pins?.[index])}</FormMessage>
                             )}
                        </FormItem>
                        )}
                    />
                ))}
                {errors.a1019Pins && !errors.a1019Pins.message && typeof errors.a1019Pins !== 'string' && (
                    <FormMessage className="col-span-full text-center">{translateError(errors.a1019Pins)}</FormMessage>
                )}
            </CardContent>
        </Card>

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
                            <Input {...field} value={field.value || ''} readOnly placeholder={t('mesIpPlaceholder')} />
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


        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          {t('saveButton')}
        </Button>
      </form>
    </Form>
  );
}
