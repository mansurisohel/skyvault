import { useSyncExternalStore } from 'react';
import { getServiceStatus, subscribeServiceStatus } from '@/services/serviceStatus';

/** Which integrations are live, missing a key, or unreachable (see services/serviceStatus.js). */
export function useServiceStatus() {
  return useSyncExternalStore(subscribeServiceStatus, getServiceStatus, getServiceStatus);
}
