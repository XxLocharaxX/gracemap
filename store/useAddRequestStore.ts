import { create } from 'zustand';
import { HelpType, HelpRequest } from './useMapStore';

interface AddRequestState {
  isAdding: boolean;
  step: number; // 1 (Type), 2 (Form), 3 (Location)
  draftData: Partial<HelpRequest>;
  tempLocation: [number, number] | null;
  startAdding: () => void;
  setStep: (step: number) => void;
  updateDraft: (data: Partial<HelpRequest>) => void;
  setTempLocation: (loc: [number, number] | null) => void;
  cancelAdding: () => void;
}

export const useAddRequestStore = create<AddRequestState>((set) => ({
  isAdding: false,
  step: 1,
  draftData: {},
  tempLocation: null,
  startAdding: () => set({ isAdding: true, step: 1, draftData: {}, tempLocation: null }),
  setStep: (step) => set({ step }),
  updateDraft: (data) => set((state) => ({ draftData: { ...state.draftData, ...data } })),
  setTempLocation: (loc) => set({ tempLocation: loc }),
  cancelAdding: () => set({ isAdding: false, step: 1, draftData: {}, tempLocation: null }),
}));
