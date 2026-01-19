'use client';

import { useState } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { getStateSelectOptions } from '@/lib/usStates';

// =============================================================================
// TYPES
// =============================================================================

interface ClientFormModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string;
    zipCode: string;
    last4SSN: string;
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10) {
    return 'Phone number must have at least 10 digits';
  }
  return null;
}

function validateZipCode(value: string): string | null {
  if (!/^\d{5}$/.test(value)) {
    return 'ZIP code must be exactly 5 digits';
  }
  return null;
}

function validateSSN(value: string): string | null {
  if (!/^\d{4}$/.test(value)) {
    return 'Must be exactly 4 digits';
  }
  return null;
}

function validateEmail(value: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Invalid email address';
  }
  return null;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ClientFormModal({
  opened,
  onClose,
  mode,
  initialData,
}: ClientFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createClient = useMutation(api.clients.createClient);
  const updateClient = useMutation(api.clients.updateClient);

  const form = useForm({
    initialValues: {
      firstName: initialData?.firstName ?? '',
      lastName: initialData?.lastName ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
      address1: initialData?.address1 ?? '',
      address2: initialData?.address2 ?? '',
      city: initialData?.city ?? '',
      state: initialData?.state ?? '',
      zipCode: initialData?.zipCode ?? '',
      last4SSN: initialData?.last4SSN ?? '',
    },
    validate: {
      firstName: (value) => (value.trim().length === 0 ? 'First name is required' : null),
      lastName: (value) => (value.trim().length === 0 ? 'Last name is required' : null),
      email: validateEmail,
      phone: validatePhone,
      address1: (value) => (value.trim().length === 0 ? 'Street address is required' : null),
      city: (value) => (value.trim().length === 0 ? 'City is required' : null),
      state: (value) => (value.length === 0 ? 'State is required' : null),
      zipCode: validateZipCode,
      last4SSN: validateSSN,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);

    try {
      const input = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address1: values.address1.trim(),
        address2: values.address2.trim() || undefined,
        city: values.city.trim(),
        state: values.state,
        zipCode: values.zipCode.trim(),
        last4SSN: values.last4SSN.trim(),
      };

      if (mode === 'edit' && initialData) {
        await updateClient({ ...input, id: initialData.id as Id<"clients"> });
        notifications.show({
          title: 'Client Updated',
          message: `${input.firstName} ${input.lastName} has been updated.`,
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      } else {
        await createClient(input);
        notifications.show({
          title: 'Client Created',
          message: `${input.firstName} ${input.lastName} has been added.`,
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      }

      form.reset();
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'An error occurred',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="lg">
          {mode === 'edit' ? 'Edit Client' : 'Add New Client'}
        </Text>
      }
      size="lg"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Name Row */}
          <SimpleGrid cols={2}>
            <TextInput
              label="First Name"
              placeholder="John"
              required
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Last Name"
              placeholder="Smith"
              required
              {...form.getInputProps('lastName')}
            />
          </SimpleGrid>

          {/* Contact Row */}
          <SimpleGrid cols={2}>
            <TextInput
              label="Email"
              placeholder="john@example.com"
              required
              {...form.getInputProps('email')}
            />
            <TextInput
              label="Phone"
              placeholder="(555) 123-4567"
              required
              {...form.getInputProps('phone')}
            />
          </SimpleGrid>

          {/* Address Line 1 */}
          <TextInput
            label="Street Address"
            placeholder="1234 Main Street"
            required
            {...form.getInputProps('address1')}
          />

          {/* Address Line 2 */}
          <TextInput
            label="Address Line 2"
            placeholder="Apt, Suite, Unit, etc. (optional)"
            {...form.getInputProps('address2')}
          />

          {/* City, State, ZIP Row */}
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <TextInput
              label="City"
              placeholder="Los Angeles"
              required
              {...form.getInputProps('city')}
            />
            <Select
              label="State"
              placeholder="Select state"
              required
              searchable
              data={getStateSelectOptions()}
              {...form.getInputProps('state')}
            />
            <TextInput
              label="ZIP Code"
              placeholder="90001"
              required
              maxLength={5}
              {...form.getInputProps('zipCode')}
            />
          </SimpleGrid>

          {/* SSN */}
          <TextInput
            label="Last 4 of SSN"
            placeholder="1234"
            required
            maxLength={4}
            description="Only the last 4 digits are stored for security"
            style={{ maxWidth: 150 }}
            {...form.getInputProps('last4SSN')}
          />

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {mode === 'edit' ? 'Save Changes' : 'Create Client'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
