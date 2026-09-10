import { create } from 'zustand';

type QuickExpenseDraftState = {
  amountCents: number;
  date: string;
  categoryId: number | null;
  categoryName: string | null;
  setAmount: (amountCents: number) => void;
  setDate: (date: string) => void;
  setCategory: (categoryId: number, categoryName: string) => void;
  reset: () => void;
};

function initialState() {
  return {
    amountCents: 0,
    date: new Date().toISOString().slice(0, 10),
    categoryId: null as number | null,
    categoryName: null as string | null,
  };
}

export const useQuickExpenseDraft = create<QuickExpenseDraftState>((set) => ({
  ...initialState(),
  setAmount: (amountCents) => set({ amountCents }),
  setDate: (date) => set({ date }),
  setCategory: (categoryId, categoryName) => set({ categoryId, categoryName }),
  reset: () => set(initialState()),
}));
