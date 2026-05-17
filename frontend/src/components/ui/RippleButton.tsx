import {
  RippleButton as BaseRippleButton,
  RippleButtonRipples,
} from '@/components/animate-ui/primitives/buttons/ripple';
import React from 'react';

export interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hoverScale?: number;
  tapScale?: number;
  children: React.ReactNode;
}

export function RippleButton({
  hoverScale = 1.02,
  tapScale = 0.98,
  className = "",
  children,
  ...props
}: RippleButtonProps) {
  return (
    <BaseRippleButton
      hoverScale={hoverScale}
      tapScale={tapScale}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
      <RippleButtonRipples />
    </BaseRippleButton>
  );
}
