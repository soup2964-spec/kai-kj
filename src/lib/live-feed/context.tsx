"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getLiveFeedState,
  subscribeLiveFeed,
  type LiveFeedState,
} from "./store";

const LiveFeedContext = createContext<LiveFeedState | null>(null);

export function LiveFeedProvider({ children }: { children: React.ReactNode }) {
  const [feedState, setFeedState] = useState<LiveFeedState>(() =>
    getLiveFeedState(),
  );

  useEffect(() => subscribeLiveFeed(setFeedState), []);

  return (
    <LiveFeedContext.Provider value={feedState}>
      {children}
    </LiveFeedContext.Provider>
  );
}

export function useLiveFeed() {
  const context = useContext(LiveFeedContext);
  if (!context) {
    throw new Error("useLiveFeed must be used within LiveFeedProvider");
  }
  return context;
}
