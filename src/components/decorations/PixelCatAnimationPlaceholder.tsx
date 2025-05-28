
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
    <path
      d="M50 90C72.0914 90 90 72.0914 90 50C90 27.9086 72.0914 10 50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90Z"
      fill="hsl(var(--card))" 
      stroke="hsl(var(--foreground))"
      strokeWidth="3"
    />
    {/* Ears */}
    <path d="M35 30 C30 15, 20 25, 35 30 Z" fill="hsl(var(--accent))" opacity="0.5" />
    <path d="M65 30 C70 15, 80 25, 65 30 Z" fill="hsl(var(--accent))" opacity="0.5" />
    <path d="M38 32 C35 20, 25 28, 38 32 Z" fill="hsl(var(--card))" />
    <path d="M62 32 C65 20, 75 28, 62 32 Z" fill="hsl(var(--card))" />
    {/* Eyes */}
    <circle cx="40" cy="45" r="5" fill="hsl(var(--foreground))" />
    <circle cx="60" cy="45" r="5" fill="hsl(var(--foreground))" />
    {/* Nose */}
    <path d="M48 55 Q50 60 52 55Z" fill="hsl(var(--accent))" />
    {/* Mouth whiskers */}
    <path d="M40 60 Q50 65 60 60" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" />
    <path d="M30 55 L40 58" stroke="hsl(var(--foreground))" strokeWidth="1" />
    <path d="M30 60 L40 60" stroke="hsl(var(--foreground))" strokeWidth="1" />
    <path d="M30 65 L40 62" stroke="hsl(var(--foreground))" strokeWidth="1" />
    <path d="M70 55 L60 58" stroke="hsl(var(--foreground))" strokeWidth="1" />
    <path d="M70 60 L60 60" stroke="hsl(var(--foreground))" strokeWidth="1" />
    <path d="M70 65 L60 62" stroke="hsl(var(--foreground))" strokeWidth="1" />
  </svg>
);


export function PixelCatAnimationPlaceholder() {
  return (
    <div className="my-4 p-2 border-2 border-dashed border-muted-foreground/50 rounded-md inline-block">
      <ShiroCatSVG />
      <p className="text-xs text-muted-foreground mt-1 italic text-center">
        Shiro is here!
      </p>
    </div>
  );
}
