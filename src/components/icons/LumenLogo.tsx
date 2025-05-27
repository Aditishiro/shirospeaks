import React from 'react';

interface LumenLogoProps extends React.SVGProps<SVGSVGElement> {
  // additional props if needed
}

export const LumenLogo: React.FC<LumenLogoProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 20"
    fill="currentColor"
    {...props}
  >
    <text 
      x="0" 
      y="15" 
      fontFamily="var(--font-geist-sans), Arial, sans-serif" 
      fontSize="16" 
      fontWeight="bold"
      fill="currentColor"
    >
      LUMEN
    </text>
  </svg>
);
