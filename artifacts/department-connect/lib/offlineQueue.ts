import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "dc_offline_scan_queue";

export interface QueuedScan {
  queuedAt: string;
  sessionId: string;
  courseId: string;
  qrExpiresAt: string;
  studentId: string;
  matricNumber: string;
  deviceHash: string;
}

export async function enqueueOfflineScan(scan: Omit<QueuedScan, "queuedAt">): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedScan[] = raw ? JSON.parse(raw) : [];
  queue.push({ ...scan, queuedAt: new Date().toISOString() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueuedScans(): Promise<QueuedScan[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearQueuedScans(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function removeQueuedScan(sessionId: string, studentId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedScan[] = raw ? JSON.parse(raw) : [];
  const updated = queue.filter((q) => !(q.sessionId === sessionId && q.studentId === studentId));
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export function isScanExpired(scan: QueuedScan): boolean {
  return new Date(scan.queuedAt) > new Date(scan.qrExpiresAt);
}
