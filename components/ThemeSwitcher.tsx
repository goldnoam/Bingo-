
import React from 'react';
import { ThemeType } from '../types';

interface ThemeSwitcherProps {
  current: ThemeType;
  onSelect: (theme: ThemeType) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ current, onSelect }) => {
  const themes = [
    { id: ThemeType.LIGHT, label: 'בהיר', color: 'bg-white' },
    { id: ThemeType.DARK, label: 'כהה', color: 'bg-slate-900' },
    { id: ThemeType.COLORFUL, label: 'צבעוני', color: 'bg-gradient-to-r from-pink-500 to-orange-400' },
  ];

  return (
    <div className="flex bg-slate-800/10 p-1 rounded-2xl gap-1">
      {themes.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`
            px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2
            ${current === t.id 
              ? 'bg-white shadow-lg text-slate-900 scale-105' 
              : 'text-slate-500 hover:text-slate-800'
            }
          `}
        >
          <div className={`w-3 h-3 rounded-full ${t.color} border border-slate-200`} />
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
