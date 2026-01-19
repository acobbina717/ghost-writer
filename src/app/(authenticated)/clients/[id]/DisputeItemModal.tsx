'use client';

import { Modal, Stack, TextInput, Select, Radio, Group, Button } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

interface DisputeItemModalProps {
  opened: boolean;
  onClose: () => void;
  clientId: Id<"clients">;
}

const DISPUTE_TYPES = [
  'Late Payment',
  'Medical',
  'Collection',
  'Charge-off',
  'Repossession',
  'Foreclosure',
  'Bankruptcy',
  'Inquiry',
  'Other',
];

const CRA_OPTIONS = [
  { value: 'experian', label: 'Experian' },
  { value: 'equifax', label: 'Equifax' },
  { value: 'transunion', label: 'TransUnion' },
];

export function DisputeItemModal({ opened, onClose, clientId }: DisputeItemModalProps) {
  const createDisputeItem = useMutation(api.clients.createDisputeItem);

  const form = useForm({
    initialValues: {
      disputeType: '',
      creditorName: '',
      accountNumber: '',
      craTarget: 'experian',
    },
    validate: {
      disputeType: (value) => (!value ? 'Dispute type is required' : null),
      craTarget: (value) => (!value ? 'CRA target is required' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await createDisputeItem({
        clientId,
        disputeType: values.disputeType,
        creditorName: values.creditorName || undefined,
        accountNumber: values.accountNumber || undefined,
        craTarget: values.craTarget,
      });

      notifications.show({
        title: 'Success',
        message: 'Dispute item created successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      form.reset();
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create dispute item',
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        form.reset();
        onClose();
      }}
      title="Add Dispute Item"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label="Dispute Type"
            placeholder="Select dispute type"
            data={DISPUTE_TYPES}
            searchable
            required
            {...form.getInputProps('disputeType')}
          />

          <TextInput
            label="Creditor Name"
            placeholder="Enter creditor or collector name"
            {...form.getInputProps('creditorName')}
          />

          <TextInput
            label="Account Number"
            placeholder="Enter account number (optional)"
            {...form.getInputProps('accountNumber')}
          />

          <Radio.Group
            label="Credit Reporting Agency"
            description="Which CRA should this dispute target?"
            required
            {...form.getInputProps('craTarget')}
          >
            <Stack mt="xs" gap="xs">
              {CRA_OPTIONS.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </Stack>
          </Radio.Group>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => {
                form.reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Create Dispute Item</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
