"use client";

import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint: number = 768) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check initial
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Set initial value
        checkMobile();

        // Add listener
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, [breakpoint]);

    return isMobile;
}
