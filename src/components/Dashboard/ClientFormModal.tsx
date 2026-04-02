"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Text,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { getStateSelectOptions } from "@/lib/usStates";
import { PURGE_ENABLED } from "@/lib/constants";
import { FW } from "@/theme/ghost-theme";

// =============================================================================
// TYPES
// =============================================================================

interface ClientFormModalProps {
  opened: boolean;
  onClose: () => void;
  mode: "create" | "edit";
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
    dateOfBirth?: string | null;
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return "Phone number must have at least 10 digits";
  return null;
}

function validateZipCode(value: string): string | null {
  if (!/^\d{5}$/.test(value)) {
    return "ZIP code must be exactly 5 digits";
  }
  return null;
}

function validateSSN(value: string): string | null {
  if (!/^\d{4}$/.test(value)) {
    return "SSN must be 4 digits";
  }
  return null;
}

function validateEmail(value: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Invalid email address";
  }
  return null;
}

function validateDOB(value: string | null): string | null {
  if (!value) return "Date of birth is required";
  return null;
}

// =============================================================================
// HELPERS
// =============================================================================

const SECTION_HEADER_PROPS = {
  fw: 600,
  size: "sm" as const,
  tt: "uppercase" as const,
  lts: "0.05em",
  c: "dimmed",
} as const;

/** Convert backend MM/DD/YYYY to Mantine YYYY-MM-DD. */
function toMantineDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

