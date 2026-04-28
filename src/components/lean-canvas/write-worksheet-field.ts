/**
 * write-worksheet-field — thin wrapper around the existing worksheet write
 * path so inline-edit components don't scatter raw fetch calls.
 *
 * Uses the same POST /api/v2/learner-state endpoint as the worksheet clients:
 *   credentials: "same-origin"   (auth comes from the session cookie)
 *   body: { worksheetId, responses }
 *
 * The endpoint upserts the field into `worksheet_responses` and updates
 * chapter progress tracking when chapterId/chapterSlug are supplied.
 * For inline canvas edits we omit those — field persistence is enough.
 *
 * To move this API path: update the LEARNER_STATE_ENDPOINT constant and
 * the body shape below.  No component code needs to change.
 */

const LEARNER_STATE_ENDPOINT = '/api/v2/learner-state';

export interface WriteFieldResult {
  ok: boolean;
  /** HTTP status or error message if the request failed. */
  error?: string;
}

/**
 * Persist a single worksheet field value via the existing write path.
 *
 * @param fieldKey    The worksheet field key, e.g. "time_budget_hours_per_week"
 * @param value       The new string value to persist
 * @param worksheetId Worksheet the field belongs to (default: "founder-rules-sheet")
 */
export async function writeWorksheetField(
  fieldKey: string,
  value: string,
  worksheetId = 'founder-rules-sheet',
): Promise<WriteFieldResult> {
  try {
    const res = await fetch(LEARNER_STATE_ENDPOINT, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worksheetId,
        responses: { [fieldKey]: value },
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
