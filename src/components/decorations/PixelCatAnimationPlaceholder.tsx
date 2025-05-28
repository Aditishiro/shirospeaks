
"use client";

import Image from 'next/image';

export function PixelCatAnimationPlaceholder() {
  return (
    <div className="my-4 p-2 border-2 border-dashed border-muted-foreground/50 rounded-md inline-block">
      <Image
        src="https://placehold.co/80x60.png?text=Shiro!"
        alt="Pixel cat placeholder"
        width={80}
        height={60}
        className="object-contain"
        data-ai-hint="pixel cat running"
        style={{ imageRendering: 'pixelated' }}
      />
      <p className="text-xs text-muted-foreground mt-1 italic">
        (Pixel cat animation placeholder)
      </p>
    </div>
  );
}
