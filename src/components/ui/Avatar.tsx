import { getInitial } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'size-8 text-sm',
  md: 'size-12 text-lg',
  lg: 'size-16 text-2xl',
  xl: 'size-24 text-4xl',
};

export function Avatar({ name, photoUrl, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-purple-neon to-magenta font-bold text-white ring-2 ring-gold/40 shadow-gold-glow',
        sizeMap[size],
        className,
      )}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="absolute inset-0 size-full object-cover" />
      ) : (
        <span>{getInitial(name)}</span>
      )}
    </div>
  );
}
