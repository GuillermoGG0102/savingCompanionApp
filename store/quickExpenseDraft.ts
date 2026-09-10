import { create } from 'zustand';

type QuickExpenseDraftState = {
  amountCents: number;
  categoryId: number | null;
  categoryName: string | null;
  setAmount: (amountCents: number) => void;
  setCategory: (categoryId: number, categoryName: string) => void;
  reset: () => void;
};

const initialState = {
  amountCents: 0,
  categoryId: null as number | null,
  categoryName: null as string | null,
};

export const useQuickExpenseDraft = create<QuickExpenseDraftState>((set) => ({
  ...initialState,
  setAmount: (amountCents) => set({ amountCents }),
  setCategory: (categoryId, categoryName) => set({ categoryId, categoryName }),
  reset: () => set(initialState),
}));
