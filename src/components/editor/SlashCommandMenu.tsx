import { useEffect, useRef, useState } from 'react';
import type { SlashCommandItem } from './slash-commands';

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export function SlashCommandMenu({ items, command }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: items legitimately changes when filter results update
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: need to scroll when selectedIndex changes
  useEffect(() => {
    const selected = containerRef.current?.querySelector(
      "[data-selected='true']"
    );
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          command(items[selectedIndex]);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, command]);

  if (items.length === 0) {
    return (
      <div className="w-64 bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
        No results
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-64 bg-popover border border-border rounded-md shadow-lg overflow-hidden max-h-[320px] overflow-y-auto"
    >
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          data-selected={index === selectedIndex}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            index === selectedIndex
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent/50 text-foreground'
          }`}
          onClick={() => command(item)}
        >
          <span className="text-muted-foreground flex-shrink-0">
            {item.icon}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{item.title}</span>
            {item.description && (
              <span className="text-xs text-muted-foreground truncate">
                {item.description}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
