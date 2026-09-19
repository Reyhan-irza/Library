import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd MMM yyyy', { locale: id });
  } catch {
    return '-';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: id });
  } catch {
    return '-';
  }
}

export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
