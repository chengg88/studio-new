
'use client';

import React, {useEffect} from 'react';
import {useForm, FormProvider} from 'react-hook-form'; // Import FormProvider
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useOvenStore,
  type OvenTypeOption,
  type SelectOnOff,
  type AutoTrackoutOption,
  type A1019PinValue,
  type GeneralSettingsData,
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
import { Loader } from 'lucide-react';

// Zod schema for individual oven settings
const ovenSettingsSchema = z.object({
  name: z.string().min(1, 'ovenNameRequired').max(50, 'ovenNameTooLong'),
  offset1: z.coerce.number().optional().or(z.nan()),
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
  oven2: ovenSettingsSchema.optional(), // oven2 is optional based on ovenType
});


export type SettingsFormData = z.infer<typeof settingsSchema>;
export type OvenSettingsFormData = z.infer<typeof ovenSettingsSchema>;


// Placeholder default values for the form, actual values will be populated by the reset effect from the store
const formDefaultPlaceholders: SettingsFormData = {
  ovenType: '3',
  mesServerIp: '127.0.0.1', // This is read-only, will be overwritten by store/API
  doorDetect: '0',
  autoTrackOut: '0',
  bindMaterialBox: '0',
  buzzerNetworkDetect: '0',
  czA5Rule: '0',
  ignoreTime: 20,
  tjKeepingTrackin: '0',
  a1019Pins: Array(8).fill('1') as A1019PinValue[],
  oven1: { name: 'Oven 1', offset1: 0, offset2: 0, offset3: 0, offset4: 0 },
  oven2: { name: 'Oven 2', offset1: 0, offset2: 0, offset3: 0, offset4: 0 },
};


