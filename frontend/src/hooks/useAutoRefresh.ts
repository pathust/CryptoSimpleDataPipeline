import { useState, useEffect, useCallback } from "react";

export const useAutoRefresh = (intervalSeconds: number = 60) => {
  const [countdown, setCountdown] = useState(intervalSeconds);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    setCountdown(intervalSeconds);
  }, [intervalSeconds]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRefreshKey((k) => k + 1);
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [intervalSeconds, isPaused]);

  return { countdown, refreshKey, refresh, isPaused, togglePause };
};
