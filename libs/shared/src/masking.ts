export function maskDocumentNumber(documentNumber: string): string {
  if (documentNumber.length < 4) {
    return '****';
  }
  return `${documentNumber.slice(0, 2)}****${documentNumber.slice(-2)}`;
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) {
    return '***';
  }
  const visible = localPart.slice(0, 2);
  return `${visible}***@${domain}`;
}
