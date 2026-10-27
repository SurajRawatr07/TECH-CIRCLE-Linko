import React, { useEffect, useRef, useState } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import heroAnimationData from '../../assets/linkpulse-hero.json';

interface LottieHeroAnimationProps {
  className?: string;
}

export function LottieHeroAnimation({ className = '' }: LottieHeroAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animInstanceRef = useRef<AnimationItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    // Check if the user has requested reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    async function initAnimation() {
      try {
        // Destroy existing instance if present
        if (animInstanceRef.current) {
          animInstanceRef.current.destroy();
          animInstanceRef.current = null;
        }

        // Use direct bundled JSON data with fallback to fetch
        let animData = heroAnimationData;
        if (!animData || typeof animData !== 'object' || !('v' in animData)) {
          let res = await fetch('/assets/lottie/linkpulse-hero.json').catch(() => null);
          if (!res || !res.ok) {
            res = await fetch('/hero-animation.json');
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          animData = await res.json();
        }

        if (!isMounted || !containerRef.current) return;

        const anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: !prefersReducedMotion,
          autoplay: !prefersReducedMotion,
          animationData: animData,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
            className: 'w-full h-full object-contain pointer-events-none drop-shadow-sm',
          },
        });

        animInstanceRef.current = anim;

        anim.addEventListener('DOMLoaded', () => {
          if (isMounted) {
            setIsLoaded(true);
            if (prefersReducedMotion) {
              anim.goToAndStop(30, true);
              setIsPlaying(false);
            } else {
              setIsPlaying(true);
            }
          }
        });

        anim.addEventListener('data_failed', () => {
          if (isMounted) {
            console.error('Lottie data failed to load');
            setHasError(true);
          }
        });
      } catch (err) {
        console.error('Failed to initialize exact hero Lottie animation:', err);
        if (isMounted) setHasError(true);
      }
    }

    initAnimation();

    return () => {
      isMounted = false;
      if (animInstanceRef.current) {
        animInstanceRef.current.destroy();
        animInstanceRef.current = null;
      }
    };
  }, []);

  const togglePlayback = () => {
    if (!animInstanceRef.current) return;
    if (isPlaying) {
      animInstanceRef.current.pause();
      setIsPlaying(false);
    } else {
      animInstanceRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div
      className={`relative w-full flex items-center justify-center select-none ${className}`}
      role="img"
      aria-label="Linko Real-Time URL Routing and Analytics Lottie Animation"
    >
      {/* Fluid responsive wrapper: strictly within viewport on 320px up to 1440px desktop */}
      <div className="relative w-full max-w-[280px] min-[360px]:max-w-[320px] sm:max-w-[380px] md:max-w-[440px] lg:max-w-[480px] aspect-square flex items-center justify-center">
        {/* Subtle decorative glow that responds to light/dark themes */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/10 via-amber-500/10 to-teal-500/10 dark:from-emerald-400/10 dark:via-amber-400/10 dark:to-teal-400/10 blur-2xl -z-10 pointer-events-none transform scale-95"
          aria-hidden="true"
        />

        {/* Loading skeleton while SVG mounts */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-800 dark:border-t-neutral-100 rounded-full animate-spin" />
          </div>
        )}

        {/* Error state fallback */}
        {hasError ? (
          <div className="text-center p-4 text-xs text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">
              Interactive Animation
            </p>
            <p className="mt-1">URL Shortening & Real-Time Analytics Engine</p>
          </div>
        ) : (
          /* Exact Lottie Player Container */
          <div
            ref={containerRef}
            onClick={togglePlayback}
            className={`w-full h-full flex items-center justify-center transition-opacity duration-300 cursor-pointer ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            title={isPlaying ? 'Click to pause animation' : 'Click to play animation'}
          />
        )}
      </div>
    </div>
  );
}
