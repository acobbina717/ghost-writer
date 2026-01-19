/**
 * Format structured address fields into a single display string
 * Used for the {{client_address}} smart tag
 */
export function formatAddress(client: {
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  zipCode: string;
}): string {
  const lines = [
    client.address1,
    client.address2,
    `${client.city}, ${client.state} ${client.zipCode}`,
  ].filter(Boolean);
  return lines.join('\n');
}

