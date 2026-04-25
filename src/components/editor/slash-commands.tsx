import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Type,
  Wand2
} from 'lucide-react';
import type { AiAction } from '@/lib/ai';

export interface SlashCommandItem {
  title: string;
  description?: string;
  icon: React.ReactNode;
  keywords: string[];
  command: (props: { editor: any; range: any }) => void | Promise<void>;
}

function getAiItems(editor: any): SlashCommandItem[] {
  const onAiAssist = editor.storage.aiAssist?.onAiAssist as
    | ((text: string, action: AiAction) => Promise<string>)
    | undefined;
  const handleSetActive = editor.storage.aiAssist?.handleSetActiveAction as
    | ((action: AiAction | null) => void)
    | undefined;

  if (!onAiAssist) return [];

  const runAiAction = async (action: AiAction) => {
    const { selection } = editor.state;
    const hasSelection = !selection.empty;
    const selectedText = hasSelection
      ? editor.state.doc.textBetween(selection.from, selection.to)
      : editor.getText();

    if (!selectedText.trim()) return;

    handleSetActive?.(action);

    try {
      const result = await onAiAssist(selectedText, action);

      if (action === 'continue') {
        const insertPos = hasSelection
          ? selection.to
          : editor.state.doc.content.size;
        editor.chain().focus().insertContentAt(insertPos, ` ${result}`).run();
      } else {
        if (hasSelection) {
          editor
            .chain()
            .focus()
            .deleteRange({ from: selection.from, to: selection.to })
            .insertContentAt(selection.from, result)
            .run();
        } else {
          editor.commands.setContent(`<p>${result}</p>`);
        }
      }
    } catch (error) {
      console.error('AI action failed:', error);
    } finally {
      handleSetActive?.(null);
    }
  };

  return [
    {
      title: 'Continue writing',
      description: 'Continue from cursor',
      icon: <Wand2 className="w-4 h-4" />,
      keywords: ['ai', 'continue', 'write'],
      command: async () => runAiAction('continue')
    },
    {
      title: 'Summarize',
      description: 'Summarize selected text',
      icon: <Wand2 className="w-4 h-4" />,
      keywords: ['ai', 'summarize', 'short'],
      command: async () => runAiAction('summarize')
    },
    {
      title: 'Expand',
      description: 'Expand with more detail',
      icon: <Wand2 className="w-4 h-4" />,
      keywords: ['ai', 'expand', 'elaborate'],
      command: async () => runAiAction('expand')
    },
    {
      title: 'Rewrite',
      description: 'Rewrite for clarity',
      icon: <Wand2 className="w-4 h-4" />,
      keywords: ['ai', 'rewrite', 'rephrase'],
      command: async () => runAiAction('rewrite')
    },
    {
      title: 'Fix spelling & grammar',
      description: 'Correct errors',
      icon: <Wand2 className="w-4 h-4" />,
      keywords: ['ai', 'fix', 'grammar', 'spelling'],
      command: async () => runAiAction('fix-spelling')
    },
    {
      title: 'Change tone',
      description: 'Make it professional',
      icon: <Wand2 className="w-4 h-4" />,
      keywords: ['ai', 'tone', 'professional'],
      command: async () => runAiAction('change-tone')
    }
  ];
}

export function getSlashCommandItems({
  query,
  editor
}: {
  query: string;
  editor: any;
}): SlashCommandItem[] {
  const allItems: SlashCommandItem[] = [
    {
      title: 'Text',
      description: 'Plain text paragraph',
      icon: <Type className="w-4 h-4" />,
      keywords: ['text', 'paragraph', 'p'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setParagraph().run();
      }
    },
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: <Heading1 className="w-4 h-4" />,
      keywords: ['heading', 'h1', 'title'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleHeading({ level: 1 })
          .run();
      }
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 className="w-4 h-4" />,
      keywords: ['heading', 'h2', 'subtitle'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleHeading({ level: 2 })
          .run();
      }
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: <Heading3 className="w-4 h-4" />,
      keywords: ['heading', 'h3'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleHeading({ level: 3 })
          .run();
      }
    },
    {
      title: 'Bullet list',
      description: 'Unordered list',
      icon: <List className="w-4 h-4" />,
      keywords: ['list', 'bullet', 'unordered'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      }
    },
    {
      title: 'Numbered list',
      description: 'Ordered list',
      icon: <ListOrdered className="w-4 h-4" />,
      keywords: ['list', 'ordered', 'number'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      }
    },
    {
      title: 'Quote',
      description: 'Block quote',
      icon: <Quote className="w-4 h-4" />,
      keywords: ['quote', 'blockquote'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      }
    },
    {
      title: 'Code block',
      description: 'Code snippet',
      icon: <Code className="w-4 h-4" />,
      keywords: ['code', 'pre', 'snippet'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      }
    },
    ...getAiItems(editor)
  ];

  if (!query) return allItems;

  const normalizedQuery = query.toLowerCase();
  return allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.keywords.some((k) => k.toLowerCase().includes(normalizedQuery))
  );
}
