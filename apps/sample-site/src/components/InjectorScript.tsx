'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function InjectorInner() {
  const searchParams = useSearchParams();
  const inject = searchParams.get('inject');
  
  useEffect(() => {
    if (inject === '1') {
      // Load local UMD injector for testing
      const script = document.createElement('script');
      script.src = 'http://localhost:3000/dist/injector.umd.js';
      script.async = true;
      script.onload = () => {
        console.log('[Sample Site] WebExp injector loaded');
        
        // Initialize with auto-ID configuration for testing
        if ((window as any).WebExpInjector) {
          (window as any).WebExpInjector.init({
            envKey: 'test-env-key',
            flagKey: 'sample-experiment',
            context: { 
              kind: 'user',
              custom: { 
                page: window.location.pathname,
                userAgent: navigator.userAgent.substring(0, 50)
              }
            },
            autoId: {
              enabled: true,
              cookieName: 'webexp_demo_id',
              ttlDays: 90,
              respectDoNotTrack: true,
              requireConsent: false,
              storageFallback: 'localStorage'
            },
            spaMode: true,
            onReady: () => {
              console.log('[Sample Site] WebExp injector ready');
              
              // Log auto-ID diagnostics
              const diagnostics = (window as any).WebExpInjector.getAutoIdDiagnostics();
              console.log('[Sample Site] Auto-ID diagnostics:', diagnostics);
              
              const anonymousId = (window as any).WebExpInjector.getAnonymousId();
              if (anonymousId) {
                console.log('[Sample Site] Using anonymous ID:', anonymousId);
              }
            },
            onError: (error: any) => {
              console.error('[Sample Site] WebExp injector error:', error);
            }
          });
        }
      };
      script.onerror = () => {
        console.warn('[Sample Site] Failed to load WebExp injector');
      };
      
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [inject]);
  
  return null;
}

export function InjectorScript() {
  return (
    <Suspense fallback={null}>
      <InjectorInner />
    </Suspense>
  );
}
