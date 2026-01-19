'use client';

import { Stack, TextInput, Textarea, Select, Checkbox, Group, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';

/**
 * Form field schema definition
 */
export interface FormField {
  type: 'text' | 'date' | 'textarea' | 'select' | 'checkbox';
  label: string;
  tagId: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select fields
  defaultValue?: any;
}

interface DynamicFormProps {
  schema: FormField[];
  values: Record<string, any>;
  onChange: (tagId: string, value: any) => void;
  errors?: Record<string, string>;
}

export function DynamicForm({ schema, values, onChange, errors = {} }: DynamicFormProps) {
  if (!schema || schema.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center" py="md">
        No custom fields required for this letter.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {schema.map((field) => {
        const value = values[field.tagId];
        const error = errors[field.tagId];
        const commonProps = {
          key: field.tagId,
          label: field.label,
          required: field.required,
          error,
        };

        switch (field.type) {
          case 'text':
            return (
              <TextInput
                {...commonProps}
                placeholder={field.placeholder}
                value={value || ''}
                onChange={(e) => onChange(field.tagId, e.currentTarget.value)}
              />
            );

          case 'textarea':
            return (
              <Textarea
                {...commonProps}
                placeholder={field.placeholder}
                value={value || ''}
                onChange={(e) => onChange(field.tagId, e.currentTarget.value)}
                minRows={3}
                autosize
              />
            );

          case 'date':
            return (
              <DateInput
                {...commonProps}
                placeholder={field.placeholder || 'Pick a date'}
                value={value ? new Date(value) : null}
                onChange={(date) => {
                  if (date) {
                    onChange(field.tagId, date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }));
                  } else {
                    onChange(field.tagId, '');
                  }
                }}
                valueFormat="MMMM D, YYYY"
              />
            );

          case 'select':
            return (
              <Select
                {...commonProps}
                placeholder={field.placeholder || 'Select an option'}
                data={field.options || []}
                value={value || null}
                onChange={(val) => onChange(field.tagId, val || '')}
                searchable
                clearable
              />
            );

          case 'checkbox':
            return (
              <Checkbox
                key={field.tagId}
                label={field.label}
                checked={!!value}
                onChange={(e) => onChange(field.tagId, e.currentTarget.checked ? 'Yes' : 'No')}
                error={error}
              />
            );

          default:
            return null;
        }
      })}
    </Stack>
  );
}

/**
 * Validate form values against schema
 * Returns object with field errors
 */
export function validateDynamicForm(
  schema: FormField[],
  values: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {};

  schema.forEach((field) => {
    if (field.required) {
      const value = values[field.tagId];
      if (value === undefined || value === null || value === '') {
        errors[field.tagId] = `${field.label} is required`;
      }
    }
  });

  return errors;
}
