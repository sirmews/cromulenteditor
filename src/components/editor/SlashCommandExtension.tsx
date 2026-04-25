import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { createRoot, type Root } from 'react-dom/client';
import { SlashCommandMenu } from './SlashCommandMenu';
import { getSlashCommandItems } from './slash-commands';

export const SlashCommandExtension = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        allowSpaces: true,
        allowedPrefixes: [' '],
        command: ({
          editor,
          range,
          props
        }: {
          editor: any;
          range: any;
          props: any;
        }) => {
          props.command({ editor, range });
        },
        items: ({ query, editor }: { query: string; editor: any }) => {
          return getSlashCommandItems({ query, editor });
        },
        render: () => {
          let container: HTMLDivElement | null = null;
          let root: Root | null = null;

          return {
            onStart: (props: any) => {
              container = document.createElement('div');
              container.style.position = 'absolute';
              container.style.zIndex = '50';
              document.body.appendChild(container);

              const rect = props.decorationNode.getBoundingClientRect();
              container.style.top = `${rect.bottom + window.scrollY}px`;
              container.style.left = `${rect.left + window.scrollX}px`;

              root = createRoot(container);
              root.render(
                <SlashCommandMenu
                  items={props.items}
                  command={(item) => props.command(item)}
                />
              );
            },
            onUpdate: (props: any) => {
              if (!root || !container) return;

              const rect = props.decorationNode.getBoundingClientRect();
              container.style.top = `${rect.bottom + window.scrollY}px`;
              container.style.left = `${rect.left + window.scrollX}px`;

              root.render(
                <SlashCommandMenu
                  items={props.items}
                  command={(item) => props.command(item)}
                />
              );
            },
            onKeyDown: (props: any) => {
              if (
                props.event.key === 'ArrowUp' ||
                props.event.key === 'ArrowDown' ||
                props.event.key === 'Enter' ||
                props.event.key === 'Escape'
              ) {
                return true;
              }
              return false;
            },
            onExit: () => {
              if (root) {
                root.unmount();
                root = null;
              }
              if (container) {
                container.remove();
                container = null;
              }
            }
          };
        }
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion
      })
    ];
  }
});
