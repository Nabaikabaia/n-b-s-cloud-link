import { useMemo } from 'react';

export const useChristmasTheme = () => {
  const isChristmasDay = useMemo(() => {
    const today = new Date();
    return today.getMonth() === 11 && today.getDate() === 25; // December 25th
  }, []);

  return { isChristmasDay };
};
