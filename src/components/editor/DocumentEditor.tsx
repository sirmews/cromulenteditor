import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AiAction } from '@/lib/ai';
import { AI_ACTIONS } from '@/lib/ai';
import type { ModelStatus } from '@/lib/bonsai';
import { cn } from '@/lib/utils';
import { SlashCommandExtension } from './SlashCommandExtension';

interface DocumentEditorProps {
  className?: string;
  initialContent?: string;
  onAiAssist?: (text: string, action: AiAction) => Promise<string>;
  onContentChange?: (html: string) => void;
  modelStatus?: ModelStatus;
}

export function DocumentEditor({
  className,
  initialContent,
  onAiAssist,
  onContentChange,
  modelStatus = 'idle'
}: DocumentEditorProps) {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [activeAiAction, setActiveAiAction] = useState<AiAction | null>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  const onAiAssistRef = useRef(onAiAssist);
  useEffect(() => {
    onAiAssistRef.current = onAiAssist;
  }, [onAiAssist]);

  const activeActionRef = useRef(activeAiAction);
  useEffect(() => {
    activeActionRef.current = activeAiAction;
  }, [activeAiAction]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Press '/' for commands, or start writing..."
      }),
      SlashCommandExtension
    ],
    content: initialContent || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none focus:outline-none min-h-[60vh] px-8 py-4'
      }
    },
    onCreate: ({ editor }) => {
      editor.storage.aiAssist = {
        onAiAssist: onAiAssistRef.current,
        handleSetActiveAction: (action: AiAction | null) =>
          setActiveAiAction(action)
      };
    },
    onUpdate: ({ editor }) => {
      editor.storage.aiAssist = {
        onAiAssist: onAiAssistRef.current,
        handleSetActiveAction: (action: AiAction | null) =>
          setActiveAiAction(action)
      };
      onContentChange?.(editor.getHTML());
    }
  });

  // Click outside to close AI menu
  useEffect(() => {
    if (!showAiMenu) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        aiMenuRef.current &&
        !aiMenuRef.current.contains(e.target as Node) &&
        aiButtonRef.current &&
        !aiButtonRef.current.contains(e.target as Node)
      ) {
        setShowAiMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAiMenu]);

  const handleFormatBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const handleFormatItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const handleFormatStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const handleFormatCode = useCallback(() => {
    editor?.chain().focus().toggleCode().run();
  }, [editor]);

  const handleFormatHeading = useCallback(
    (level: 1 | 2 | 3) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );

  const handleFormatBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const handleFormatOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const handleFormatBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  const handleAiAction = useCallback(
    async (action: AiAction) => {
      if (!editor || !onAiAssist) return;

      const { selection } = editor.state;
      const hasSelection = !selection.empty;

      const selectedText = hasSelection
        ? editor.state.doc.textBetween(selection.from, selection.to)
        : editor.getText();

      if (!selectedText.trim()) return;

      setActiveAiAction(action);
      setShowAiMenu(false);

      try {
        const result = await onAiAssist(selectedText, action);

        if (action === 'continue') {
          // Append after selection or at end of document
          const insertPos = hasSelection
            ? selection.to
            : editor.state.doc.content.size;
          editor.chain().focus().insertContentAt(insertPos, ` ${result}`).run();
        } else {
          // Replace selection, or replace full document text for non-selection actions
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
        setActiveAiAction(null);
      }
    },
    [editor, onAiAssist]
  );

  const aiButtonLabel = (() => {
    if (activeAiAction) return 'Thinking...';
    if (modelStatus === 'downloading') return 'Loading...';
    if (modelStatus === 'error') return 'AI Error';
    return 'Ask AI';
  })();

  const isAiDisabled = activeAiAction !== null || modelStatus === 'downloading';

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="sticky top-0 z-10 flex items-center gap-1 p-2 border-b border-border bg-background/95 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFormatBold}
          className={cn('font-bold', editor?.isActive('bold') && 'bg-muted')}
        >
          B
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFormatItalic}
          className={cn('italic', editor?.isActive('italic') && 'bg-muted')}
        >
          I
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFormatStrike}
          className={cn(
            'line-through',
            editor?.isActive('strike') && 'bg-muted'
          )}
        >
          S
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFormatCode}
          className={cn(
            'font-mono text-xs',
            editor?.isActive('code') && 'bg-muted'
          )}
        >
          {'</>'}
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormatHeading(1)}
          className={
            editor?.isActive('heading', { level: 1 }) ? 'bg-muted' : ''
          }
        >
          H1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormatHeading(2)}
          className={
            editor?.isActive('heading', { level: 2 }) ? 'bg-muted' : ''
          }
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormatHeading(3)}
          className={
            editor?.isActive('heading', { level: 3 }) ? 'bg-muted' : ''
          }
        >
          H3
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFormatBulletList}
          className={editor?.isActive('bulletList') ? 'bg-muted' : ''}
        >
          • List
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFormatOrderedList}
          className={editor?.isActive('orderedList') ? 'bg-muted' : ''}
        >
          1. List
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFormatBlockquote}
          className={editor?.isActive('blockquote') ? 'bg-muted' : ''}
        >
          &ldquo;
        </Button>
        <div className="flex-1" />
        {onAiAssist && (
          <div className="relative">
            <Button
              ref={aiButtonRef}
              type="button"
              variant="default"
              size="sm"
              onClick={() => setShowAiMenu(!showAiMenu)}
              disabled={isAiDisabled}
            >
              {aiButtonLabel}
            </Button>
            {showAiMenu && (
              <div
                ref={aiMenuRef}
                className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg overflow-hidden z-50"
              >
                {AI_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                    onClick={() => handleAiAction(action.id)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto bg-card">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
