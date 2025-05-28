
"use client";

// A simple, cute cat SVG icon
const ShiroCatSVG = () => (
  <svg
    width="100"
    height="100"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Cute cat icon"
    role="img"
  >
    {/* Head */}
    <circle cx="50" cy="50" r="35" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2.5" />

    {/* Ears */}
    <path d="M30 30 Q35 10 50 25 C40 28 30 30 30 30 Z" fill="hsl(var(--accent))" opacity="0.6" />
    <path d="M70 30 Q65 10 50 25 C60 28 70 30 70 30 Z" fill="hsl(var(--accent))" opacity="0.6" />
    <path d="M33 32 Q37 18 50 28 C42 30 33 32 33 32 Z" fill="hsl(var(--card))" />
    <path d="M67 32 Q63 18 50 28 C58 30 67 32 67 32 Z" fill="hsl(var(--card))" />


    {/* Eyes - larger and rounder */}
    <circle cx="40" cy="48" r="6" fill="hsl(var(--foreground))" />
    <circle cx="60" cy="48" r="6" fill="hsl(var(--foreground))" />
    {/* Eye highlights */}
    <circle cx="42" cy="46" r="1.5" fill="hsl(var(--card))" />
    <circle cx="62" cy="46" r="1.5" fill="hsl(var(--card))" />

    {/* Nose - smaller and simpler */}
    <path d="M48 60 Q50 63 52 60 Z" fill="hsl(var(--accent))" />

    {/* Mouth - simple smile */}
    <path d="M45 68 Q50 72 55 68" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" strokeLinecap="round" />

    {/* Whiskers - fewer and softer */}
    <path d="M28 58 L40 60" stroke="hsl(var(--foreground))" strokeWidth="1" strokeLinecap="round" />
    <path d="M28 63 L40 63" stroke="hsl(var(--foreground))" strokeWidth="1" strokeLinecap="round" />

    <path d="M72 58 L60 60" stroke="hsl(var(--foreground))" strokeWidth="1" strokeLinecap="round" />
    <path d="M72 63 L60 63" stroke="hsl(var(--foreground))" strokeWidth="1" strokeLinecap="round" />
  </svg>
);


export function PixelCatAnimationPlaceholder() {
  return (
    <div className="my-4 p-2 border-2 border-dashed border-muted-foreground/50 rounded-md inline-block">
      <ShiroCatSVG />
      <p className="text-xs text-muted-foreground mt-1 italic text-center">
        Shiro is purr-fectly here!
      </p>
    </div>
  );
}
