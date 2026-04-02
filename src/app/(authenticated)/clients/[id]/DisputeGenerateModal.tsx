'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Modal, Grid, ScrollArea, Stack, Group, Text, Select, Chip, Switch,
  Tabs, Card, TextInput, ActionIcon, Button, Paper,
  SegmentedControl, Alert, Center, Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconPlus, IconTrash, IconFileText, IconCheck, IconCircle,
  IconDownload, IconAlertCircle, IconEdit, IconEye, IconSunglasses,
} from '@tabler/icons-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { notifications } from '@mantine/notifications';
import {
  getCrasForDisputeType,
  getSchemaGroupForType,
  type DisputeItemSchema,
} from '../../../../../convex/constants';
import { getCraInfo } from '@/lib/constants';
import {
  hydrateTemplate,
  findUnresolvedTags,
  type HydrationData,
  type DisputeItemData,
} from '@/lib/hydrateTemplate';
import { wrapHtmlForPreview, downloadBase64Pdf } from '@/lib/pdf-utils';
import type { ConvexLetter, ConvexDisputeItem } from '@/lib/convex-types';
import { SmartTagsReference } from '@/components/SmartTagsReference';
import { LAYOUT, Z, FW } from '@/theme/ghost-theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Dynamic dispute item — fields populated per schema group */
interface DisputeItem {
  id: string;
  [key: string]: string;
}

export interface PrePopulatedData {
  disputeType: string;
  craTargets: string[];
  items: ConvexDisputeItem[];
  currentRound: number;
}

