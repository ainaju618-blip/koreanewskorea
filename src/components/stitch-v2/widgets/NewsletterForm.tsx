'use client';

import React, { useState } from 'react';

interface NewsletterFormProps {
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  onSubscribe?: (email: string) => Promise<void>;
  className?: string;
}

export default function NewsletterForm({
  title = '뉴스레터 구독',
  description = '매일 아침 주요 뉴스를 이메일로 받아보세요.',
  placeholder = '이메일 주소 입력',
  buttonText = '구독하기',
  onSubscribe,
  className = '',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      if (onSubscribe) {
        await onSubscribe(email);
      }
      setStatus('success');
      setMessage('구독이 완료되었습니다!');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('구독 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="material-symbols-outlined text-2xl text-primary dark:text-primary-light">
          mail
        </span>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light focus:border-transparent transition-all disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-xl">
                progress_activity
              </span>
              <span>처리 중...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-xl">send</span>
              <span>{buttonText}</span>
            </>
          )}
        </button>
      </form>

      {status !== 'idle' && (
        <p
          className={`mt-3 text-sm ${
            status === 'success'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
