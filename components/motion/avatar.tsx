"use client";

import { PlusCircleIcon } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/base-ui/avatar';
import { cn } from '@/lib/utils';

export interface Avatar10Props {
  name?: string;
  avatar?: string;
  actionLabel?: string;
  size?: string;
  showAction?: boolean;
  online?: boolean;
  className?: string;
  onActionClick?: () => void;
}

const defaultProfile = {
  name: 'Emma',
  avatar: 'https://assets.watermelon.sh/wm_emma.png',
  actionLabel: 'Invite',
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word.slice(0, 1))
    .join('')
    .toUpperCase();

const Avatar10 = ({
  name = defaultProfile.name,
  avatar = defaultProfile.avatar,
  actionLabel = defaultProfile.actionLabel,
  size = "size-10",
  showAction = false,
  online = false,
  className,
  onActionClick,
}: Avatar10Props) => {
  return (
    <div className={cn("relative w-fit inline-block shrink-0", className)}>
      <Avatar className={cn(size, "ring-1 ring-border/60 transition-transform hover:scale-105 duration-200")}>
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showAction && (
        <button
          type="button"
          onClick={onActionClick}
          className="focus-visible:ring-ring/50 absolute -right-1 -bottom-1 inline-flex cursor-pointer items-center justify-center rounded-full focus-visible:ring-[3px] focus-visible:outline-none transition-transform hover:scale-115"
        >
          <PlusCircleIcon className="text-background size-4.5 fill-primary" />
          <span className="sr-only">{actionLabel}</span>
        </button>
      )}
      {online && !showAction && (
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs" />
      )}
    </div>
  );
};

export { Avatar10 };
export default Avatar10;
