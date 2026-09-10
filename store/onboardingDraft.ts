import { create } from 'zustand';

import type { AssetType } from '@/db/queries/assets';

export type DraftAsset = { name: string; type: AssetType; valueCents: number };

type OnboardingDraftState = {
  annualSalaryCents: number;
  monthlyNetPayCents: number;
  payDayOfMonth: number;
  assets: DraftAsset[];
  setSalary: (annualSalaryCents: number, monthlyNetPayCents: number) => void;
  setPayDay: (day: number) => void;
  addAsset: (asset: DraftAsset) => void;
  removeAsset: (index: number) => void;
  reset: () => void;
};

const initialState = {
  annualSalaryCents: 0,
  monthlyNetPayCents: 0,
  payDayOfMonth: 1,
  assets: [] as DraftAsset[],
};

export const useOnboardingDraft = create<OnboardingDraftState>((set) => ({
  ...initialState,
  setSalary: (annualSalaryCents, monthlyNetPayCents) => set({ annualSalaryCents, monthlyNetPayCents }),
  setPayDay: (payDayOfMonth) => set({ payDayOfMonth }),
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  removeAsset: (index) => set((state) => ({ assets: state.assets.filter((_, i) => i !== index) })),
  reset: () => set(initialState),
}));
