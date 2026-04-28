// Types & helpers
export type { CanvasSectionState, SectionStatus, SectionStateInput } from './types';
export { getSectionState } from './get-section-state';

// Shared badge
export { FillBadge } from './FillBadge';
export type { FillBadgeProps } from './FillBadge';

// Shared source chip
export { SourceChip, formatSourceLabel } from './SourceChip';

// Tab events (pub/sub for tab switches)
export { dispatchTabChange, subscribeToTabChange, TAB_CHANGE_EVENT } from './tab-events';
export type { TabChangeDetail } from './tab-events';

// Canvas preferences (skip state store)
export { canvasPreferences } from './CanvasPreferences';
export type { CanvasPreferenceStore } from './CanvasPreferences';

// API write helper
export { writeWorksheetField } from './write-worksheet-field';
export type { WriteFieldResult } from './write-worksheet-field';

// Primitives
export { CompletionGlyph } from './CompletionGlyph';
export type { CompletionGlyphProps } from './CompletionGlyph';

export { CanvasCard } from './CanvasCard';
export type { CanvasCardProps, SubField, CardVariant } from './CanvasCard';

export { CanvasTabs, CanvasTabPanel } from './CanvasTabs';
export type { CanvasTabsProps, CanvasTabPanelProps, CanvasTab } from './CanvasTabs';

// Interactive card components (client)
export { InlineEditCard } from './InlineEditCard';
export type { InlineEditCardProps, InlineFieldConfig } from './InlineEditCard';

export { BusinessModelCard } from './BusinessModelCard';
export type { BusinessModelCardProps } from './BusinessModelCard';

export { CanvasHeroOperatingAction } from './CanvasHeroOperatingAction';
export type { CanvasHeroOperatingActionProps } from './CanvasHeroOperatingAction';
