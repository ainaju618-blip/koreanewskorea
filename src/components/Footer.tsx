import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#0a192f] text-slate-400 border-t-4 border-[#A6121D]">
            <div className="max-w-[1400px] mx-auto px-6 py-16">

                {/* Top Section: Brand & Navigation */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 border-b border-white/10 pb-12">

                    {/* Brand Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link href="/" className="inline-block group">
                            <span className="text-4xl font-black text-white tracking-tighter">
                                코리아<span className="text-[#A6121D]">NEWS</span>
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                            세상을 바꾸는 뉴스, 코리아NEWS는 정직한 보도와 깊이 있는 분석으로 독자 여러분과 함께합니다.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <SocialLink icon={<Facebook className="w-5 h-5" />} href="#" label="Facebook" />
                            <SocialLink icon={<Instagram className="w-5 h-5" />} href="#" label="Instagram" />
                            <SocialLink icon={<Youtube className="w-5 h-5" />} href="#" label="Youtube" />
                            <SocialLink icon={<Twitter className="w-5 h-5" />} href="#" label="Twitter" />
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider text-opacity-80">회사소개</h4>
                            <ul className="space-y-3 text-sm">
                                <FooterLink href="/about">코리아NEWS 소개</FooterLink>
                                <FooterLink href="/history">연혁</FooterLink>
                                <FooterLink href="/organization">조직도</FooterLink>
                                <FooterLink href="/location">오시는 길</FooterLink>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider text-opacity-80">고객센터</h4>
                            <ul className="space-y-3 text-sm">
                                <FooterLink href="/notice">공지사항</FooterLink>
                                <FooterLink href="/report">기사제보</FooterLink>
                                <FooterLink href="/ad-inquiry">광고문의</FooterLink>
                                <FooterLink href="/contact">제휴문의</FooterLink>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider text-opacity-80">약관 및 정책</h4>
                            <ul className="space-y-3 text-sm">
                                <FooterLink href="/terms">이용약관</FooterLink>
                                <FooterLink href="/privacy" highlight>개인정보처리방침</FooterLink>
                                <FooterLink href="/youth-policy">청소년보호정책</FooterLink>
                                <FooterLink href="/ethical-code">윤리강령</FooterLink>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider text-opacity-80">Family Site</h4>
                            <ul className="space-y-3 text-sm">
                                <a href="#" className="flex items-center gap-2 hover:text-white transition-colors group">
                                    남도 다이소 <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </a>
                                <a href="#" className="flex items-center gap-2 hover:text-white transition-colors group">
                                    뉴스TV <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </a>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Info & Copyright */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 text-[13px] leading-relaxed text-slate-500 font-light">

                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-x-6 gap-y-1">
                            <span><strong className="text-slate-400 font-medium">제호:</strong> 코리아NEWS (Korea News)</span>
                            <span><strong className="text-slate-400 font-medium">발행·편집인:</strong> 고광욱</span>
                            <span><strong className="text-slate-400 font-medium">등록번호:</strong> 광주, 아00517</span>
                            <span><strong className="text-slate-400 font-medium">등록일자:</strong> 2024.09.19</span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1">
                            <span><strong className="text-slate-400 font-medium">사업자등록번호:</strong> 801-07-03054</span>
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 010-2631-3865</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> editor@koreanews.com</span>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span>(우 61421) 광주광역시 동구 독립로 338, 501호 (계림동)</span>
                        </div>
                    </div>

                    <div className="text-left md:text-right">
                        <p className="mb-2">
                            본 본사는 한국신문윤리위원회 인터넷신문윤리강령 및 심의규정을 준수합니다.
                        </p>
                        <p className="font-medium text-slate-400">
                            © 2024 Korea News. All rights reserved.
                        </p>
                        <Link
                            href="/admin"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-600 hover:text-[#A6121D] mt-2 inline-block transition-colors border-b border-transparent hover:border-[#A6121D]"
                        >
                            Admin Mode
                        </Link>
                    </div>

                </div>
            </div>
        </footer>
    );
}

function FooterLink({ href, children, highlight = false }: { href: string; children: React.ReactNode; highlight?: boolean }) {
    return (
        <li>
            <Link
                href={href}
                className={`transition-colors duration-200 block ${highlight ? 'text-white font-bold' : 'hover:text-white'}`}
            >
                {children}
            </Link>
        </li>
    );
}

function SocialLink({ icon, href, label }: { icon: React.ReactNode; href: string; label: string }) {
    return (
        <a
            href={href}
            aria-label={label}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#A6121D] hover:text-white transition-all duration-300 group"
        >
            <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                {icon}
            </div>
        </a>
    );
}
