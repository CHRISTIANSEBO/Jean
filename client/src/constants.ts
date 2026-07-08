// Shared types and constant maps for the chat app.
import type { EmailData } from './EmailCards';
import type { UnsubSender } from './UnsubView';

export type Message = { role: 'user' | 'assistant'; text: string; emails?: EmailData[]; quickReplies?: string[] };
export type InboxView = { label: string; emails: EmailData[]; loading: boolean };
export type UnsubViewState = { senders: UnsubSender[]; loading: boolean };
export type Confirmation = { prompt: string };

// Human-friendly status text shown while each agent tool runs.
export const TOOL_LABELS: Record<string, string> = {
  read_email: 'Reading your inbox...',
  sort_emails: 'Sorting emails by priority...',
  open_email: 'Opening email...',
  send_email: 'Preparing to send...',
  summarize_email: 'Summarizing email...',
  unsubscribe_from_email: 'Processing unsubscribe...',
  save_template: 'Saving template...',
};

export const QUICK_ACTIONS = ['Read inbox', 'Sort by priority', 'Check promotions', 'Unsubscribe'];

export const INBOX_LABELS: Record<string, string> = {
  primary: 'Primary',
  promotions: 'Promotions',
  social: 'Social',
  updates: 'Updates',
  sort: 'Priority',
};

// Cross-origin pages can't set custom headers, so the server requires this one
// on every state-changing request as CSRF protection.
export const CSRF_HEADER = { 'X-Requested-With': 'fetch' };
