import type { ClientWithDisputes, ConvexDisputeItem } from '@/lib/convex-types';


export interface ClientsTableProps {
  clients: ClientWithDisputes[];
  filter?: 'all' | 'pending';
}


export type DisputeItemsCache = Record<
  string,
  { items: ConvexDisputeItem[]; loading: boolean }
>;
