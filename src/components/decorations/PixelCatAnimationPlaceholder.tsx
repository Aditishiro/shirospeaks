
"use client";

import Image from 'next/image';

export function PixelCatAnimationPlaceholder() {
  return (
    <div className="my-4 p-2 border-2 border-dashed border-muted-foreground/50 rounded-md inline-block">
      <Image
        src="https://placehold.co/100x100.png?text=Shiro!"
        alt="Cute cat placeholder"
        width={100}
        height={100}
        className="object-contain"
        data-ai-hint="white kitten"
        // For a pixel art style if desired for the placeholder, you could add:
        // style={{ imageRendering: 'pixelated' }}
      />
      <p className="text-xs text-muted-foreground mt-1 italic text-center">
        (Shiro placeholder)
      </p>
    </div>
  );
}
