export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

export function formatName(firstName?: string, lastName?: string): string {
  return `${firstName || ''} ${lastName || ''}`.trim();
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = (firstName || '').charAt(0);
  const last = (lastName || '').charAt(0);
  return `${first}${last}`.toUpperCase() || '?';
}
