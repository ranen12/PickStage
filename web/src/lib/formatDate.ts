
export function formatDateToDot(date: string): string{
  return date.split('T')[0].replaceAll('-', '.');
}
