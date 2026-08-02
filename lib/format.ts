import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

export function formatDateTime(value: string) {
  return format(parseISO(value), 'M/d HH:mm', { locale: ja });
}

export function formatRelative(value: string) {
  return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: ja });
}

export function formatPoints(value: number) {
  return `${value} pt`;
}