/** Convert Mantine YYYY-MM-DD to backend MM/DD/YYYY. */
function toBackendDate(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const [, year, month, day] = match;
  return `${month}/${day}/${year}`;
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
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createClient = useMutation(api.clients.createClient);
  const updateClient = useMutation(api.clients.updateClient);

  const form = useForm({
    initialValues: {
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      last4SSN: initialData?.last4SSN ?? "",
      dateOfBirth: toMantineDate(initialData?.dateOfBirth) as string | null,
      address1: initialData?.address1 ?? "",
      address2: initialData?.address2 ?? "",
      city: initialData?.city ?? "",
      state: initialData?.state ?? "",
      zipCode: initialData?.zipCode ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
    },
    validate: {
      firstName: (value) =>
        value.trim().length === 0 ? "First name is required" : null,
      lastName: (value) =>
        value.trim().length === 0 ? "Last name is required" : null,
      last4SSN: validateSSN,
      dateOfBirth: validateDOB,
      address1: (value) =>
        value.trim().length === 0 ? "Street address is required" : null,
      city: (value) => (value.trim().length === 0 ? "City is required" : null),
      state: (value) => (value.length === 0 ? "State is required" : null),
      zipCode: validateZipCode,
      email: validateEmail,
      phone: validatePhone,
    },
    validateInputOnChange: true,
  });

  // Reinitialize form when modal opens or initialData changes
  useEffect(() => {
    if (opened && initialData) {
      form.setValues({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        last4SSN: initialData.last4SSN,
        dateOfBirth: toMantineDate(initialData.dateOfBirth),
        address1: initialData.address1,
        address2: initialData.address2 ?? "",
        city: initialData.city,
        state: initialData.state,
        zipCode: initialData.zipCode,
        email: initialData.email,
        phone: initialData.phone,
      });
      form.resetDirty();
    }
    if (opened && !initialData) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, initialData]);

  function getDirtyStyles(fieldName: string) {
    if (mode !== "edit") return undefined;
    if (!form.isDirty(fieldName)) return undefined;
    return {
      input: {
        borderLeftWidth: 3,
        borderLeftColor: "var(--mantine-color-blue-6)",
      },
    };
  }

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);

    try {
      const input = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        last4SSN: values.last4SSN.trim(),
        dateOfBirth: toBackendDate(values.dateOfBirth),
        address1: values.address1.trim(),
        address2: values.address2.trim() || undefined,
        city: values.city.trim(),
        state: values.state,
        zipCode: values.zipCode.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
      };

      if (mode === "edit" && initialData) {
        await updateClient({ ...input, id: initialData.id as Id<"clients"> });
        notifications.show({
          title: "Client Updated",
          message: `${input.firstName} ${input.lastName} updated.`,
          color: "green",
          icon: <IconCheck size={16} />,
        });
        form.reset();
        onClose();
      } else {
        const newClient = await createClient(input);
        notifications.show({
          title: "Client Created",
          message: `${input.firstName} ${input.lastName} added.`,
          color: "green",
          icon: <IconCheck size={16} />,
        });
        form.reset();
        onClose();

        if (newClient?._id) {
          router.push(`/clients/${newClient._id}`);
        }
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : mode === "edit"
              ? "Ghost hit a snag. Could not update client."
              : "Ghost hit a snag. Could not save client.",
        color: "red",
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
        <Text fw={FW.HEADING} size="lg">
          {mode === "edit" ? "Edit Client" : "Add Client"}
        </Text>
      }
      size="xl"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting && !form.isDirty()}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* PII Disclosure */}
          {PURGE_ENABLED && (
            <Text size="xs" c="dimmed">
              Client data is stored securely and purged after 91 days.
            </Text>
          )}

          {/* Section 1: Identity */}
          <Stack gap="md">
            <Text {...SECTION_HEADER_PROPS}>Identity</Text>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="First Name"
                placeholder="John"
                required
                data-autofocus
                styles={getDirtyStyles("firstName")}
                {...form.getInputProps("firstName")}
              />
              <TextInput
                label="Last Name"
                placeholder="Smith"
                required
                styles={getDirtyStyles("lastName")}
                {...form.getInputProps("lastName")}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Last 4 of SSN"
                placeholder="1234"
                required
                maxLength={4}
                styles={getDirtyStyles("last4SSN")}
                {...form.getInputProps("last4SSN")}
              />
              <DatePickerInput
                label="Date of Birth"
                placeholder="Pick a date"
                required
                valueFormat="MM/DD/YYYY"
                maxDate={new Date()}
                clearable
                styles={getDirtyStyles("dateOfBirth")}
                {...form.getInputProps("dateOfBirth")}
              />
            </SimpleGrid>
          </Stack>

          {/* Section 2: Mailing Address */}
          <Stack gap="md">
            <Text {...SECTION_HEADER_PROPS}>Mailing Address</Text>

            <TextInput
              label="Street Address"
              placeholder="1234 Main Street"
              required
              styles={getDirtyStyles("address1")}
              {...form.getInputProps("address1")}
            />

            <TextInput
              label="Address Line 2"
              placeholder="Apt, Suite, Unit, etc. (optional)"
              styles={getDirtyStyles("address2")}
              {...form.getInputProps("address2")}
            />

            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <TextInput
                label="City"
                placeholder="Los Angeles"
                required
                styles={getDirtyStyles("city")}
                {...form.getInputProps("city")}
              />
              <Select
                label="State"
                placeholder="Select state"
                required
                searchable
                data={getStateSelectOptions()}
                styles={getDirtyStyles("state")}
                {...form.getInputProps("state")}
              />
              <TextInput
                label="ZIP Code"
                placeholder="90001"
                required
                maxLength={5}
                styles={getDirtyStyles("zipCode")}
                {...form.getInputProps("zipCode")}
              />
            </SimpleGrid>
          </Stack>

          {/* Section 3: Contact */}
          <Stack gap="md">
            <Text {...SECTION_HEADER_PROPS}>Contact</Text>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Email"
                placeholder="john@example.com"
                required
                styles={getDirtyStyles("email")}
                {...form.getInputProps("email")}
              />
              <TextInput
                label="Phone"
                placeholder="(555) 123-4567"
                required
                styles={getDirtyStyles("phone")}
                {...form.getInputProps("phone")}
              />
            </SimpleGrid>
          </Stack>

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {mode === "edit" ? "Save Changes" : "Add Client"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
