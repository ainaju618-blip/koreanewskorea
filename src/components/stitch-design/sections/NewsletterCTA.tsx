'use client';

import { useState } from 'react';

interface NewsletterCTAProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  onSubscribe?: (email: string) => void;
}

export default function NewsletterCTA({
  title = '매일 아침, 뉴스레터로 받아보세요',
  subtitle = '놓치면 안되는 지역 소식',
  placeholder = '이메일 주소',
  buttonText = '구독',
  onSubscribe,
}: NewsletterCTAProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      onSubscribe?.(email);
      setEmail('');
      // TODO: 실제 구독 API 연동
      alert('구독 신청이 완료되었습니다!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="px-4 py-8">
      <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-center text-white">
        <p className="text-sm text-slate-300 mb-2">{subtitle}</p>
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-primary"
            placeholder={placeholder}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {isSubmitting ? '...' : buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}
