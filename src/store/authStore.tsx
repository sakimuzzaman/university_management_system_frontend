"use client";

/* ------------------------------------------------------------------ */
/*  Session store (Zustand) — one store instance per React tree,      */
/*  seeded from the Server Component layout. A per-request store      */
/*  avoids leaking user state between requests during SSR.            */
/* ------------------------------------------------------------------ */

import * as React from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type { User } from "@/lib/types";

export interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (user: User) => void;
  clear: () => void;
}

function createAuthStore(initialUser: User | null) {
  return createStore<AuthState>()((set) => ({
    user: initialUser,
    setUser: (user) => set({ user }),
    updateUser: (user) => set({ user }),
    clear: () => set({ user: null }),
  }));
}

const AuthStoreContext = React.createContext<StoreApi<AuthState> | null>(null);

export function AuthStoreProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) {
  const [store] = React.useState(() => createAuthStore(initialUser));

  // Keep the store in sync when the server re-renders with fresh data (router.refresh()).
  React.useEffect(() => {
    store.setState({ user: initialUser });
  }, [initialUser, store]);

  return <AuthStoreContext.Provider value={store}>{children}</AuthStoreContext.Provider>;
}

export function useAuthStore(): AuthState;
export function useAuthStore<T>(selector: (state: AuthState) => T): T;
export function useAuthStore<T>(selector?: (state: AuthState) => T) {
  const store = React.useContext(AuthStoreContext);
  if (!store) throw new Error("useAuthStore must be used inside <AuthStoreProvider>");
  return useStore(store, selector ?? ((state: AuthState) => state as unknown as T));
}

export { roleHome } from "@/lib/roles";
