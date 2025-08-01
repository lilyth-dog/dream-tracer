"use client";
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  return (
    <div className={className ? `flex gap-2 items-center ${className}` : "flex gap-2 items-center"}>
      <span className="text-xs text-gray-500">🌐</span>
      <select
        className="border rounded px-2 py-1 text-sm"
        value={i18n.language}
        onChange={e => i18n.changeLanguage(e.target.value)}
        aria-label="언어 선택"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>
    </div>
  );
}
