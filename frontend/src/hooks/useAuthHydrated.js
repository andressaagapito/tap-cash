import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    if (!useAuthStore.persist.hasHydrated()) {
      useAuthStore.persist.rehydrate();
    } else {
      setHydrated(true);
    }

    return unsubscribe;
  }, []);

  return hydrated;
}
