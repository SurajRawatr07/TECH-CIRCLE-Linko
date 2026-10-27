import React, { useState, useEffect } from 'react';

interface HeroPhoneQrIllustrationProps {
  className?: string;
}

export function HeroPhoneQrIllustration({ className = '' }: HeroPhoneQrIllustrationProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  return (
    <div
      className={`relative w-full flex items-center justify-center select-none ${className}`}
      role="img"
      aria-label="Interactive Linko Smartphone with QR Code and Person Animation"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
    >
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/15 via-purple-500/15 to-pink-500/15 dark:from-teal-400/20 dark:via-purple-500/20 dark:to-pink-400/20 blur-3xl -z-10 pointer-events-none transform scale-95 transition-opacity duration-700"
        aria-hidden="true"
      />

      {/* SVG Container with responsive aspect ratio and 4K scalable vector graphics */}
      <div className="relative w-full max-w-[320px] min-[360px]:max-w-[350px] sm:max-w-[420px] md:max-w-[460px] lg:max-w-[500px] xl:max-w-[540px] aspect-[600/540] flex items-center justify-center">
        <svg
          viewBox="0 0 600 540"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible drop-shadow-md"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="phoneFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="phoneScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            <linearGradient id="phoneScreenDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#090d16" />
              <stop offset="100%" stopColor="#131b2e" />
            </linearGradient>

            <linearGradient id="qrCardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>

            <linearGradient id="accentTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>

            <linearGradient id="accentPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            <linearGradient id="laserBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
              <stop offset="20%" stopColor="#ec4899" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
              <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="personJacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#115e59" />
              <stop offset="70%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#134e4a" />
            </linearGradient>

            <linearGradient id="personPantsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Drop Shadows */}
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.14" />
            </filter>

            <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>

            <filter id="laserGlow" x="-20%" y="-100%" width="140%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Custom Embedded CSS Keyframe Animations */}
            <style>{`
              @keyframes floatSlow {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-9px) rotate(1.2deg); }
              }
              @keyframes floatMedium {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(8px) rotate(-1deg); }
              }
              @keyframes scanLaser {
                0% { transform: translateY(0px); opacity: 0; }
                15% { opacity: 0.95; }
                50% { transform: translateY(128px); opacity: 1; }
                85% { opacity: 0.95; }
                100% { transform: translateY(0px); opacity: 0; }
              }
              @keyframes pulseWave {
                0% { r: 10px; opacity: 0.8; }
                100% { r: 34px; opacity: 0; }
              }
              @keyframes personIdle {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-4px); }
              }
              @keyframes armGesture {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(2deg) translateY(-2px); }
              }
              @keyframes streamDash {
                to { stroke-dashoffset: -40; }
              }
              @keyframes sparkleGlow {
                0%, 100% { transform: scale(0.9); opacity: 0.5; }
                50% { transform: scale(1.15); opacity: 1; }
              }

              .anim-float-1 { animation: floatSlow 4.8s ease-in-out infinite; }
              .anim-float-2 { animation: floatMedium 5.4s ease-in-out infinite; }
              .anim-float-3 { animation: floatSlow 6.2s ease-in-out infinite; }
              .anim-laser { animation: scanLaser 3.2s ease-in-out infinite; }
              .anim-pulse { animation: pulseWave 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite; }
              .anim-person { animation: personIdle 4.2s ease-in-out infinite; transform-origin: center bottom; }
              .anim-arm { animation: armGesture 3.6s ease-in-out infinite; transform-origin: 430px 240px; }
              .anim-stream { animation: streamDash 2s linear infinite; }
              .anim-sparkle { animation: sparkleGlow 3s ease-in-out infinite; }

              @media (prefers-reduced-motion: reduce) {
                .anim-float-1, .anim-float-2, .anim-float-3,
                .anim-laser, .anim-pulse, .anim-person,
                .anim-arm, .anim-stream, .anim-sparkle {
                  animation: none !important;
                }
              }
            `}</style>
          </defs>

          {/* ============================================================ */}
          {/* 1. Isometric Ground Plane & Perspective Shadows */}
          {/* ============================================================ */}
          <g opacity="0.85">
            <ellipse cx="280" cy="492" rx="230" ry="24" fill="#0f172a" fillOpacity="0.08" />
            <ellipse cx="260" cy="492" rx="140" ry="16" fill="#0f172a" fillOpacity="0.12" />
            <ellipse cx="450" cy="495" rx="50" ry="12" fill="#0f172a" fillOpacity="0.1" />
            {/* Concentric subtle radar pulse on the ground */}
            <ellipse cx="260" cy="490" rx="180" ry="20" stroke="#14b8a6" strokeWidth="1" strokeDasharray="6 6" opacity="0.3" />
          </g>

          {/* ============================================================ */}
          {/* 2. Streaming Data Flow Lines */}
          {/* ============================================================ */}
          <g opacity="0.65">
            <path
              d="M 120 180 C 180 180, 200 240, 250 250"
              stroke="url(#accentPurpleGrad)"
              strokeWidth="2"
              strokeDasharray="6 6"
              fill="none"
              className={prefersReducedMotion ? '' : 'anim-stream'}
            />
            <path
              d="M 370 280 C 400 280, 420 260, 442 248"
              stroke="url(#accentTealGrad)"
              strokeWidth="2"
              strokeDasharray="5 5"
              fill="none"
              className={prefersReducedMotion ? '' : 'anim-stream'}
            />
          </g>

          {/* ============================================================ */}
          {/* 3. The Large Elegant Smartphone */}
          {/* ============================================================ */}
          <g filter="url(#softShadow)">
            {/* Phone Outer Chassis with Metallic Edge (Isometric slight angle) */}
            <rect
              x="148"
              y="60"
              width="234"
              height="424"
              rx="38"
              fill="url(#phoneFrameGrad)"
              stroke="#475569"
              strokeWidth="2"
            />
            {/* Inner Bezel Highlight */}
            <rect
              x="152"
              y="64"
              width="226"
              height="416"
              rx="34"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1"
            />

            {/* Smartphone Display Screen */}
            <rect
              x="158"
              y="70"
              width="214"
              height="404"
              rx="28"
              fill="url(#phoneScreenGrad)"
            />

            {/* Dynamic Island / Speaker Pill */}
            <rect x="236" y="80" width="58" height="14" rx="7" fill="#020617" />
            <circle cx="282" cy="87" r="3.5" fill="#1e293b" />
            <circle cx="248" cy="87" r="2" fill="#0f766e" />

            {/* Status Bar Indicators */}
            <text x="176" y="91" fill="#64748b" fontSize="9" fontWeight="600" fontFamily="sans-serif">9:41</text>
            <path d="M 346 85 L 358 85 A 2 2 0 0 1 360 87 L 360 91 A 2 2 0 0 1 358 93 L 346 93 Z" fill="#64748b" />
            <rect x="348" y="87" width="9" height="4" rx="1" fill="#0f766e" />

            {/* App URL Header Card */}
            <g transform="translate(172, 110)">
              <rect x="0" y="0" width="186" height="38" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" filter="url(#badgeShadow)" />
              <circle cx="18" cy="19" r="10" fill="#f0fdf4" />
              <path d="M 14 19 L 17 22 L 23 16" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <text x="34" y="18" fill="#0f172a" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">linko.to/pro</text>
              <text x="34" y="29" fill="#14b8a6" fontSize="8.5" fontWeight="600" fontFamily="sans-serif">Live Redirect · 12ms</text>
              {/* Green live dot */}
              <circle cx="170" cy="19" r="3.5" fill="#22c55e" />
            </g>

            {/* ============================================================ */}
            {/* The QR Code Card Display on Screen */}
            {/* ============================================================ */}
            <g transform="translate(172, 160)" filter="url(#badgeShadow)">
              {/* QR Card Container */}
              <rect x="0" y="0" width="186" height="212" rx="18" fill="url(#qrCardGrad)" stroke="#e2e8f0" strokeWidth="1" />

              {/* QR Code Title */}
              <text x="93" y="24" fill="#0f766e" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.8">
                SCAN & CONNECT
              </text>

              {/* QR Inner White Canvas */}
              <g transform="translate(23, 34)">
                <rect x="0" y="0" width="140" height="140" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

                {/* --- Top Left Finder Square --- */}
                <rect x="10" y="10" width="34" height="34" rx="6" fill="#0f766e" />
                <rect x="15" y="15" width="24" height="24" rx="4" fill="#ffffff" />
                <rect x="20" y="20" width="14" height="14" rx="3" fill="#a855f7" />

                {/* --- Top Right Finder Square --- */}
                <rect x="96" y="10" width="34" height="34" rx="6" fill="#0f766e" />
                <rect x="101" y="15" width="24" height="24" rx="4" fill="#ffffff" />
                <rect x="106" y="20" width="14" height="14" rx="3" fill="#a855f7" />

                {/* --- Bottom Left Finder Square --- */}
                <rect x="10" y="96" width="34" height="34" rx="6" fill="#0f766e" />
                <rect x="15" y="101" width="24" height="24" rx="4" fill="#ffffff" />
                <rect x="20" y="106" width="14" height="14" rx="3" fill="#a855f7" />

                {/* --- Data Matrix Bit Pattern --- */}
                {/* Row 1-3 fillers */}
                <rect x="52" y="12" width="6" height="6" rx="1" fill="#334155" />
                <rect x="64" y="12" width="6" height="6" rx="1" fill="#0f766e" />
                <rect x="76" y="12" width="12" height="6" rx="1" fill="#ec4899" />

                <rect x="52" y="24" width="12" height="6" rx="1" fill="#0f766e" />
                <rect x="70" y="24" width="6" height="6" rx="1" fill="#334155" />
                <rect x="82" y="24" width="6" height="6" rx="1" fill="#334155" />

                <rect x="52" y="36" width="6" height="6" rx="1" fill="#334155" />
                <rect x="64" y="36" width="12" height="6" rx="1" fill="#a855f7" />
                <rect x="82" y="36" width="6" height="6" rx="1" fill="#0f766e" />

                {/* Timing lines */}
                <rect x="12" y="52" width="6" height="6" rx="1" fill="#0f766e" />
                <rect x="24" y="52" width="6" height="6" rx="1" fill="#334155" />
                <rect x="36" y="52" width="6" height="6" rx="1" fill="#0f766e" />
                <rect x="48" y="52" width="6" height="6" rx="1" fill="#334155" />
                <rect x="60" y="52" width="6" height="6" rx="1" fill="#0f766e" />
                <rect x="72" y="52" width="6" height="6" rx="1" fill="#334155" />
                <rect x="84" y="52" width="6" height="6" rx="1" fill="#0f766e" />
                <rect x="96" y="52" width="6" height="6" rx="1" fill="#334155" />
                <rect x="108" y="52" width="6" height="6" rx="1" fill="#0f766e" />
                <rect x="120" y="52" width="6" height="6" rx="1" fill="#334155" />

                {/* Center LinkPulse Logo Badge */}
                <rect x="53" y="53" width="34" height="34" rx="8" fill="#0f172a" stroke="#ffffff" strokeWidth="2" filter="url(#badgeShadow)" />
                <path
                  d="M 64 73 C 62 70, 62 66, 65 63 C 68 60, 72 60, 75 63 M 76 67 C 78 70, 78 74, 75 77 C 72 80, 68 80, 65 77"
                  stroke="#14b8a6"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="70" cy="70" r="2" fill="#ec4899" />

                {/* Lower pattern bits */}
                <rect x="52" y="96" width="6" height="6" rx="1" fill="#ec4899" />
                <rect x="64" y="96" width="12" height="6" rx="1" fill="#0f766e" />
                <rect x="82" y="96" width="6" height="6" rx="1" fill="#334155" />

                <rect x="96" y="70" width="12" height="6" rx="1" fill="#334155" />
                <rect x="114" y="70" width="6" height="6" rx="1" fill="#0f766e" />
                <rect x="96" y="82" width="6" height="6" rx="1" fill="#a855f7" />
                <rect x="108" y="82" width="18" height="6" rx="1" fill="#334155" />

                <rect x="52" y="108" width="12" height="6" rx="1" fill="#334155" />
                <rect x="70" y="108" width="6" height="6" rx="1" fill="#0f766e" />
                <rect x="82" y="108" width="12" height="6" rx="1" fill="#ec4899" />

                <rect x="96" y="102" width="6" height="6" rx="1" fill="#0f766e" />
                <rect x="108" y="102" width="12" height="6" rx="1" fill="#334155" />
                <rect x="96" y="118" width="18" height="6" rx="1" fill="#0f766e" />
                <rect x="120" y="118" width="6" height="6" rx="1" fill="#a855f7" />

                {/* ============================================================ */}
                {/* Animated Laser Scanning Beam */}
                {/* ============================================================ */}
                <g className={prefersReducedMotion ? '' : 'anim-laser'}>
                  <rect x="4" y="6" width="132" height="3" rx="1.5" fill="url(#laserBeamGrad)" filter="url(#laserGlow)" />
                  <rect x="10" y="4" width="120" height="7" fill="url(#laserBeamGrad)" opacity="0.25" />
                </g>
              </g>

              {/* Card Footer Ticker */}
              <g transform="translate(18, 185)">
                <rect x="0" y="0" width="150" height="18" rx="9" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
                <circle cx="10" cy="9" r="3" fill="#14b8a6" />
                <text x="20" y="12.5" fill="#475569" fontSize="8" fontWeight="600" fontFamily="sans-serif">
                  High-Resolution Vector Code
                </text>
              </g>
            </g>

            {/* Bottom Action Bar on Screen */}
            <g transform="translate(172, 386)">
              <rect x="0" y="0" width="186" height="42" rx="12" fill="#0f172a" />
              <text x="93" y="19" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
                Open Destination
              </text>
              <text x="93" y="32" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
                Instant Zero-Latency Redirect
              </text>
            </g>

            {/* Home indicator bar */}
            <rect x="235" y="462" width="60" height="4" rx="2" fill="#cbd5e1" />
          </g>

          {/* ============================================================ */}
          {/* 4. The Person Beside the Phone (Interacting) */}
          {/* ============================================================ */}
          <g
            id="personGroup"
            className={prefersReducedMotion ? '' : 'anim-person'}
            filter="url(#softShadow)"
          >
            {/* --- Legs & Shoes --- */}
            {/* Left Leg */}
            <path
              d="M 436 370 L 428 474 L 416 474 L 424 370 Z"
              fill="url(#personPantsGrad)"
            />
            {/* Left Shoe */}
            <path
              d="M 412 472 C 412 470, 420 468, 432 468 L 434 476 C 434 478, 426 480, 412 480 Z"
              fill="#ffffff"
              stroke="#0f766e"
              strokeWidth="1.5"
            />
            <rect x="410" y="478" width="24" height="3" rx="1.5" fill="#14b8a6" />

            {/* Right Leg (Forward) */}
            <path
              d="M 454 370 L 468 474 L 480 474 L 466 370 Z"
              fill="url(#personPantsGrad)"
            />
            {/* Right Shoe */}
            <path
              d="M 466 472 C 466 470, 474 468, 488 468 L 490 476 C 490 478, 482 480, 466 480 Z"
              fill="#ffffff"
              stroke="#0f766e"
              strokeWidth="1.5"
            />
            <rect x="466" y="478" width="25" height="3" rx="1.5" fill="#ec4899" />

            {/* --- Torso & Jacket --- */}
            {/* Inner Shirt */}
            <path
              d="M 434 238 L 466 238 L 462 372 L 438 372 Z"
              fill="#f8fafc"
            />
            {/* Stylish Jacket */}
            <path
              d="M 426 236 C 438 232, 462 232, 474 236 L 476 348 C 466 354, 434 354, 424 348 Z"
              fill="url(#personJacketGrad)"
            />
            {/* Jacket Lapel Trim (LinkPulse Accent Colors) */}
            <path
              d="M 436 236 L 444 310 L 450 310 L 458 236"
              stroke="#ec4899"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="448" cy="330" r="2.5" fill="#14b8a6" />

            {/* --- Head & Hair --- */}
            {/* Neck */}
            <rect x="444" y="218" width="12" height="20" rx="4" fill="#fed7aa" />

            {/* Face/Head (Turned towards the phone) */}
            <ellipse cx="448" cy="198" rx="16" ry="20" fill="#fed7aa" />

            {/* Minimalist Glasses / Visor in Tech Style */}
            <rect x="434" y="194" width="18" height="6" rx="3" fill="#0f172a" />
            <line x1="434" y1="197" x2="444" y2="197" stroke="#14b8a6" strokeWidth="1.2" />

            {/* Hair (Sleek Modern Charcoal/Espresso) */}
            <path
              d="M 432 198 C 430 182, 444 172, 462 174 C 470 176, 472 186, 468 196 C 462 190, 452 186, 442 190 Z"
              fill="#1e293b"
            />

            {/* --- Left Arm (Extended Interacting with Phone Interface) --- */}
            <g id="armInteracting" className={prefersReducedMotion ? '' : 'anim-arm'}>
              {/* Sleeve */}
              <path
                d="M 428 244 C 412 250, 396 256, 382 254"
                stroke="url(#personJacketGrad)"
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              />
              {/* Forearm & Hand gesturing toward QR */}
              <path
                d="M 382 254 L 364 250"
                stroke="#fed7aa"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
              />
              {/* Pointing Finger */}
              <circle cx="360" cy="249" r="4.5" fill="#fed7aa" />

              {/* Touch interaction pulse ring at finger tip */}
              <g transform="translate(360, 249)">
                <circle cx="0" cy="0" r="8" stroke="#14b8a6" strokeWidth="1.5" fill="none" opacity="0.6" />
                <circle cx="0" cy="0" r="14" stroke="#ec4899" strokeWidth="1" fill="none" className={prefersReducedMotion ? '' : 'anim-pulse'} />
              </g>
            </g>

            {/* --- Right Arm (Relaxed holding tablet or device) --- */}
            <path
              d="M 470 244 C 478 260, 484 286, 482 308"
              stroke="url(#personJacketGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
            />
            {/* Hand */}
            <circle cx="482" cy="314" r="5" fill="#fed7aa" />
            {/* Mini smart device in hand */}
            <rect x="476" y="306" width="14" height="20" rx="3" fill="#0f172a" stroke="#14b8a6" strokeWidth="1" transform="rotate(12 476 306)" />
          </g>

          {/* ============================================================ */}
          {/* 5. Floating Link Symbols & Micro-Cards */}
          {/* ============================================================ */}

          {/* Floating Card 1: Top-Left Short Link Badge */}
          <g transform="translate(60, 110)" className={prefersReducedMotion ? '' : 'anim-float-1'} filter="url(#badgeShadow)">
            <rect x="0" y="0" width="128" height="42" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="8" y="8" width="26" height="26" rx="8" fill="#fdf2f8" />
            {/* Link Icon */}
            <path
              d="M 17 21 A 3 3 0 0 1 20 18 L 22 18 A 3 3 0 0 1 25 21 M 21 21 L 23 21 M 22 24 A 3 3 0 0 1 19 27 L 17 27 A 3 3 0 0 1 14 24"
              stroke="#ec4899"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <text x="40" y="20" fill="#0f172a" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">Smart Link</text>
            <text x="40" y="31" fill="#64748b" fontSize="8" fontFamily="sans-serif">Custom Slug Active</text>
            {/* Decorative dot */}
            <circle cx="116" cy="14" r="3" fill="#ec4899" />
          </g>

          {/* Floating Card 2: Top-Right Real-Time Clicks Badge */}
          <g transform="translate(420, 90)" className={prefersReducedMotion ? '' : 'anim-float-2'} filter="url(#badgeShadow)">
            <rect x="0" y="0" width="126" height="44" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="20" cy="22" r="12" fill="#f0fdf4" />
            {/* Trending Up Arrow */}
            <path d="M 14 26 L 19 20 L 22 23 L 26 17 M 22 17 L 26 17 L 26 21" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <text x="38" y="20" fill="#0f172a" fontSize="10" fontWeight="700" fontFamily="sans-serif">+1,420 Clicks</text>
            <text x="38" y="32" fill="#16a34a" fontSize="8.5" fontWeight="600" fontFamily="sans-serif">+34.8% This Week</text>
          </g>

          {/* Floating Card 3: Bottom-Left Enterprise Trust Shield Badge */}
          <g transform="translate(70, 340)" className={prefersReducedMotion ? '' : 'anim-float-3'} filter="url(#badgeShadow)">
            <rect x="0" y="0" width="130" height="40" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="8" y="8" width="24" height="24" rx="7" fill="#f0fdfa" />
            {/* Shield Check Icon */}
            <path
              d="M 20 13 L 26 15.5 V 20 C 26 23.5 23 25.5 20 26.5 C 17 25.5 14 23.5 14 20 V 15.5 Z"
              fill="#ccfbf1"
              stroke="#0f766e"
              strokeWidth="1.4"
            />
            <path d="M 18 19.5 L 19.5 21 L 22.5 18" stroke="#0f766e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <text x="38" y="20" fill="#0f172a" fontSize="9.5" fontWeight="700" fontFamily="sans-serif">Safe & Verified</text>
            <text x="38" y="30" fill="#0f766e" fontSize="8" fontWeight="600" fontFamily="sans-serif">Zero Malware / 100%</text>
          </g>

          {/* ============================================================ */}
          {/* 6. Geometric Accent Sparkles and Micro-Nodes */}
          {/* ============================================================ */}
          {/* Purple Sparkle 1 */}
          <g transform="translate(130, 70)" className={prefersReducedMotion ? '' : 'anim-sparkle'}>
            <path d="M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="#a855f7" />
          </g>

          {/* Pink Sparkle 2 */}
          <g transform="translate(540, 160)" className={prefersReducedMotion ? '' : 'anim-sparkle'}>
            <path d="M 0 -7 L 1.8 -1.8 L 7 0 L 1.8 1.8 L 0 7 L -1.8 1.8 L -7 0 L -1.8 -1.8 Z" fill="#ec4899" />
          </g>

          {/* Teal Sparkle 3 */}
          <g transform="translate(390, 420)" className={prefersReducedMotion ? '' : 'anim-sparkle'}>
            <path d="M 0 -6 L 1.5 -1.5 L 6 0 L 1.5 1.5 L 0 6 L -1.5 1.5 L -6 0 L -1.5 -1.5 Z" fill="#14b8a6" />
          </g>

          {/* Tiny Dots */}
          <circle cx="100" cy="270" r="3" fill="#cbd5e1" />
          <circle cx="510" cy="380" r="2.5" fill="#f472b6" opacity="0.6" />
          <circle cx="340" cy="50" r="2.5" fill="#2dd4bf" opacity="0.7" />
          <circle cx="480" cy="80" r="2" fill="#c084fc" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
