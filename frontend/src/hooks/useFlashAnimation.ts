import { useState, useEffect, useRef } from "react";

export const useFlashAnimation = <T>(value: T, refreshKey: number) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const previousValue = useRef(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (previousValue.current !== value) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 500);
      previousValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value, refreshKey]);

  return isFlashing;
};
