import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type HelpType = 'urgent' | 'project' | 'prayer';

export interface HelpRequest {
  id: string;
  type: HelpType;
  title: string;
  authorName?: string;
  user_id?: string;
  description: string;
  location: [number, number]; // [longitude, latitude]
  distance?: number;
  timeAgo: string;
  isVerified?: boolean;
  phone?: string; // legacy
  contact?: {
    type: 'phone' | 'telegram' | 'whatsapp';
    value: string;
  };
  prayersCount?: number;
}

interface MapState {
  requests: HelpRequest[];
  activeFilters: Record<HelpType, boolean>;
  toggleFilter: (type: HelpType) => void;
  selectedRequest: HelpRequest | null;
  setSelectedRequest: (request: HelpRequest | null) => void;
  fetchRequests: (bounds?: { minLng: number, maxLng: number, minLat: number, maxLat: number }) => Promise<void>;
}

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Только что';
  if (hours < 24) return `${hours} ч. назад`;
  return `${Math.floor(hours / 24)} дн. назад`;
};

const mapRowToRequest = (row: any): HelpRequest => ({
  id: row.id,
  type: row.type,
  title: row.title,
  authorName: row.author_name,
  user_id: row.user_id,
  description: row.description,
  location: [row.lng, row.lat],
  timeAgo: getTimeAgo(row.created_at),
  isVerified: row.is_verified,
  prayersCount: row.prayers_count || 0,
  contact: {
    type: row.contact_type,
    value: row.contact_value
  }
});

export const useMapStore = create<MapState>((set, get) => {
  if (typeof window !== 'undefined') {
    supabase
      .channel('public:help_requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'help_requests' }, (payload) => {
        const newReq = mapRowToRequest(payload.new);
        set((state) => {
          if (state.requests.find(r => r.id === newReq.id)) return state;
          return { requests: [newReq, ...state.requests] };
        });
      })
      .subscribe();
  }

  return {
    requests: [],
    activeFilters: {
      urgent: true,
      project: true,
      prayer: true
    },
    toggleFilter: (type) => set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        [type]: !state.activeFilters[type]
      }
    })),
    selectedRequest: null,
    setSelectedRequest: (request) => {
      set({ selectedRequest: request });
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (request) url.searchParams.set('id', request.id);
        else url.searchParams.delete('id');
        window.history.pushState({}, '', url.toString());
      }
    },
    fetchRequests: async (bounds) => {
      let query = supabase
        .from('help_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000); // Ограничение чтобы не повесить браузер

      if (bounds) {
        query = query
          .gte('lng', bounds.minLng)
          .lte('lng', bounds.maxLng)
          .gte('lat', bounds.minLat)
          .lte('lat', bounds.maxLat);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        const parsed = data.map(mapRowToRequest);
        
        // Объединяем старые и новые запросы, чтобы маркеры не мерцали
        set((state) => {
          const newRequestsMap = new Map(parsed.map(r => [r.id, r]));
          // Оставляем те, которые уже есть в стейте, и обновляем новые
          const merged = [...parsed];
          for (const req of state.requests) {
            if (!newRequestsMap.has(req.id)) {
              merged.push(req);
            }
          }
          return { requests: merged };
        });

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const id = params.get('id');
          if (id && !get().selectedRequest) {
            const req = parsed.find(r => r.id === id);
            if (req) set({ selectedRequest: req });
          }
        }
      }
    }
  };
});
