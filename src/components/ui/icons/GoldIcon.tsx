'use client';

import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

// Shared gold-gradient + drop-shadow envelope for every icon in the set.
// Each icon component just provides its <path> — the gradient & shadow live
// here so the look stays consistent and tunable in one place.
//
// The .icon-gold-glow utility (in globals.css) adds the warm halo drop-shadow.
// We embed a <linearGradient> per-icon so we don't depend on a single shared
// <defs> being mounted somewhere — every icon is self-contained.

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'fill'> {
  size?: number;
  className?: string;
}

function gradId(name: string) {
  // Stable id per component instance — including a random suffix would defeat
  // SSR. The icon's own name is unique enough across the app.
  return `gold-grad-${name}`;
}

interface BaseProps extends IconProps {
  name: string;
  children: React.ReactNode;
  viewBox?: string;
}

function BaseGoldIcon({ name, children, size = 24, className, viewBox = '0 0 24 24', ...rest }: BaseProps) {
  const id = gradId(name);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      className={cn('icon-gold-glow inline-block', className)}
      aria-hidden
      {...rest}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE7A3" />
          <stop offset="35%" stopColor="#F1C876" />
          <stop offset="65%" stopColor="#D8A84E" />
          <stop offset="100%" stopColor="#9C7732" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`} stroke={`url(#${id}-rim)`} strokeWidth="0.4">
        {children}
      </g>
    </svg>
  );
}

export function CrownIcon(props: IconProps) {
  return (
    <BaseGoldIcon {...props} name="crown">
      <path d="M3 8.5 L7 14 L12 6 L17 14 L21 8.5 L20 18.5 H4 Z" />
      <circle cx="3" cy="8.5" r="1.4" />
      <circle cx="12" cy="6" r="1.4" />
      <circle cx="21" cy="8.5" r="1.4" />
      <rect x="4" y="19.5" width="16" height="1.6" rx="0.6" />
    </BaseGoldIcon>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <BaseGoldIcon {...props} name="star">
      <path d="M12 2.6 L14.3 9 L21 9.6 L15.9 13.9 L17.4 20.4 L12 16.9 L6.6 20.4 L8.1 13.9 L3 9.6 L9.7 9 Z" />
    </BaseGoldIcon>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <BaseGoldIcon {...props} name="sparkle">
      <path d="M12 2 L13.3 9 L20 12 L13.3 15 L12 22 L10.7 15 L4 12 L10.7 9 Z" />
      <path d="M19 3.5 L19.6 6 L22 6.7 L19.6 7.4 L19 9.9 L18.4 7.4 L16 6.7 L18.4 6 Z" />
      <path d="M5 14 L5.5 16 L7.5 16.6 L5.5 17.1 L5 19 L4.5 17.1 L2.6 16.6 L4.5 16 Z" />
    </BaseGoldIcon>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <BaseGoldIcon {...props} name="trophy">
      <path d="M7 3 H17 V8 A5 5 0 0 1 7 8 Z" />
      <path d="M3 5 H6.5 V8 A2.5 2.5 0 0 1 3 8 Z M21 5 H17.5 V8 A2.5 2.5 0 0 0 21 8 Z" />
      <path d="M10 12.5 H14 V15.5 H10 Z" />
      <path d="M8 16 H16 V18 H8 Z" />
      <path d="M7 19 H17 V21 H7 Z" />
    </BaseGoldIcon>
  );
}

export function GemIcon(props: IconProps) {
  return (
    <BaseGoldIcon {...props} name="gem">
      <path d="M5 9 L8 4 H16 L19 9 L12 21 Z" />
      <path d="M5 9 H19" opacity="0.35" />
      <path d="M9 9 L12 21 L15 9 Z" opacity="0.45" />
    </BaseGoldIcon>
  );
}

export function RibbonIcon(props: IconProps) {
  return (
    <BaseGoldIcon {...props} name="ribbon">
      <circle cx="12" cy="9" r="6" />
      <circle cx="12" cy="9" r="3.2" opacity="0.4" />
      <path d="M8 13 L5 22 L9 19.5 L12 22 L15 19.5 L19 22 L16 13 Z" />
    </BaseGoldIcon>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <BaseGoldIcon {...props} name="mic">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M6 11 V12 A6 6 0 0 0 18 12 V11" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="18" width="2" height="3" />
      <rect x="8" y="20.5" width="8" height="1.5" rx="0.5" />
    </BaseGoldIcon>
  );
}

// Convenience map for places that need to look up an icon by string id.
export const GOLD_ICONS = {
  crown: CrownIcon,
  star: StarIcon,
  sparkle: SparkleIcon,
  trophy: TrophyIcon,
  gem: GemIcon,
  ribbon: RibbonIcon,
  mic: MicIcon,
} as const;

export type GoldIconName = keyof typeof GOLD_ICONS;
