import { Node, mergeAttributes } from '@tiptap/core';

/**
 * DisputeItemsBlock — A block-level Tiptap node extension.
 *
 * The admin inserts it from the sidebar. It acts as a container where
 * the admin defines what ONE dispute item looks like. At render time,
 * the hydration engine repeats the content for each item.
 *
 * Serializes to HTML comment markers:
 *   <!--dispute_block_start-->...content...<!--dispute_block_end-->
 *
 * Constraints:
 * - One per document (enforced by the sidebar button state)
 * - Deletable by the admin
 * - No nesting
 */

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    disputeItemsBlock: {
      insertDisputeBlock: () => ReturnType;
    };
  }
}

export const DisputeItemsBlock = Node.create({
  name: 'disputeItemsBlock',

  group: 'block',

  content: 'block+',

  defining: true,

  parseHTML() {
    return [
      {
        // Parse from the serialized HTML comment markers
        tag: 'div[data-dispute-block]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-dispute-block': 'true',
        style: [
          'border-left: 2px solid #7c3aed',
          'background: rgba(124, 58, 237, 0.05)',
          'padding: 12px 16px',
          'margin: 8px 0',
          'border-radius: 4px',
          'position: relative',
        ].join('; '),
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertDisputeBlock:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Add dispute item fields here using the smart tags sidebar',
                  },
                ],
              },
            ],
          });
        },
    };
  },
});

/**
 * Convert editor HTML output to storage format with comment markers.
 * Called before saving to the database.
 */
export function serializeDisputeBlocks(html: string): string {
  return html.replace(
    /<div data-dispute-block="true"[^>]*>([\s\S]*?)<\/div>/g,
    (_match, content) => `<!--dispute_block_start-->${content}<!--dispute_block_end-->`,
  );
}

/**
 * Convert stored HTML with comment markers back to editor-parseable HTML.
 * Called when loading content into the editor.
 */
export function deserializeDisputeBlocks(html: string): string {
  return html.replace(
    /<!--dispute_block_start-->([\s\S]*?)<!--dispute_block_end-->/g,
    (_match, content) => `<div data-dispute-block="true">${content}</div>`,
  );
}