interface DisputeGenerateModalProps {
  opened: boolean;
  onClose: () => void;
  clientId: Id<'clients'>;
  prePopulatedData?: PrePopulatedData | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultItem(): DisputeItem {
  return { id: crypto.randomUUID() };
}

function getCraLabel(cra: string): string {
  return getCraInfo(cra).label;
}

/** Convert a DisputeItem (dynamic keys) to a DisputeItemData for hydration */
function toHydrationItem(item: DisputeItem): DisputeItemData {
  return {
    creditorName: item.creditorName || undefined,
    accountNumber: item.accountNumber || undefined,
    inquiryDate: item.inquiryDate || undefined,
    dateOpened: item.dateOpened || undefined,
    balance: item.balance || undefined,
    monthsLate: item.monthsLate || undefined,
    monthLate: item.monthLate || undefined,
  };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DisputeGenerateModal({
  opened,
  onClose,
  clientId,
  prePopulatedData,
}: DisputeGenerateModalProps) {
  // ---- Queries ----
  const client = useQuery(api.clients.getClient, { clientId });
  const allLetters = useQuery(api.letters.getLetters);
  const templateStats = useQuery(api.letters.getTemplateStats);

  // ---- Derived: dispute types that have at least one letter ----
  const availableDisputeTypes = useMemo(() => {
    if (!allLetters) return [];
    const types = new Set(allLetters.flatMap(l => l.disputeTypes as string[]));
    return [...types].sort();
  }, [allLetters]);

  // ---- Mutations / Actions ----
  const createDisputeItems = useMutation(api.clients.createDisputeItems);
  const generatePdf = useAction(api.pdf.generatePdf);
  const logGeneration = useMutation(api.letters.logGeneration);
  const markDownloaded = useMutation(api.letters.markGenerationDownloaded);

  // ---- Responsive ----
  const isDesktop = useMediaQuery('(min-width: 62em)') ?? true;

  // ---- Step 1: Dispute Type ----
  const [disputeType, setDisputeType] = useState('');

  // ---- Step 2: CRAs ----
  const [craTargets, setCraTargets] = useState<string[]>([]);

  // ---- Step 3: Template ----
  const [selectedLetter, setSelectedLetter] = useState<ConvexLetter | null>(null);

  // ---- Step 4: Dispute Items ----
  const [perCraMode, setPerCraMode] = useState(false);
  const [sharedItems, setSharedItems] = useState<DisputeItem[]>([defaultItem()]);
  const [craItems, setCraItems] = useState<Record<string, DisputeItem[]>>({});

  // ---- Step 5: Preview ----
  const [previewCra, setPreviewCra] = useState('');
  const [dimPreview, setDimPreview] = useState(false);
  const [downloadedCras, setDownloadedCras] = useState<Set<string>>(new Set());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ---- Retry safety ----
  const [createdDisputes, setCreatedDisputes] = useState<{ id: string; craTarget: string }[]>([]);

  // ---- Mode ----
  const [mode, setMode] = useState<'new' | 'existing'>('new');

  // ---- Mobile ----
  const [mobileView, setMobileView] = useState<string>('form');

  // ---- Type change confirmation ----
  const [pendingTypeChange, setPendingTypeChange] = useState<string | null>(null);

  // ---- Focus Tracking for Gutter ----
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const isItemFocused = useMemo(() => {
    if (!focusedField) return false;
    const itemFields = ['creditorName', 'accountNumber', 'inquiryDate', 'dateOpened', 'balance', 'monthsLate', 'monthLate'];
    return itemFields.includes(focusedField);
  }, [focusedField]);

  // =========================================================================
  // DERIVED STATE
  // =========================================================================

  const applicableCras = useMemo(
    () => (disputeType ? getCrasForDisputeType(disputeType) : []),
    [disputeType],
  );

  const selectedCRAs = craTargets;

  // Schema group for the current dispute type
  const schema: DisputeItemSchema | undefined = useMemo(
    () => (disputeType ? getSchemaGroupForType(disputeType) : undefined),
    [disputeType],
  );

  // Valid item count
  const validItemCount = useMemo(() => {
    if (!schema) return 0;
    const requiredKey = schema.fields.find(f => f.required)?.key || 'creditorName';
    if (!perCraMode) {
      return sharedItems.filter(i => i[requiredKey]?.trim()).length;
    }
    if (selectedCRAs.length === 0) return 0;
    return Math.max(
      ...selectedCRAs.map(cra =>
        (craItems[cra] || []).filter(i => i[requiredKey]?.trim()).length,
      ),
    );
  }, [perCraMode, sharedItems, selectedCRAs, craItems, schema]);

  const hasValidItems = validItemCount > 0;

  // Template filtering — matches dispute type AND at least one selected CRA
  const matchingTemplates = useMemo(() => {
    if (!allLetters || !disputeType) return [];
    return allLetters.filter(letter => {
      const matchesType = (letter.disputeTypes as string[]).includes(disputeType);
      const matchesCRA =
        letter.applicableCRAs.length === 0 ||
        selectedCRAs.some(cra => letter.applicableCRAs.includes(cra));
      return matchesType && matchesCRA;
    });
  }, [allLetters, disputeType, selectedCRAs]);

  // Limits
  const maxItems = selectedLetter?.maxDisputeItems as number | undefined;
  const itemsExceedLimit = maxItems ? validItemCount > maxItems : false;

  // Preview
  const canPreview = !!selectedLetter && !!client && hasValidItems && !!previewCra;

  const hydratedHtml = useMemo(() => {
    if (!client || !selectedLetter || !previewCra) return '';
    const items = perCraMode ? (craItems[previewCra] || []) : sharedItems;
    const requiredKey = schema?.fields.find(f => f.required)?.key || 'creditorName';
    const validItems = items.filter(i => i[requiredKey]?.trim());

    const data: HydrationData = {
      firstName: client.firstName,
      lastName: client.lastName,
      address1: client.address1,
      address2: client.address2,
      city: client.city,
      state: client.state,
      zipCode: client.zipCode,
      last4SSN: client.last4SSN,
      email: client.email,
      phone: client.phone,
      dateOfBirth: client.dateOfBirth,
      disputeType,
      disputeItems: validItems.map(toHydrationItem),
    };

    return hydrateTemplate(selectedLetter.content, data);
  }, [client, selectedLetter, previewCra, disputeType, perCraMode, craItems, sharedItems, schema]);

  const unresolvedTags = useMemo(
    () => (hydratedHtml ? findUnresolvedTags(hydratedHtml) : []),
    [hydratedHtml],
  );

  // Download tracking
  const allDownloaded =
    selectedCRAs.length > 0 && selectedCRAs.every(cra => downloadedCras.has(cra));
  const remainingCount = selectedCRAs.filter(cra => !downloadedCras.has(cra)).length;

  // Section visibility (progressive disclosure)
  const showCras = !!disputeType;
  const showTemplate = showCras && selectedCRAs.length > 0;
  const showItems = !!selectedLetter;
  const showLeftPanel = isDesktop || mobileView === 'form';
  const showRightPanel = isDesktop || mobileView === 'preview';

  // =========================================================================
  // EFFECTS
  // =========================================================================

  // Initialize pre-populated mode
  useEffect(() => {
    if (opened && prePopulatedData) {
      setMode('existing');
      setDisputeType(prePopulatedData.disputeType);
      setCraTargets(prePopulatedData.craTargets);

      const items = prePopulatedData.items.map(d => {
        const item: DisputeItem = { id: d._id };
        if (d.creditorName) item.creditorName = d.creditorName;
        if (d.accountNumber) item.accountNumber = d.accountNumber;
        if (d.inquiryDate) item.inquiryDate = d.inquiryDate;
        if (d.dateOpened) item.dateOpened = d.dateOpened;
        if (d.balance) item.balance = d.balance;
        if (d.monthsLate) item.monthsLate = d.monthsLate;
        if (d.monthLate) item.monthLate = d.monthLate;
        return item;
      });
      setSharedItems(items.length > 0 ? items : [defaultItem()]);
      setCreatedDisputes(
        prePopulatedData.items.map(d => ({ id: d._id, craTarget: d.craTarget })),
      );
    }
  }, [opened, prePopulatedData]);

  // Sync previewCra
  useEffect(() => {
    if (selectedCRAs.length > 0 && !selectedCRAs.includes(previewCra)) {
      setPreviewCra(selectedCRAs[0]);
    }
  }, [selectedCRAs, previewCra]);

  // Reset template when dispute type or CRAs change (new mode only)
  const craTargetsKey = craTargets.join(',');
  useEffect(() => {
    if (mode === 'new') {
      setSelectedLetter(null);
    }
  }, [disputeType, craTargetsKey, mode]);

  // Auto-select template when exactly one matches
  useEffect(() => {
    if (matchingTemplates.length === 1 && !selectedLetter) {
      setSelectedLetter(matchingTemplates[0] as ConvexLetter);
    }
  }, [matchingTemplates, selectedLetter]);

  // Auto-select CRA for single-CRA dispute types
  useEffect(() => {
    if (mode === 'new' && applicableCras.length === 1 && craTargets.length === 0) {
      setCraTargets([applicableCras[0]]);
    }
  }, [applicableCras, mode, craTargets.length]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const applyDisputeTypeChange = (value: string) => {
    setDisputeType(value);
    setCraTargets([]);
    setSharedItems([defaultItem()]);
    setCraItems({});
    setPerCraMode(false);
    setSelectedLetter(null);
    setCreatedDisputes([]);
    setPendingTypeChange(null);
  };

  const handleDisputeTypeChange = (value: string | null) => {
    const newValue = value || '';
    const requiredKey = schema?.fields.find(f => f.required)?.key || 'creditorName';
    const hasExistingItems =
      sharedItems.some(i => i[requiredKey]?.trim()) ||
      Object.values(craItems).some(items => items.some(i => i[requiredKey]?.trim()));

    if (hasExistingItems) {
      setPendingTypeChange(newValue);
    } else {
      applyDisputeTypeChange(newValue);
    }
  };

  const handleCraChange = (values: string[]) => {
    setCraTargets(values);
    if (perCraMode) {
      setCraItems(prev => {
        const updated = { ...prev };
        for (const cra of values) {
          if (!updated[cra] || updated[cra].length === 0) {
            updated[cra] = [defaultItem()];
          }
        }
        return updated;
      });
    }
  };

  const handlePerCraModeToggle = (checked: boolean) => {
    setPerCraMode(checked);
    if (checked) {
      setCraItems(prev => {
        const updated = { ...prev };
        for (const cra of selectedCRAs) {
          if (!updated[cra] || updated[cra].length === 0) {
            updated[cra] = sharedItems.map(item => ({ ...item, id: crypto.randomUUID() }));
          }
        }
        return updated;
      });
    }
  };

  const updateItem = (cra: string, index: number, field: string, value: string) => {
    if (cra === 'shared') {
      setSharedItems(prev =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      );
    } else {
      setCraItems(prev => ({
        ...prev,
        [cra]: (prev[cra] || []).map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      }));
    }
  };

  const addItem = (cra: string) => {
    const newItem = defaultItem();
    if (cra === 'shared') {
      setSharedItems(prev => [...prev, newItem]);
    } else {
      setCraItems(prev => ({ ...prev, [cra]: [...(prev[cra] || []), newItem] }));
    }
  };

  const removeItem = (cra: string, index: number) => {
    if (cra === 'shared') {
      setSharedItems(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    } else {
      setCraItems(prev => {
        const items = prev[cra] || [];
        return items.length <= 1 ? prev : { ...prev, [cra]: items.filter((_, i) => i !== index) };
      });
    }
  };

  const handleTemplateSelect = (letterId: string) => {
    const letter = matchingTemplates.find(l => l._id === letterId);
    if (letter) {
      setSelectedLetter(letter as ConvexLetter);
    }
  };

  // ---- Download flow ----

  const handleDownloadPdf = async (cra: string) => {
    if (!selectedLetter || !client || isGeneratingPdf || itemsExceedLimit) return;

    setIsGeneratingPdf(true);
    try {
      let disputes = createdDisputes;

      // Save dispute items to DB if not yet saved
      if (disputes.length === 0 && mode === 'new') {
        const payload: Record<string, unknown>[] = [];

        for (const c of selectedCRAs) {
          const items = perCraMode ? (craItems[c] || []) : sharedItems;
          const requiredKey = schema?.fields.find(f => f.required)?.key || 'creditorName';
          for (const item of items) {
            if (!item[requiredKey]?.trim()) continue;
            const entry: Record<string, unknown> = {
              disputeType,
              craTarget: c,
              creditorName: item.creditorName?.trim() || '',
            };
            // Add schema-specific fields
            if (schema) {
              for (const field of schema.fields) {
                if (field.key !== 'creditorName' && item[field.key]?.trim()) {
                  entry[field.key] = item[field.key].trim();
                }
              }
            }
            payload.push(entry);
          }
        }

        try {
          disputes = await createDisputeItems({
            clientId,
            items: payload as {
              disputeType: string;
              craTarget: string;
              creditorName: string;
              accountNumber?: string;
              inquiryDate?: string;
              dateOpened?: string;
              balance?: string;
              monthsLate?: string;
              monthLate?: string;
            }[],
          });
          setCreatedDisputes(disputes);
        } catch {
          notifications.show({
            title: 'Error',
            message: 'Ghost hit a snag. Failed to save dispute items.',
            color: 'red',
          });
          return;
        }
      }

      // Get dispute IDs for this CRA
      const craDisputeIds = disputes
        .filter(d => d.craTarget === cra)
        .map(d => d.id as Id<'disputeItems'>);

      // Hydrate template
      const items = perCraMode ? (craItems[cra] || []) : sharedItems;
      const requiredKey = schema?.fields.find(f => f.required)?.key || 'creditorName';
      const validItems = items.filter(i => i[requiredKey]?.trim());

      const hydrationData: HydrationData = {
        firstName: client.firstName,
        lastName: client.lastName,
        address1: client.address1,
        address2: client.address2,
        city: client.city,
        state: client.state,
        zipCode: client.zipCode,
        last4SSN: client.last4SSN,
        email: client.email,
        phone: client.phone,
        dateOfBirth: client.dateOfBirth,
        disputeType,
        disputeItems: validItems.map(toHydrationItem),
      };

      let html: string;
      try {
        html = hydrateTemplate(selectedLetter.content, hydrationData);
      } catch (err) {
        notifications.show({
          title: 'Missing Required Fields',
          message: err instanceof Error ? err.message : 'Could not generate letter — required fields are missing.',
          color: 'red',
        });
        return;
      }

      // Generate PDF
      let result;
      try {
        result = await generatePdf({ html });
      } catch {
        notifications.show({ title: 'Error', message: 'Failed to generate PDF.', color: 'red' });
        return;
      }

      // Create draft generation log before download
      const disputeIds = craDisputeIds.length > 0
        ? craDisputeIds
        : disputes.map(d => d.id as Id<'disputeItems'>);

      let genLog: { _id: Id<'generationLogs'> } | null = null;
      try {
        genLog = await logGeneration({
          clientId,
          letterId: selectedLetter._id as Id<'letters'>,
          disputeItemIds: disputeIds,
        });
      } catch {
        // Non-blocking — download can proceed without the log
      }

      // Download
      downloadBase64Pdf(
        result.base64,
        `${disputeType}_${getCraLabel(cra)}_${client.firstName}_${client.lastName}.pdf`,
      );

      // Mark the log as downloaded
      if (genLog?._id) {
        try {
          await markDownloaded({ logId: genLog._id });
        } catch {
          notifications.show({
            title: 'Warning',
            message: 'PDF downloaded but generation log failed to update.',
            color: 'yellow',
          });
        }
      }

      setDownloadedCras(prev => new Set([...prev, cra]));

      notifications.show({
        title: 'Letter Generated',
        message: `Ghost wrote ${selectedLetter.title} for ${client.firstName} ${client.lastName} (${getCraLabel(cra)}).`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadAll = async () => {
    for (const cra of selectedCRAs.filter(c => !downloadedCras.has(c))) {
      await handleDownloadPdf(cra);
    }
  };

  const handleTagClick = (fieldKey: string) => {
    // Find the input by name or data-field-key
    const selector = `[data-field-key="${fieldKey}"]`;
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // If it's a focusable input, focus it
      const input = element.querySelector('input, select, textarea') as HTMLElement;
      if (input) input.focus();
    }
  };

  const handleClose = () => {
    setDisputeType('');
    setCraTargets([]);
    setPerCraMode(false);
    setSharedItems([defaultItem()]);
    setCraItems({});
    setSelectedLetter(null);
    setPreviewCra('');
    setDownloadedCras(new Set());
    setCreatedDisputes([]);
    setMode('new');
    setMobileView('form');
    setPendingTypeChange(null);
    setIsGeneratingPdf(false);
    onClose();
  };

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================

  /** Render item cards with dynamic fields based on schema group */
  const renderItemList = (cra: string) => {
    const items = cra === 'shared' ? sharedItems : (craItems[cra] || []);
    const isReadOnly = mode === 'existing';
    const canAddMore = !maxItems || items.length < maxItems;

    if (!schema) return null;

    return (
      <Stack gap="sm">
        {items.map((item, index) => (
          <Card key={item.id} withBorder padding="sm" radius="sm">
            <Group align="flex-start" gap="sm" wrap="wrap">
              {schema.fields.map(field => {
                const commonProps = {
                  label: field.label,
                  placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`,
                  required: field.required,
                  readOnly: isReadOnly,
                  style: { flex: 1, minWidth: 120 },
                  'data-field-key': field.key,
                  onFocus: () => setFocusedField(field.key),
                  onBlur: () => setFocusedField(null),
                };

                if (field.type === 'select' && field.options) {
                  return (
                    <Select
                      key={field.key}
                      {...commonProps}
                      data={field.options}
                      value={item[field.key] || null}
                      onChange={val => updateItem(cra, index, field.key, val || '')}
                    />
                  );
                }
                return (
                  <TextInput
                    key={field.key}
                    {...commonProps}
                    value={item[field.key] || ''}
                    onChange={e => updateItem(cra, index, field.key, e.currentTarget.value)}
                  />
                );
              })}
              {!isReadOnly && (
                <ActionIcon
                  color="red"
                  variant="subtle"
                  mt={25}
                  onClick={() => removeItem(cra, index)}
                  disabled={items.length === 1}
                  aria-label="Remove item"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              )}
            </Group>
          </Card>
        ))}

        {!isReadOnly && (
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => addItem(cra)}
            fullWidth
            disabled={!canAddMore}
          >
            Add Item
          </Button>
        )}
      </Stack>
    );
    };

    // =========================================================================
    // VIEW RENDERERS
    // =========================================================================

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={client ? `Generate Letter — ${client.firstName} ${client.lastName}` : 'Generate Letter'}
        fullScreen
        closeOnClickOutside={false}
        closeOnEscape={!isGeneratingPdf}
        styles={{
          header: { borderBottom: '1px solid var(--border-default)' },
          body: { padding: 0 },
        }}
      >
        <Stack gap={0} h={`calc(100vh - ${LAYOUT.HEADER_LAYER1}px)`} bg="var(--bg-base)" style={{ paddingBottom: isDesktop ? undefined : LAYOUT.MOBILE_NAV_HEIGHT }}>
          {/* ============================================================= */}
          {/* COMPACT CONFIG HEADER — Steps 1-3                             */}
          {/* ============================================================= */}
          <Paper
            withBorder
            radius={0}
            p="md"
            style={{ borderTop: 0, borderLeft: 0, borderRight: 0, zIndex: Z.CONFIG_HEADER }}
          >
            <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
              <Group gap="md" style={{ flex: 1 }} wrap="wrap">
                {/* Step 1: Type */}
                <Select
                  label="1. DISPUTE TYPE"
                  placeholder="Select type"
                  data={availableDisputeTypes}
                  value={disputeType || null}
                  onChange={handleDisputeTypeChange}
                  disabled={mode === 'existing'}
                  style={{ flex: 1, minWidth: 150, maxWidth: 280 }}
                  size="xs"
                />

                {/* Step 2: CRAs */}
                {showCras && applicableCras.length > 0 && (
                  <Stack gap="xs">
                    <Text fw={FW.LABEL} size="xs" tt="uppercase" c="dimmed" style={{ letterSpacing: 'var(--ls-wide)' }}>
                      2. CREDIT BUREAUS
                    </Text>
                    <Chip.Group multiple value={craTargets} onChange={handleCraChange}>
                      <Group gap="xs">
                        {applicableCras.map(cra => (
                          <Chip key={cra} value={cra} variant="outline" size="xs" disabled={mode === 'existing'}>
                            {getCraLabel(cra)}
                          </Chip>
                        ))}
                      </Group>
                    </Chip.Group>
                  </Stack>
                )}

                {/* Step 3: Template */}
                {showTemplate && (
                  <Select
                    label="3. LETTER TEMPLATE"
                    placeholder="Select template"
                    data={matchingTemplates.map(t => ({ value: t._id, label: t.title }))}
                    value={selectedLetter?._id || null}
                    onChange={(val) => handleTemplateSelect(val || '')}
                    style={{ flex: 1, minWidth: 180, maxWidth: 360 }}
                    size="xs"
                    error={matchingTemplates.length === 0 ? 'No templates found' : null}
                  />
                )}
              </Group>

              {/* Status Stats */}
              <Group gap="lg" visibleFrom="lg">
                <Stack gap={0} align="flex-end">
                  <Text size="xs" fw={FW.HEADING} c="dimmed">DISPUTE ITEMS</Text>
                  <Text size="sm" fw={FW.HERO}>{validItemCount} / {maxItems || '∞'}</Text>
                </Stack>
                {selectedLetter && templateStats?.[selectedLetter._id] && (
                  <Stack gap={0} align="flex-end">
                    <Text size="xs" fw={FW.HEADING} c="dimmed">TEMPLATE SUCCESS</Text>
                    <Text size="sm" fw={FW.HERO} c="green">{templateStats[selectedLetter._id].successRate}%</Text>
                  </Stack>
                )}
              </Group>
            </Group>
          </Paper>

          {/* ============================================================= */}
          {/* WORKBENCH BODY — Steps 4-5                                    */}
          {/* ============================================================= */}
          <Grid gutter={0} style={{ flex: 1, minHeight: 0 }}>
            {/* Gutter: Smart Tags Reference (Responsive) */}
            
            {/* 1. Wide screens: Full Sidebar */}
            <Grid.Col
              span={{ base: 0, xl: 1.5 }}
              visibleFrom="xl"
              style={{ borderRight: '1px solid var(--border-default)' }}
              p="md"
            >
              <ScrollArea h="100%" type="auto">
                <SmartTagsReference
                  letterContent={selectedLetter?.content}
                  unresolvedTags={unresolvedTags}
                  onTagClick={handleTagClick}
                  isItemFocused={isItemFocused}
                  displayMode="full"
                />
              </ScrollArea>
            </Grid.Col>

            {/* 2. Medium screens: Icon-only column */}
            <Grid.Col
              span={{ base: 0, md: 0.8, xl: 0 }}
              visibleFrom="md"
              hiddenFrom="xl"
              style={{ borderRight: '1px solid var(--border-default)' }}
              p="xs"
            >
              <ScrollArea h="100%" type="auto">
                <SmartTagsReference
                  letterContent={selectedLetter?.content}
                  unresolvedTags={unresolvedTags}
                  onTagClick={handleTagClick}
                  isItemFocused={isItemFocused}
                  displayMode="iconOnly"
                />
              </ScrollArea>
            </Grid.Col>

            {/* LEFT: Item Editor */}
            <Grid.Col
              span={{ base: 12, md: 4.7, xl: 4.5 }}
              style={{
                borderRight: '1px solid var(--border-default)',
                display: showLeftPanel ? undefined : 'none',
              }}
            >
              <ScrollArea h="100%" type="auto" p="lg">
                <Stack gap="xl">
                  {mode === 'existing' && (
                    <Alert variant="light" color="action">
                      Generating for existing dispute items. Edit items from the client profile.
                    </Alert>
                  )}

                  {showItems && schema ? (
                    <Stack gap="lg">
                      <Group justify="space-between" align="center">
                        <Text fw={FW.HEADING} size="sm" tt="uppercase" style={{ letterSpacing: 'var(--ls-wide)' }} c="dimmed">
                          4. DISPUTE ITEMS
                        </Text>
                        {selectedCRAs.length > 1 && mode === 'new' && (
                          <Switch
                            label="Customize per CRA"
                            size="xs"
                            checked={perCraMode}
                            onChange={e => handlePerCraModeToggle(e.currentTarget.checked)}
                          />
                        )}
                      </Group>

                      {perCraMode ? (
                        <Tabs defaultValue={selectedCRAs[0]}>
                          <Tabs.List>
                            {selectedCRAs.map(cra => (
                              <Tabs.Tab key={cra} value={cra}>{getCraLabel(cra)}</Tabs.Tab>
                            ))}
                          </Tabs.List>
                          {selectedCRAs.map(cra => (
                            <Tabs.Panel key={cra} value={cra} pt="md">
                              {renderItemList(cra)}
                            </Tabs.Panel>
                          ))}
                        </Tabs>
                      ) : (
                        renderItemList('shared')
                      )}

                      {/* Item limit warning */}
                      {itemsExceedLimit && maxItems && (
                        <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />}>
                          <Text size="sm">
                            This template supports up to {maxItems} items, but {validItemCount} are entered.
                          </Text>
                        </Alert>
                      )}
                    </Stack>
                  ) : (
                    <Center h={200}>
                      <Stack align="center" gap="sm">
                        <IconCircle size={40} color="var(--text-muted)" stroke={1} />
                        <Text c="dimmed" size="sm" ta="center">
                          Select a template above to <br /> start adding dispute items.
                        </Text>
                      </Stack>
                    </Center>
                  )}
                </Stack>
              </ScrollArea>
            </Grid.Col>

            {/* RIGHT: Live Preview */}
            <Grid.Col
              span={{ base: 12, md: 6.5, xl: 6 }}
              style={{ display: showRightPanel ? undefined : 'none' }}
              bg="var(--bg-inset)"
            >
              <Stack h="100%" p="lg" gap="md">
                <Group justify="space-between" align="center">
                  <Text fw={FW.HEADING} size="sm" tt="uppercase" style={{ letterSpacing: 'var(--ls-wide)' }} c="dimmed">
                    5. LIVE PREVIEW
                  </Text>

                  <Group gap="sm">
                    <Tooltip label="Eye Comfort" withArrow>
                      <ActionIcon
                        variant={dimPreview ? 'filled' : 'subtle'}
                        color={dimPreview ? 'yellow.6' : 'gray'}
                        size="sm"
                        onClick={() => setDimPreview(prev => !prev)}
                        aria-label="Toggle eye comfort mode"
                      >
                        <IconSunglasses size={16} />
                      </ActionIcon>
                    </Tooltip>
                    {selectedCRAs.length > 1 && (
                      <SegmentedControl
                        value={previewCra}
                        onChange={setPreviewCra}
                        data={selectedCRAs.map(cra => ({
                          value: cra,
                          label: getCraLabel(cra),
                        }))}
                        size="xs"
                      />
                    )}
                  </Group>
                </Group>

                {/* Unresolved tags warning */}
                {unresolvedTags.length > 0 && canPreview && (
                  <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light" py="xs">
                    <Text size="xs" fw={FW.HEADING}>Unresolved tags detected</Text>
                    <Text size="xs">
                      {unresolvedTags.map(tag => `{{${tag}}}`).join(', ')}
                    </Text>
                  </Alert>
                )}

                {/* Preview iframe */}
                <Paper withBorder radius="sm" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }} shadow="sm">
                  {canPreview ? (
                    <iframe
                      sandbox=""
                      srcDoc={wrapHtmlForPreview(hydratedHtml)}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        backgroundColor: dimPreview ? 'var(--bg-inset)' : 'var(--bg-surface)',
                        filter: dimPreview ? 'sepia(0.3) brightness(0.9)' : undefined,
                        transition: `filter var(--duration-default) var(--ease-default), background-color var(--duration-default) var(--ease-default)`,
                      }}

                      title={`${getCraLabel(previewCra)} Letter Preview`}
                    />
                  ) : (
                    <Center h="100%">
                      <Stack align="center" gap="sm">
                        <IconFileText size={48} color="var(--text-tertiary)" stroke={1} />
                        <Text c="dimmed" size="sm">
                          Letter preview will appear here.
                        </Text>
                      </Stack>
                    </Center>
                  )}
                </Paper>

                {/* Download controls */}
                {canPreview && !itemsExceedLimit && (
                  <Group justify="flex-end">
                    {selectedCRAs.length > 1 && (
                      <Button
                        variant="subtle"
                        leftSection={<IconDownload size={16} />}
                        onClick={handleDownloadAll}
                        loading={isGeneratingPdf}
                        disabled={allDownloaded}
                      >
                        Download All ({remainingCount})
                      </Button>
                    )}
                    <Button
                      leftSection={
                        downloadedCras.has(previewCra)
                          ? <IconCheck size={16} />
                          : <IconDownload size={16} />
                      }
                      onClick={() => handleDownloadPdf(previewCra)}
                      loading={isGeneratingPdf}
                      color={downloadedCras.has(previewCra) ? 'green' : undefined}
                      size="md"
                      px="xl"
                    >
                      {downloadedCras.has(previewCra) ? 'Downloaded' : `Download ${getCraLabel(previewCra)} PDF`}
                    </Button>
                  </Group>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>

        {/* Sticky bottom toggle for mobile */}
        <Paper
          hiddenFrom="md"
          p="sm"
          withBorder
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: Z.MOBILE_NAV,
            borderLeft: 0,
            borderRight: 0,
            borderBottom: 0,
          }}
        >
          <SegmentedControl
            value={mobileView}
            onChange={setMobileView}
            data={[
              { value: 'form', label: <Group gap={6} justify="center"><IconEdit size={16} /> Input Data</Group> },
              { value: 'preview', label: <Group gap={6} justify="center"><IconEye size={16} /> Preview Letter</Group> },
            ]}
            fullWidth
          />
        </Paper>
      </Modal>

      {/* Type change confirmation modal */}
      <Modal
        opened={pendingTypeChange !== null}
        onClose={() => setPendingTypeChange(null)}
        title="Change Dispute Type?"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">Changing type will clear all items. Continue?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPendingTypeChange(null)}>
              Cancel
            </Button>
            <Button color="red" onClick={() => applyDisputeTypeChange(pendingTypeChange!)}>
              Change Type
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
