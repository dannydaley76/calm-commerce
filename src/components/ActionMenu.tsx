'use client';

import { useEffect, useRef, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  /** 'destructive' renders the item in error-700 red. */
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  /** Accessible name for the trigger button. */
  ariaLabel?: string;
  /** Extra classes on the root wrapper. */
  className?: string;
}

/* ── Shared icon helpers ─────────────────────────────────────────── */

export function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M9.5 1.5L11.5 3.5L4.5 10.5H2.5V8.5L9.5 1.5Z"
        stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2 3.5H11M5 3.5V2.5H8V3.5M4 3.5L4.5 10.5H8.5L9 3.5"
        stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function NotesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" rx="1.5"
        stroke="currentColor" strokeWidth="1.25"/>
      <path d="M4.5 5H8.5M4.5 7.5H7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────────────── */

/**
 * ActionMenu — a ⋯ trigger that opens a small dropdown menu.
 *
 * Usage
 * ─────
 * <ActionMenu
 *   ariaLabel="Actions for Core problem"
 *   items={[
 *     { label: 'Edit',   icon: <PencilIcon />, onClick: () => startEdit() },
 *     { label: 'Delete', icon: <TrashIcon />,  onClick: () => del(), variant: 'destructive' },
 *   ]}
 * />
 *
 * Accessibility
 * ─────────────
 * - Trigger has role="button", aria-haspopup="menu", aria-expanded
 * - Dropdown has role="menu"; items have role="menuitem"
 * - Escape closes the menu and returns focus to the trigger
 * - Click outside closes the menu
 */
export function ActionMenu({ items, ariaLabel = 'More actions', className = '' }: ActionMenuProps) {
  const [open, setOpen]       = useState(false);
  const menuRef               = useRef<HTMLDivElement>(null);
  const triggerRef            = useRef<HTMLButtonElement>(null);

  /* Close on click outside */
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      {/* ⋯ trigger */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-300 transition-colors duration-150 hover:bg-surface-sunken hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
      >
        {/* Three-dot icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="3"  cy="8" r="1.5"/>
          <circle cx="8"  cy="8" r="1.5"/>
          <circle cx="13" cy="8" r="1.5"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[148px] rounded-xl border border-ink-100 bg-surface-raised py-1 shadow-card-hover"
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setOpen(false);
              }}
              className={[
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-100',
                item.variant === 'destructive'
                  ? 'text-error-700 hover:bg-error-100 disabled:opacity-40'
                  : 'text-ink-900 hover:bg-surface-sunken disabled:opacity-40',
              ].join(' ')}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
