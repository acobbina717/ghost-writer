'use client';

import { useCallback, useEffect } from 'react';
import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize, LineHeight } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import { RichTextEditor, useRichTextEditorContext } from '@mantine/tiptap';
import { Box, Group, ScrollArea, Select } from '@mantine/core';
import { SmartTagsSidebar } from './SmartTagsSidebar';
import { LAYOUT } from '@/theme/ghost-theme';
import { DisputeItemsBlock, serializeDisputeBlocks, deserializeDisputeBlocks } from './extensions/DisputeItemsBlock';

const FONT_FAMILIES = [
  { value: '', label: 'Default (Arial)' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
];

const LINE_HEIGHTS = [
  { value: '', label: 'Line Height' },
  { value: '1', label: '1.0' },
  { value: '1.15', label: '1.15' },
  { value: '1.5', label: '1.5' },
  { value: '1.6', label: '1.6' },
  { value: '2', label: '2.0' },
  { value: '2.5', label: '2.5' },
  { value: '3', label: '3.0' },
];

const FONT_SIZES = [
  { value: '', label: 'Default (12pt)' },
  { value: '8pt', label: '8' },
  { value: '9pt', label: '9' },
  { value: '10pt', label: '10' },
  { value: '11pt', label: '11' },
  { value: '12pt', label: '12' },
  { value: '14pt', label: '14' },
  { value: '16pt', label: '16' },
  { value: '18pt', label: '18' },
  { value: '20pt', label: '20' },
  { value: '24pt', label: '24' },
  { value: '28pt', label: '28' },
  { value: '36pt', label: '36' },
];

function FontFamilyControl() {
  const { editor } = useRichTextEditorContext();
  const current = editor?.getAttributes('textStyle')?.fontFamily || '';

  const handleChange = useCallback(
    (value: string | null) => {
      if (!editor) return;
      if (!value) {
        editor.chain().focus().unsetFontFamily().run();
      } else {
        editor.chain().focus().setFontFamily(value).run();
      }
    },
    [editor],
  );

  return (
    <Select
      data={FONT_FAMILIES}
      value={current}
      onChange={handleChange}
      placeholder="Font"
      size="xs"
      w={150}
      styles={{ input: { height: 26, minHeight: 26 } }}
      comboboxProps={{ withinPortal: false }}
    />
  );
}

function FontSizeControl() {
  const { editor } = useRichTextEditorContext();
  const current = editor?.getAttributes('textStyle')?.fontSize || '';

  const handleChange = useCallback(
    (value: string | null) => {
      if (!editor) return;
      if (!value) {
        editor.chain().focus().unsetFontSize().run();
      } else {
        editor.chain().focus().setFontSize(value).run();
      }
    },
    [editor],
  );

  return (
    <Select
      data={FONT_SIZES}
      value={current}
      onChange={handleChange}
      placeholder="Size"
      size="xs"
      w={100}
      styles={{ input: { height: 26, minHeight: 26 } }}
      comboboxProps={{ withinPortal: false }}
    />
  );
}

function LineHeightControl() {
  const { editor } = useRichTextEditorContext();
  const current = editor?.getAttributes('textStyle')?.lineHeight || '';

  const handleChange = useCallback(
    (value: string | null) => {
      if (!editor) return;
      if (!value) {
        editor.chain().focus().unsetLineHeight().run();
      } else {
        editor.chain().focus().setLineHeight(value).run();
      }
    },
    [editor],
  );

  return (
    <Select
      data={LINE_HEIGHTS}
      value={current}
      onChange={handleChange}
      placeholder="Line Height"
      size="xs"
      w={100}
      styles={{ input: { height: 26, minHeight: 26 } }}
      comboboxProps={{ withinPortal: false }}
    />
  );
}

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  /** Selected dispute types — drives context-aware per-item tags in sidebar */
  disputeTypes?: string[];
  /** When true, the built-in SmartTagsSidebar is hidden so the parent can render it externally. */
  hideSidebar?: boolean;
  /** Callback that exposes the Tiptap editor instance to the parent component. */
  onEditorReady?: (editor: Editor | null) => void;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'Start writing your letter template...',
  disputeTypes = [],
  hideSidebar = false,
  onEditorReady,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      Placeholder.configure({
        placeholder,
      }),
      DisputeItemsBlock,
    ],
    // Deserialize comment markers to editor-parseable HTML on load
    content: deserializeDisputeBlocks(content),
    onUpdate: ({ editor }) => {
      // Serialize dispute blocks back to comment markers for storage
      onChange(serializeDisputeBlocks(editor.getHTML()));
    },
    immediatelyRender: false,
  });

  // Expose the editor instance to the parent when ready
  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  return (
    <Group align="flex-start" gap="md" wrap="nowrap">
      <Box style={{ flex: 1, minWidth: 0 }}>
        <RichTextEditor editor={editor} withTypographyStyles={false}>
          <RichTextEditor.Toolbar sticky stickyOffset={LAYOUT.HEADER_LAYER1}>
            <RichTextEditor.ControlsGroup>
              <FontFamilyControl />
              <FontSizeControl />
              <LineHeightControl />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
              <RichTextEditor.ClearFormatting />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Undo />
              <RichTextEditor.Redo />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>

          <ScrollArea h={LAYOUT.EDITOR_HEIGHT} type="auto">
            <RichTextEditor.Content
              style={{
                minHeight: LAYOUT.EDITOR_HEIGHT,
                fontFamily: 'Arial, sans-serif',
                fontSize: '12pt',
              }}
            />
          </ScrollArea>
        </RichTextEditor>
      </Box>

      {!hideSidebar && <SmartTagsSidebar editor={editor} disputeTypes={disputeTypes} />}
    </Group>
  );
}
