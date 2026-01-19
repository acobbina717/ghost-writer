'use client';

import { useState } from 'react';
import {
  Stack,
  Textarea,
  Text,
  Paper,
  Badge,
  Group,
  Alert,
  Code,
  Collapse,
  Button,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconCode, IconEye } from '@tabler/icons-react';
import type { FormSchemaField } from '@/lib/convex-types';

interface FormSchemaInputProps {
  value: FormSchemaField[] | null;
  onChange: (schema: FormSchemaField[] | null) => void;
}

const EXAMPLE_SCHEMA = `[
  {
    "type": "text",
    "label": "Hospital Name",
    "tagId": "hospital_name",
    "placeholder": "Enter hospital name"
  },
  {
    "type": "date",
    "label": "Date of Service",
    "tagId": "service_date"
  },
  {
    "type": "textarea",
    "label": "Additional Details",
    "tagId": "additional_details",
    "placeholder": "Enter any additional information"
  }
]`;

export function FormSchemaInput({ value, onChange }: FormSchemaInputProps) {
  const [jsonText, setJsonText] = useState<string>(
    value ? JSON.stringify(value, null, 2) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showExample, setShowExample] = useState(false);

  // Validate the JSON schema
  const validateSchema = (schema: unknown): schema is FormSchemaField[] => {
    if (!Array.isArray(schema)) {
      return false;
    }

    for (const field of schema) {
      if (typeof field !== 'object' || field === null) {
        return false;
      }

      // Check required fields
      if (!field.type || !field.label || !field.tagId) {
        return false;
      }

      // Check valid types
      const validTypes = ['text', 'date', 'textarea', 'select', 'checkbox'];
      if (!validTypes.includes(field.type)) {
        return false;
      }

      // Check tagId format (no spaces, lowercase)
      if (!/^[a-z][a-z0-9_]*$/.test(field.tagId)) {
        return false;
      }
    }

    return true;
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);

    if (!text.trim()) {
      setError(null);
      onChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      
      if (!validateSchema(parsed)) {
        setError(
          'Invalid schema format. Each field needs: type (text|date|textarea|select|checkbox), label, tagId (lowercase_snake_case)'
        );
        return;
      }

      setError(null);
      onChange(parsed);
    } catch {
      setError('Invalid JSON syntax');
    }
  };

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'blue';
      case 'date':
        return 'green';
      case 'textarea':
        return 'violet';
      case 'select':
        return 'orange';
      case 'checkbox':
        return 'teal';
      default:
        return 'gray';
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>
            Custom Form Fields (JSON)
          </Text>
          <Group gap="xs">
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconCode size={14} />}
              onClick={() => setShowExample(!showExample)}
            >
              {showExample ? 'Hide Example' : 'Show Example'}
            </Button>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconEye size={14} />}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </Group>
        </Group>

        <Collapse in={showExample}>
          <Paper withBorder p="sm" mb="sm" bg="var(--bg-inset)">
            <Text size="xs" c="dimmed" mb="xs">
              Example schema:
            </Text>
            <Code block style={{ fontSize: '11px' }}>
              {EXAMPLE_SCHEMA}
            </Code>
            <Button
              size="xs"
              variant="light"
              mt="sm"
              onClick={() => handleJsonChange(EXAMPLE_SCHEMA)}
            >
              Use This Example
            </Button>
          </Paper>
        </Collapse>

        <Textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          placeholder='Enter custom field schema as JSON array, or leave empty for no custom fields'
          minRows={6}
          autosize
          maxRows={15}
          styles={{
            input: {
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
            },
          }}
        />
      </div>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          variant="light"
        >
          {error}
        </Alert>
      )}

      <Collapse in={showPreview && value !== null && value.length > 0}>
        <Paper withBorder p="sm">
          <Text size="xs" c="dimmed" mb="sm" fw={500} tt="uppercase">
            Field Preview
          </Text>
          <Stack gap="xs">
            {value?.map((field, index) => (
              <Group key={index} gap="sm">
                <Badge
                  size="sm"
                  variant="light"
                  color={getFieldTypeColor(field.type)}
                >
                  {field.type}
                </Badge>
                <Text size="sm">{field.label}</Text>
                <Code style={{ fontSize: '11px' }}>{`{{${field.tagId}}}`}</Code>
              </Group>
            ))}
          </Stack>
        </Paper>
      </Collapse>

      {!error && jsonText.trim() && value && (
        <Group gap="xs">
          <IconCheck size={14} color="var(--color-success)" />
          <Text size="xs" c="green">
            Valid schema with {value.length} custom field{value.length !== 1 ? 's' : ''}
          </Text>
        </Group>
      )}
    </Stack>
  );
}

