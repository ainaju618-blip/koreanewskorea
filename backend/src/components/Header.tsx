import Link from 'next/link';

// 메뉴 항목 정의
const menuItems = [
    { name: '종합', href: '/category/all' },
    { name: '정치', href: '/category/politics' },
    { name: '경제', href: '/category/economy' },
    { name: '사회', href: '/category/society' },
    { name: 'AI특집', href: '/category/ai-special' },
];

export default function Header() {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 로고 영역 */}
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center">
                        <h1 className="text-2xl font-bold" style={{ color: '#003366' }}>
                            AI Korea News
                        </h1>
                    </Link>
                </div>

                {/* 네비게이션 메뉴 */}
                <nav className="border-t border-gray-100">
                    <ul className="flex space-x-8 py-3">
                        {menuItems.map((item) => (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className="text-gray-700 hover:text-blue-800 font-medium transition-colors"
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </header>
    );
}
