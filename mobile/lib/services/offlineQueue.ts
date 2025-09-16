export type OfflineEntityKind = 'farm_file' | 'farm_file_plot' | 'participant' | 'input' | 'operation' | 'observation';

export type OfflineQueueItem = {
  id: string;
  kind: OfflineEntityKind;
  payload: any;
  createdAt: number;
  status: 'pending' | 'synced' | 'failed';
  error?: string;
};

const memoryQueue: OfflineQueueItem[] = [];

export class OfflineQueueService {
  static enqueue(item: Omit<OfflineQueueItem, 'status' | 'createdAt'>) {
    memoryQueue.push({ ...item, status: 'pending', createdAt: Date.now() });
  }

  static list(kind?: OfflineEntityKind) {
    return memoryQueue.filter((i) => (kind ? i.kind === kind : true));
  }

  static markSynced(id: string) {
    const it = memoryQueue.find((i) => i.id === id);
    if (it) it.status = 'synced';
  }

  static markFailed(id: string, error: string) {
    const it = memoryQueue.find((i) => i.id === id);
    if (it) {
      it.status = 'failed';
      it.error = error;
    }
  }
}
