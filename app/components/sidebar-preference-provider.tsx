"use client";

import { createContext, useContext } from "react";

const SidebarInitialCollapsedContext = createContext(false);

export function SidebarPreferenceProvider({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <SidebarInitialCollapsedContext.Provider value={initialCollapsed}>
      {children}
    </SidebarInitialCollapsedContext.Provider>
  );
}

export function useSidebarInitialCollapsed() {
  return useContext(SidebarInitialCollapsedContext);
}
