import React from 'react';
import { getRoleBadgeInfo } from '../utils/organizationRoles';
import { Crown, Shield, BookOpen, Sparkles, Star, Award, Compass } from 'lucide-react';

interface RoleBadgeProps {
  role?: string | any;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
  className = '',
  onClick
}) => {
  const roleString = typeof role === 'object' && role !== null 
    ? (role.title || role.short || role.name || '') 
    : (typeof role === 'string' ? role : '');

  const info = getRoleBadgeInfo(roleString);
  if (!info) return null;

  const renderIcon = () => {
    if (!showIcon) return null;
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

    switch (info.iconType) {
      case 'crown':
        return <Crown className={`${iconSize} text-amber-500 fill-amber-400/20 shrink-0`} />;
      case 'shield':
        return <Shield className={`${iconSize} text-rose-500 fill-rose-400/20 shrink-0`} />;
      case 'ibadah':
        return <Compass className={`${iconSize} text-emerald-600 shrink-0`} />;
      case 'lughoh':
        return <BookOpen className={`${iconSize} text-purple-600 shrink-0`} />;
      case 'nadzofah':
        return <Sparkles className={`${iconSize} text-teal-600 shrink-0`} />;
      case 'class':
        return <Star className={`${iconSize} text-sky-600 fill-sky-400/20 shrink-0`} />;
      default:
        return <Award className={`${iconSize} text-blue-600 shrink-0`} />;
    }
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 rounded-md font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-lg font-bold',
    lg: 'text-xs sm:text-sm px-3.5 py-1.5 gap-2 rounded-xl font-extrabold'
  }[size];

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center border transition-all select-none ${info.badgeClass} ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:brightness-105 active:scale-95' : ''
      } ${className}`}
      title={`Amanah: ${info.label}`}
    >
      {renderIcon()}
      <span className="whitespace-normal sm:whitespace-nowrap leading-tight">{info.label}</span>
    </span>
  );
};