export default function Settings() {
  const t = useTranslations('Settings');
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
    setOvenType: setStoreOvenType,
    updateGeneralSettings: updateStoreGeneralSettings,
    updateOvenSettings: updateStoreOvenSettings,
    _hasHydrated,
    setHasHydrated
  } = useOvenStore();
  const {toast} = useToast();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: formDefaultPlaceholders, // Use placeholders
  });

  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = form;
  const currentOvenType = watch('ovenType');
  const currentIsDualMode = currentOvenType === '1' || currentOvenType === '2';

  useEffect(() => {
    if (!_hasHydrated) {
      setHasHydrated(true); 
    }
  }, [_hasHydrated, setHasHydrated]);

   useEffect(() => {
    if (_hasHydrated) { 
      const oven1Store = ovens.oven1;
      const oven2Store = ovens.oven2;
      const isDualModeFromStore = storeOvenType === '1' || storeOvenType === '2';

      reset({
        ovenType: storeOvenType || formDefaultPlaceholders.ovenType,
        mesServerIp: storeMesIp || formDefaultPlaceholders.mesServerIp,
        doorDetect: storeDoorDetect || formDefaultPlaceholders.doorDetect,
        autoTrackOut: storeAutoTrackout || formDefaultPlaceholders.autoTrackOut,
        bindMaterialBox: storeBindMaterial || formDefaultPlaceholders.bindMaterialBox,
        buzzerNetworkDetect: storeBuzzer || formDefaultPlaceholders.buzzerNetworkDetect,
        czA5Rule: storeCzRule || formDefaultPlaceholders.czA5Rule,
        ignoreTime: storeIgnoreTime === undefined ? formDefaultPlaceholders.ignoreTime : storeIgnoreTime,
        tjKeepingTrackin: storeTjKeep || formDefaultPlaceholders.tjKeepingTrackin,
        a1019Pins: storePins && storePins.length === 8 ? storePins.map(String) as A1019PinValue[] : formDefaultPlaceholders.a1019Pins,
        oven1: {
          name: oven1Store?.name || '',
          offset1: oven1Store?.offsets?.[0] ?? 0,
          offset2: oven1Store?.offsets?.[1] ?? 0,
          offset3: oven1Store?.offsets?.[2] ?? 0,
          offset4: oven1Store?.offsets?.[3] ?? 0,
        },
        oven2: isDualModeFromStore ? {
          name: oven2Store?.name || '',
          offset1: oven2Store?.offsets?.[0] ?? 0,
          offset2: oven2Store?.offsets?.[1] ?? 0,
          offset3: oven2Store?.offsets?.[2] ?? 0,
          offset4: oven2Store?.offsets?.[3] ?? 0,
        } : { name: '', offset1: 0, offset2: 0, offset3: 0, offset4: 0 }, 
      });
    }
  }, [
    _hasHydrated, storeOvenType, storeMesIp, storeDoorDetect, storeAutoTrackout,
    storeBindMaterial, storeBuzzer, storeCzRule, storeIgnoreTime, storeTjKeep,
    storePins, ovens, reset
  ]);


  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'ovenType') {
        const newIsDualMode = value.ovenType === '1' || value.ovenType === '2';
        if (!newIsDualMode) {
          const currentPins = form.getValues('a1019Pins');
          const updatedPins = currentPins.map(pin => pin === '2' ? '1' : pin);
          setValue('a1019Pins', updatedPins as A1019PinValue[], { shouldValidate: true });
           setValue('oven2', { name: '', offset1: 0, offset2: 0, offset3: 0, offset4: 0 });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, form]);


  const onSubmit = async (data: SettingsFormData) => {
    try {
       // Prepare the payload structure expected by the POST API
      const payloadForApi = {
        ovenType: data.ovenType, // String '1'-'4'
        // mesServerIp is read-only in UI, but included if API expects it
        mesServerIp: data.mesServerIp || formDefaultPlaceholders.mesServerIp,
        ovens: {
          oven1: {
            name: data.oven1.name,
            offsets: [data.oven1.offset1 ?? 0, data.oven1.offset2 ?? 0, data.oven1.offset3 ?? 0, data.oven1.offset4 ?? 0],
          },
          // Conditionally include oven2 data only if it's a dual mode
          ...( (data.ovenType === '1' || data.ovenType === '2') && data.oven2 && {
            oven2: {
              name: data.oven2.name,
              offsets: [data.oven2.offset1 ?? 0, data.oven2.offset2 ?? 0, data.oven2.offset3 ?? 0, data.oven2.offset4 ?? 0],
            }
          })
        },
        // General settings also need to be part of the payload sent to the API
        doorDetect: data.doorDetect,
        autoTrackOut: data.autoTrackOut,
        bindMaterialBox: data.bindMaterialBox,
        buzzerNetworkDetect: data.buzzerNetworkDetect,
        czA5Rule: data.czA5Rule,
        ignoreTime: data.ignoreTime,
        tjKeepingTrackin: data.tjKeepingTrackin,
        a1019Pins: data.a1019Pins,
      };


      const response = await fetch('/api/oven/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadForApi),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to save settings to API');
      }

      // Update Zustand store after successful API save
      setStoreOvenType(data.ovenType as OvenTypeOption);
      updateStoreGeneralSettings({
        mesServerIp: data.mesServerIp, 
        doorDetect: data.doorDetect as SelectOnOff,
        autoTrackOut: data.autoTrackOut as AutoTrackoutOption,
        bindMaterialBox: data.bindMaterialBox as SelectOnOff,
        buzzerNetworkDetect: data.buzzerNetworkDetect as SelectOnOff,
        czA5Rule: data.czA5Rule as SelectOnOff,
        ignoreTime: data.ignoreTime,
        tjKeepingTrackin: data.tjKeepingTrackin as SelectOnOff,
        a1019Pins: data.a1019Pins.map(String) as A1019PinValue[],
      });
      updateStoreOvenSettings('oven1', {
        name: data.oven1.name,
        offsets: [ data.oven1.offset1 ?? 0, data.oven1.offset2 ?? 0, data.oven1.offset3 ?? 0, data.oven1.offset4 ?? 0 ]
      });
      if ((data.ovenType === '1' || data.ovenType === '2') && data.oven2) {
        updateStoreOvenSettings('oven2', {
            name: data.oven2.name,
            offsets: [ data.oven2.offset1 ?? 0, data.oven2.offset2 ?? 0, data.oven2.offset3 ?? 0, data.oven2.offset4 ?? 0 ]
        });
      }


      toast({
        title: t('saveSuccessTitle'),
        description: t('saveSuccessDescription'),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: t('saveErrorTitle'),
        description: (error as Error).message || t('saveErrorDescription'),
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
    <FormProvider {...form}> 
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
                              field.onChange(value as OvenTypeOption);
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
              {currentIsDualMode && (
                  <OvenSettingsForm
                      ovenId="oven2"
                      control={control}
                      currentIsDualMode={currentIsDualMode}
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
                                  disabled={!currentIsDualMode && field.value === '2'}
                              >
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
                              {errors.a1019Pins?.[index] && (
                                  <FormMessage>{translateError(errors.a1019Pins?.[index])}</FormMessage>
                              )}
                          </FormItem>
                          )}
                      />
                  ))}
                  {errors.a1019Pins && !errors.a1019Pins.message && typeof errors.a1019Pins !== 'string' && Array.isArray(errors.a1019Pins) && (
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
    </FormProvider>
  );
}
