import Link from 'next/link';

interface LifestyleItem {
  href: string;
  icon: string;
  label: string;
  bgColor: string;
  iconColor: string;
  hoverBg: string;
}

interface LifestyleSectionProps {
  items?: LifestyleItem[];
  title?: string;
}

const defaultItems: LifestyleItem[] = [
  {
    href: '/farming',
    icon: 'agriculture',
    label: '귀농지원',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    hoverBg: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40',
  },
  {
    href: '/tour',
    icon: 'map',
    label: '관광지도',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
    hoverBg: 'group-hover:bg-green-100 dark:group-hover:bg-green-900/40',
  },
  {
    href: '/notice',
    icon: 'campaign',
    label: '고시공고',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    hoverBg: 'group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40',
  },
  {
    href: '/realestate',
    icon: 'home_work',
    label: '부동산',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    hoverBg: 'group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40',
  },
];

export default function LifestyleSection({
  items = defaultItems,
  title = '생활 정보 & 공공 데이터',
}: LifestyleSectionProps) {
  return (
    <section className="bg-white dark:bg-slate-900 py-6 px-4">
      <h3 className="text-[18px] font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="grid grid-cols-4 gap-4 text-center">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${item.bgColor} ${item.iconColor} ${item.hoverBg}`}
            >
              <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 group-hover:text-primary">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
