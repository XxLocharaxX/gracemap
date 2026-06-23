import { HelpRequest } from '../store/useMapStore';

let initialRequests: HelpRequest[] = [];
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('grace_requests');
  if (saved) {
    try {
      initialRequests = JSON.parse(saved);
    } catch (e) {}
  }
}

export const mockRequests: HelpRequest[] = initialRequests;
