
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
import { useTranslations } from 'next-intl'; // Import useTranslations
import { useFormContext } from 'react-hook-form'; // Import useFormContext to access errors

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
  const t = useTranslations('Settings'); // Initialize translations
  const { formState: { errors } } = useFormContext<SettingsFormData>(); // Get errors from parent form context

  const isOven2Disabled = !currentIsDualMode && ovenId === 'oven2';

  // Determine the title and description based on ovenId and mode
  const cardTitle = currentIsDualMode
    ? ovenId === 'oven1'
      ? t('oven1SettingsTitle')
      : t('oven2SettingsTitle')
    : t('ovenSingleSettingsTitle');

  const ovenNameForDescription = currentIsDualMode ? `${t('oven')} ${ovenId.slice(-1)}` : t('oven');
  const cardDescription = t('ovenSettingsDescription', { ovenName: ovenNameForDescription });

  // Helper function to translate Zod error messages for this specific oven
  const translateOvenError = (fieldName: keyof SettingsFormData['oven1']) => {
     const fieldError = errors?.[ovenId]?.[fieldName];
     if (!fieldError || !fieldError.message) return null;
     // Assume error message is a translation key
     return t(fieldError.message as any); // Use 'any' for potential key mismatches
  };


  return (
    <Card className={isOven2Disabled ? 'opacity-50 pointer-events-none' : ''}>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name={`${ovenId}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ovenNameLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('ovenNamePlaceholder')} {...field} disabled={isOven2Disabled} />
              </FormControl>
              <FormMessage>{translateOvenError('name')}</FormMessage>
            </FormItem>
          )}
        />

         {/* Temperature Offsets */}
         <Separator />
         <div>
           <h4 className="text-md font-semibold mb-2">{t('offsetsTitle')}</h4>
           <div className="grid grid-cols-2 gap-4">
             {[1, 2, 3, 4].map((index) => (
               <FormField
                 key={index}
                 control={control}
                 name={`${ovenId}.offset${index}` as const} // Use 'as const' for type safety
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>{t('offsetLabel', { index })}</FormLabel>
                     <FormControl>
                       <Input type="number" placeholder={t('offsetPlaceholder')} {...field} value={field.value || 0} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} disabled={isOven2Disabled} />
                     </FormControl>
                     {/* Display error message for the specific offset field */}
                     <FormMessage className="text-xs">{translateOvenError(`offset${index}` as keyof SettingsFormData['oven1'])}</FormMessage>
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
