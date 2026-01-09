import Link from 'next/link';

interface QuickMenuItem {
  href: string;
  icon: string;
  label: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

interface QuickMenuProps {
  items?: QuickMenuItem[];
}

const defaultItems: QuickMenuItem[] = [
  { href: '/notice', icon: 'campaign', label: '공지사항', color: 'blue' },
  { href: '/civil', icon: 'gavel', label: '민원/행정', color: 'blue' },
  { href: '/jobs', icon: 'apartment', label: '부동산/일자리', color: 'blue' },
  { href: '/tour', icon: 'map', label: '관광/지도', color: 'blue' },
];

const colorClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-primary group-hover:bg-primary group-hover:text-white',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white',
};

export default function QuickMenu({ items = defaultItems }: QuickMenuProps) {
  return (
    <div className="py-6 px-4 bg-white dark:bg-[#101722]">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`flex items-center justify-center size-14 rounded-2xl transition-colors duration-200 ${colorClasses[item.color || 'blue']}`}>
              <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
            </div>
            <span className="text-xs font-medium text-gray-900 dark:text-gray-300">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
