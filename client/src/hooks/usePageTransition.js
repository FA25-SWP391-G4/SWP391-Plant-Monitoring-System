import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const usePageTransition = () => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    
    // Simulate loading time for smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return { isLoading };
};

export default usePageTransition;