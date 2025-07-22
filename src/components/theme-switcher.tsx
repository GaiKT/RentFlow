'use client';

import { useTheme } from '@/contexts/theme-context';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="dropdown dropdown-end">
        <div className="btn btn-ghost btn-circle">
          <Sun className="w-5 h-5" />
        </div>
      </div>
    );
  }

  const themes = [
    {
      key: 'light' as const,
      label: 'สว่าง',
      icon: Sun,
      description: 'โหมดสว่าง'
    },
    {
      key: 'dark' as const,
      label: 'มืด',
      icon: Moon,
      description: 'โหมดมืด'
    },
    {
      key: 'auto' as const,
      label: 'อัตโนมัติ',
      icon: Monitor,
      description: 'ตามการตั้งค่าระบบ'
    }
  ];

  const currentTheme = themes.find(t => t.key === theme) || themes[2];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="dropdown dropdown-end">
      <div 
        tabIndex={0} 
        role="button" 
        className="btn btn-ghost btn-circle hover:bg-base-300 transition-colors"
        title="เปลี่ยนธีม"
      >
        <CurrentIcon className="w-5 h-5" />
      </div>
      
      <ul 
        tabIndex={0} 
        className="menu menu-sm dropdown-content z-[1] p-2 shadow-lg bg-base-100 rounded-box w-60 border border-base-300"
      >
        <li className="menu-title">
          <span className="text-base-content/70 font-semibold">เปลี่ยนธีม</span>
        </li>
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.key;
          
          return (
            <li key={themeOption.key}>
              <button
                onClick={() => setTheme(themeOption.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-content font-medium' 
                    : 'hover:bg-base-200 text-base-content'
                }`}
              >
                <Icon className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{themeOption.label}</div>
                  <div className={`text-xs ${
                    isActive ? 'text-primary-content/70' : 'text-base-content/60'
                  }`}>
                    {themeOption.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-primary-content"></div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
