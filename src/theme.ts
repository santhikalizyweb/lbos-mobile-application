export const colors = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primarySoft: '#EEF2FF',
  bg: '#F4F5F9',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  faint: '#9CA3AF',
  border: '#E5E7EB',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  info: '#2563EB',
  infoSoft: '#DBEAFE',
  neutralSoft: '#F3F4F6',
};

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

type Tone = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

const TONES: Record<Tone, { fg: string; bg: string }> = {
  success: { fg: colors.success, bg: colors.successSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
  neutral: { fg: colors.muted, bg: colors.neutralSoft },
  primary: { fg: colors.primary, bg: colors.primarySoft },
};

export function tone(t: Tone) {
  return TONES[t];
}

/** A colour for the status values used across OMS, Partnership and Universal. */
export function statusTone(status?: string | null): Tone {
  switch (status) {
    case 'delivered':
    case 'paid':
    case 'won':
    case 'complete':
    case 'completed':
    case 'solved':
    case 'active':
    case 'approved':
    case 'converted':
    case 'verified':
    case 'return_received':
    case 'replacement_completed':
      return 'success';
    case 'cancelled':
    case 'failed':
    case 'sales_lost':
    case 'overdue':
    case 'rejected':
    case 'suspended':
    case 'refunded':
    case 'closed':
      return 'danger';
    case 'pending':
    case 'partial':
    case 'hold':
    case 'today':
    case 'open':
    case 'payable':
    case 'pending_approval':
    case 'verification_pending':
      return 'warning';
    case 'in_progress':
    case 'in_transit':
    case 'ready_to_ship':
    case 'reached_the_destination':
    case 'interested':
    case 'upcoming':
    case 'contacted':
    case 'new':
      return 'info';
    default:
      return 'neutral';
  }
}
