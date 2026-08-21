import { createContext, useContext } from "react";
import type { SeoSetting } from "@shared/schema";

export const SeoContext = createContext<SeoSetting | null>(null);

export function useSeoContext() {
  return useContext(SeoContext);
}
