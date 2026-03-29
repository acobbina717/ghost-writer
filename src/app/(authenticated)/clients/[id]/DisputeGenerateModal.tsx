'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Modal, Grid, ScrollArea, Stack, Group, Text, Select, Chip, Switch,
  Tabs, Card, TextInput, ActionIcon, Button, Paper, Badge, Radio,
  SegmentedControl, Alert, Center, Loader,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconPlus, IconTrash, IconFileText, IconCheck, IconCircle,
  IconDownload, IconAlertCircle,
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
// TemplateStats
// ---------------------------------------------------------------------------

function TemplateStats({
  stats,
  inline,
}: {
  stats: { successRate: number | null; usageCount: number } | undefined;
  inline?: boolean;
}) {
  if (!stats) return null;
  const text =
    stats.successRate !== null
      ? `${stats.successRate}% success rate · Used ${stats.usageCount} time${stats.usageCount !== 1 ? 's' : ''}`
      : stats.usageCount > 0
        ? `Used ${stats.usageCount} time${stats.usageCount !== 1 ? 's' : ''}`
        : 'No outcome data yet';
  return (
    <Text size="xs" c="dimmed" component={inline ? 'span' : 'p'}>
      {text}
    </Text>
  );
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

  // ---- Responsive ----
  const isDesktop = useMediaQuery('(min-width: 62em)') ?? true;

  // ---- Step 1: Dispute Type ----
  const [disputeType, setDisputeType] = useState('');

  // ---- Step 2: CRAs ----
  const [craTargets, setCraTargets] = useState<string[]>([]);

  // ---- Step 3: Template ----
  const [selectedLetter, setSelectedLetter] = useState<ConvexLetter | null>(null);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  // ---- Step 4: Dispute Items ----
  const [perCraMode, setPerCraMode] = useState(false);
  const [sharedItems, setSharedItems] = useState<DisputeItem[]>([defaultItem()]);
  const [craItems, setCraItems] = useState<Record<string, DisputeItem[]>>({});

  // ---- Step 5: Preview ----
  const [previewCra, setPreviewCra] = useState('');
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
      setShowAllTemplates(false);
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
    setShowAllTemplates(false);
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
      setShowAllTemplates(false);
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

      const html = hydrateTemplate(selectedLetter.content, hydrationData);

      // Generate PDF
      let result;
      try {
        result = await generatePdf({ html });
      } catch {
        notifications.show({ title: 'Error', message: 'Failed to generate PDF.', color: 'red' });
        return;
      }

      // Download
      downloadBase64Pdf(
        result.base64,
        `${disputeType}_${getCraLabel(cra)}_${client.firstName}_${client.lastName}.pdf`,
      );

      // Log generation
      try {
        await logGeneration({
          clientId,
          letterId: selectedLetter._id as Id<'letters'>,
          disputeItemIds:
            craDisputeIds.length > 0
              ? craDisputeIds
              : disputes.map(d => d.id as Id<'disputeItems'>),
        });
      } catch {
        notifications.show({
          title: 'Warning',
          message: 'PDF downloaded but generation log failed to save.',
          color: 'yellow',
        });
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

  const handleClose = () => {
    setDisputeType('');
    setCraTargets([]);
    setPerCraMode(false);
    setSharedItems([defaultItem()]);
    setCraItems({});
    setSelectedLetter(null);
    setShowAllTemplates(false);
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
                if (field.type === 'select' && field.options) {
                  return (
                    <Select
                      key={field.key}
                      label={field.label}
                      placeholder={`Select ${field.label.toLowerCase()}`}
                      data={field.options}
                      value={item[field.key] || null}
                      onChange={val => updateItem(cra, index, field.key, val || '')}
                      readOnly={isReadOnly}
                      style={{ flex: 1, minWidth: 120 }}
                      required={field.required}
                    />
                  );
                }
                return (
                  <TextInput
                    key={field.key}
                    label={field.label}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    value={item[field.key] || ''}
                    onChange={e => updateItem(cra, index, field.key, e.currentTarget.value)}
                    readOnly={isReadOnly}
                    style={{ flex: 1, minWidth: 120 }}
                    required={field.required}
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

  const renderCraBadges = (cras: string[]) => {
    if (cras.length === 0) {
      return <Badge size="xs" variant="light" color="gray">All CRAs</Badge>;
    }
    return cras.map(cra => {
      const info = getCraInfo(cra);
      return (
        <Badge key={cra} size="xs" variant="light" color={info.color}>
          {info.label}
        </Badge>
      );
    });
  };

  // =========================================================================
  // JSX
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
        {/* Mobile toggle */}
        <Group hiddenFrom="md" px="md" pt="md">
          <SegmentedControl
            value={mobileView}
            onChange={setMobileView}
            data={[
              { value: 'form', label: 'Form' },
              { value: 'preview', label: 'Preview' },
            ]}
            fullWidth
            style={{ flex: 1 }}
          />
        </Group>

        <Grid gutter={0} styles={{ root: { height: 'calc(100vh - 60px)' } }}>
          {/* ============================================================= */}
          {/* LEFT PANEL — Steps 1-4                                        */}
          {/* ============================================================= */}
          <Grid.Col
            span={{ base: 12, md: 5 }}
            style={{
              borderRight: '1px solid var(--border-default)',
              display: showLeftPanel ? undefined : 'none',
            }}
          >
            <ScrollArea h="100%" type="auto" p="lg">
              <Stack gap="xl">
                {mode === 'existing' && (
                  <Alert variant="light" color="blue">
                    <Text size="xs">
                      Generating for existing dispute items. Edit items from the client profile.
                    </Text>
                  </Alert>
                )}

                {/* ------ Step 1: Dispute Type ------ */}
                <Stack gap="lg">
                  <Text fw={600} size="sm" tt="uppercase" style={{ letterSpacing: '0.05em' }} c="dimmed">
                    1. Dispute Type
                  </Text>
                  <Select
                    label="Dispute Type"
                    placeholder="Select dispute type"
                    data={availableDisputeTypes}
                    searchable
                    required
                    value={disputeType || null}
                    onChange={handleDisputeTypeChange}
                    disabled={mode === 'existing'}
                  />
                </Stack>

                {/* ------ Step 2: CRAs ------ */}
                {showCras && applicableCras.length > 0 && (
                  <Stack gap="lg">
                    <Text fw={600} size="sm" tt="uppercase" style={{ letterSpacing: '0.05em' }} c="dimmed">
                      2. Credit Reporting Agencies
                    </Text>
                    <Chip.Group multiple value={craTargets} onChange={handleCraChange}>
                      <Group gap="sm">
                        {applicableCras.map(cra => (
                          <Chip key={cra} value={cra} variant="outline" disabled={mode === 'existing'}>
                            {getCraLabel(cra)}
                          </Chip>
                        ))}
                      </Group>
                    </Chip.Group>
                  </Stack>
                )}

                {/* ------ Step 3: Template ------ */}
                {showTemplate && (
                  <Stack gap="sm">
                    <Text fw={600} size="sm" tt="uppercase" style={{ letterSpacing: '0.05em' }} c="dimmed">
                      {matchingTemplates.length > 1 && !selectedLetter
                        ? `3. Template — ${matchingTemplates.length} available`
                        : '3. Template'}
                    </Text>

                    {allLetters === undefined && (
                      <Center p="xl"><Loader size="md" /></Center>
                    )}

                    {allLetters !== undefined && matchingTemplates.length === 0 && (
                      <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />}>
                        No templates available for this dispute type and CRA combination.
                      </Alert>
                    )}

                    {selectedLetter && !showAllTemplates && (
                      <Paper withBorder p="md" radius="sm">
                        <Group justify="space-between" align="flex-start">
                          <Stack gap={4}>
                            <Group gap="sm">
                              <IconFileText size={18} />
                              <Text fw={500} size="sm">{selectedLetter.title}</Text>
                            </Group>
                            <Group gap="xs">
                              {renderCraBadges(selectedLetter.applicableCRAs)}
                            </Group>
                            <TemplateStats stats={templateStats?.[selectedLetter._id]} />
                          </Stack>
                          {matchingTemplates.length > 1 && (
                            <Button variant="subtle" size="xs" onClick={() => setShowAllTemplates(true)}>
                              View Others
                            </Button>
                          )}
                        </Group>
                      </Paper>
                    )}

                    {matchingTemplates.length > 1 && (!selectedLetter || showAllTemplates) && (
                      <Radio.Group value={selectedLetter?._id ?? ''} onChange={handleTemplateSelect}>
                        <Stack gap="sm">
                          {matchingTemplates.map(letter => (
                            <Radio
                              key={letter._id}
                              value={letter._id}
                              label={
                                <Group gap="xs">
                                  <Text size="sm" fw={500}>{letter.title}</Text>
                                  <TemplateStats stats={templateStats?.[letter._id]} inline />
                                </Group>
                              }
                              description={
                                <Group gap="xs" mt={2}>
                                  {renderCraBadges(letter.applicableCRAs)}
                                </Group>
                              }
                            />
                          ))}
                        </Stack>
                      </Radio.Group>
                    )}
                  </Stack>
                )}

                {/* ------ Step 4: Dispute Items ------ */}
                {showItems && schema && (
                  <Stack gap="lg">
                    <Group justify="space-between" align="center">
                      <Text fw={600} size="sm" tt="uppercase" style={{ letterSpacing: '0.05em' }} c="dimmed">
                        4. Dispute Items
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
                )}
              </Stack>
            </ScrollArea>
          </Grid.Col>

          {/* ============================================================= */}
          {/* RIGHT PANEL — Step 5: Live Preview + Downloads                */}
          {/* ============================================================= */}
          <Grid.Col
            span={{ base: 12, md: 7 }}
            style={{ display: showRightPanel ? undefined : 'none' }}
          >
            <Stack h="100%" p="lg" gap="md">
              {/* CRA Tab Bar */}
              {selectedCRAs.length > 0 && (
                <SegmentedControl
                  value={previewCra}
                  onChange={setPreviewCra}
                  data={selectedCRAs.map(cra => {
                    const info = getCraInfo(cra);
                    const downloaded = downloadedCras.has(cra);
                    return {
                      value: cra,
                      label: (
                        <Group gap={4}>
                          {downloaded && <IconCheck size={12} color="var(--mantine-color-green-6)" />}
                          <Text size="xs">{info.label}</Text>
                        </Group>
                      ),
                    };
                  })}
                  size="sm"
                />
              )}

              {/* Unresolved tags warning */}
              {unresolvedTags.length > 0 && canPreview && (
                <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                  <Text size="sm" fw={500}>Unresolved tags detected</Text>
                  <Text size="xs" mt="xs">
                    The following tags were not replaced:{' '}
                    {unresolvedTags.map(tag => `{{${tag}}}`).join(', ')}
                  </Text>
                </Alert>
              )}

              {/* Preview iframe */}
              <Paper withBorder radius="sm" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                {canPreview ? (
                  <iframe
                    sandbox=""
                    srcDoc={wrapHtmlForPreview(hydratedHtml)}
                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }}
                    title={`${getCraLabel(previewCra)} Letter Preview`}
                  />
                ) : (
                  <Center h="100%">
                    <Stack align="center" gap="sm">
                      <IconFileText size={48} color="var(--text-tertiary)" stroke={1} />
                      <Text c="dimmed" size="sm">
                        Fill in the form to see the letter preview.
                      </Text>
                    </Stack>
                  </Center>
                )}
              </Paper>

              {/* Download controls */}
              {canPreview && !itemsExceedLimit && (
                <>
                  {selectedCRAs.length === 1 ? (
                    <Group justify="flex-end">
                      <Button
                        leftSection={
                          downloadedCras.has(previewCra)
                            ? <IconCheck size={16} />
                            : <IconDownload size={16} />
                        }
                        onClick={() => handleDownloadPdf(previewCra)}
                        loading={isGeneratingPdf}
                        color={downloadedCras.has(previewCra) ? 'green' : undefined}
                      >
                        {downloadedCras.has(previewCra) ? 'Downloaded' : 'Download PDF'}
                      </Button>
                    </Group>
                  ) : (
                    <Paper withBorder p="md" radius="sm">
                      <Stack gap="sm">
                        {selectedCRAs.map(cra => {
                          const info = getCraInfo(cra);
                          const downloaded = downloadedCras.has(cra);
                          return (
                            <Group key={cra} justify="space-between">
                              <Group gap="xs">
                                {downloaded ? (
                                  <IconCheck size={16} color="var(--mantine-color-green-6)" />
                                ) : (
                                  <IconCircle size={16} color="var(--text-tertiary)" />
                                )}
                                <Text size="sm">{info.label}</Text>
                                <Text size="xs" c="dimmed">
                                  {downloaded ? 'Downloaded' : 'Ready'}
                                </Text>
                              </Group>
                              {!downloaded && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  onClick={() => handleDownloadPdf(cra)}
                                  loading={isGeneratingPdf}
                                >
                                  Download
                                </Button>
                              )}
                            </Group>
                          );
                        })}

                        {remainingCount > 0 && (
                          <Button
                            fullWidth
                            leftSection={<IconDownload size={16} />}
                            onClick={handleDownloadAll}
                            loading={isGeneratingPdf}
                          >
                            Download Remaining ({remainingCount})
                          </Button>
                        )}

                        {allDownloaded && client && (
                          <Text size="sm" c="dimmed" ta="center">
                            Ghost wrote {selectedCRAs.length} letter
                            {selectedCRAs.length !== 1 ? 's' : ''} for {client.firstName}{' '}
                            {client.lastName}.
                          </Text>
                        )}
                      </Stack>
                    </Paper>
                  )}
                </>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
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
