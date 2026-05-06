/**
 * 模型定价状态管理（localStorage 持久化）
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ModelPricing {
  input: number;
  output: number;
  cached: number;
}

interface ModelPricingState {
  prices: Record<string, ModelPricing>;
  globalDefault: ModelPricing | null;

  setPrice: (model: string, pricing: ModelPricing) => void;
  removePrice: (model: string) => void;
  setGlobalDefault: (pricing: ModelPricing | null) => void;
  getPrice: (model: string) => ModelPricing | null;
  calculateCost: (model: string, inputTokens: number, outputTokens: number, cachedTokens: number) => number | null;
}

const STORAGE_KEY = 'cli-proxy-model-pricing';

export const useModelPricingStore = create<ModelPricingState>()(
  persist(
    (set, get) => ({
      prices: {},
      globalDefault: null,

      setPrice: (model, pricing) => {
        set((state) => ({
          prices: { ...state.prices, [model]: pricing },
        }));
      },

      removePrice: (model) => {
        set((state) => {
          const next = { ...state.prices };
          delete next[model];
          return { prices: next };
        });
      },

      setGlobalDefault: (pricing) => {
        set({ globalDefault: pricing });
      },

      getPrice: (model) => {
        const state = get();
        return state.prices[model] ?? state.globalDefault ?? null;
      },

      calculateCost: (model, inputTokens, outputTokens, cachedTokens) => {
        const pricing = get().getPrice(model);
        if (!pricing) return null;
        const actualInput = Math.max(0, inputTokens - cachedTokens);
        const cost =
          (actualInput / 1_000_000) * pricing.input +
          (outputTokens / 1_000_000) * pricing.output +
          (cachedTokens / 1_000_000) * pricing.cached;
        return cost;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
