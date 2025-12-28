'use client';

import {
  Building2,
  TrendingUp,
  Users,
  Palette,
  Trophy,
  User,
  MessageSquare,
  Cpu,
  GraduationCap,
  MapPin,
  Building,
  Sprout,
  School,
  Newspaper,
  type LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Building2,
  TrendingUp,
  Users,
  Palette,
  Trophy,
  User,
  MessageSquare,
  Cpu,
  GraduationCap,
  MapPin,
  Building,
  Sprout,
  School,
  Newspaper
};

interface CategoryIconProps {
  iconName: string;
  className?: string;
}

export function CategoryIcon({ iconName, className = 'w-12 h-12' }: CategoryIconProps) {
  const Icon = iconMap[iconName] || Newspaper;
  return <Icon className={className} />;
}
