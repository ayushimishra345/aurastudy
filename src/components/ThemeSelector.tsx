/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sparkles, Moon, Sun, Flame, Sprout, Coffee, Palette, Eye } from 'lucide-react';
import { StudyTheme } from '../types';

interface ThemeSelectorProps {
  currentTheme: StudyTheme;
  onChangeTheme: (theme: StudyTheme) => void;
}

export default function ThemeSelector({ currentTheme, onChangeTheme }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Add data-theme attribute on root element
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Apply custom theme colors if 'custom' is active or even if other themes are swapped (guarantees consistency)
    if (currentTheme === 'custom') {
      const storedColors = localStorage.getItem('aurastudy_custom_theme_colors');
      if (storedColors) {
        try {
          const colors = JSON.parse(storedColors);
          Object.keys(colors).forEach((key) => {
            document.documentElement.style.setProperty(`--custom-${key}`, colors[key]);
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [currentTheme]);

  const themes: { id: StudyTheme; name: string; desc: string; icon: any; colorText: string; bgBtn: string; hoverBtn: string }[] = [
    {
      id: 'modern-slate',
      name: 'Eye-Friendly Slate',
      desc: 'Sleek Calming Dark Grey & Sky Blue',
      icon: Eye,
      colorText: 'text-sky-400',
      bgBtn: 'bg-slate-900 border border-slate-700/60',
      hoverBtn: 'hover:bg-slate-800 hover:border-slate-500/80',
    },
    {
      id: 'midnight',
      name: 'Midnight Obsidian',
      desc: 'Deep Space Purple & Cyan Neon Glow',
      icon: Moon,
      colorText: 'text-cyan-400',
      bgBtn: 'bg-black/40 border border-purple-500/30',
      hoverBtn: 'hover:bg-purple-900/20 hover:border-purple-500/80',
    },
    {
      id: 'vaporwave',
      name: 'Vaporwave Sunset',
      desc: 'Hot Pink & Lime Green Dream',
      icon: Sparkles,
      colorText: 'text-rose-400',
      bgBtn: 'bg-[#271042]/50 border border-pink-500/30',
      hoverBtn: 'hover:bg-pink-950/40 hover:border-pink-500/80',
    },
    {
      id: 'minimal-light',
      name: 'Minimal Light',
      desc: 'Brutalist High-Contrast Sketchbook',
      icon: Sun,
      colorText: 'text-slate-900',
      bgBtn: 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
      hoverBtn: 'hover:bg-slate-100',
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Acid',
      desc: 'Neon Yellow & Toxic Purple Grid',
      icon: Flame,
      colorText: 'text-yellow-400',
      bgBtn: 'bg-black/50 border border-yellow-500/50',
      hoverBtn: 'hover:bg-yellow-950/30',
    },
    {
      id: 'forest',
      name: 'Emerald Moss',
      desc: 'Deep Sylvan Greens & Soft Gold',
      icon: Sprout,
      colorText: 'text-emerald-400',
      bgBtn: 'bg-emerald-950/30 border border-emerald-500/30',
      hoverBtn: 'hover:bg-emerald-900/20',
    },
    {
      id: 'coffee',
      name: 'Warm Espresso',
      desc: 'Rich Mocha Browns & Velvet Orange',
      icon: Coffee,
      colorText: 'text-amber-500',
      bgBtn: 'bg-amber-950/30 border border-amber-600/30',
      hoverBtn: 'hover:bg-amber-900/20',
    },
    {
      id: 'custom',
      name: 'Aesthetic Custom',
      desc: 'Your Unique Color Palette Engine',
      icon: Palette,
      colorText: 'text-indigo-400',
      bgBtn: 'bg-indigo-950/30 border border-indigo-500/30',
      hoverBtn: 'hover:bg-indigo-900/20',
    }
  ];

  const currentThemeObj = themes.find((t) => t.id === currentTheme) || themes[0];
  const ThemeIcon = currentThemeObj.icon;

  return (
    <div id="theme-selector-container" className="relative z-50">
      {/* Sleek Dynamic Trigger Button */}
      <button
        id="theme-select-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-all duration-300 rounded cursor-pointer ${
          currentTheme === 'minimal-light'
            ? 'border-2 border-slate-950 font-brutal bg-white shadow-[3px_3px_0px_rgba(0,0,0,1)] text-slate-950 hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] active:translate-y-[1px]'
            : 'border border-border-accent/40 bg-card-bg text-text-primary hover:border-accent-primary shadow-[0_0_12px_rgba(139,92,246,0.05)] active:scale-95'
        }`}
      >
        <ThemeIcon className={`w-4 h-4 ${currentThemeObj.colorText} animate-pulse`} />
        <span>{currentThemeObj.name}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Clickaway backdrop */}
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
          
          <div
            id="theme-dropdown-menu"
            className={`absolute right-0 mt-2.5 w-72 rounded-lg origin-top-right transition-all duration-300 z-50 overflow-hidden ${
              currentTheme === 'minimal-light'
                ? 'border-3 border-black bg-white rounded-none shadow-[6px_6px_0px_rgba(0,0,0,1)]'
                : 'border border-border-accent/40 bg-card-bg/95 backdrop-blur-xl shadow-xl'
            }`}
          >
            <div className={`p-2.5 flex flex-col gap-1.5 ${currentTheme === 'minimal-light' ? '' : 'divide-y divide-white/5'}`}>
              <div className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${currentTheme === 'minimal-light' ? 'text-black font-brutal border-b-2 border-black pb-1 mb-1' : 'text-text-secondary/60 font-display'}`}>
                Switch Aesthetic Space
              </div>
              
              <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1">
                {themes.map((theme) => {
                  const ItemIcon = theme.icon;
                  const isSelected = theme.id === currentTheme;
                  
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        onChangeTheme(theme.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left flex items-start gap-3 p-2.5 transition-all duration-200 group rounded cursor-pointer ${
                        isSelected
                          ? currentTheme === 'minimal-light'
                            ? 'bg-slate-200 border-2 border-black rounded-none font-semibold'
                            : 'bg-border-accent/15 border border-border-accent/50'
                          : currentTheme === 'minimal-light'
                            ? 'hover:bg-slate-100 border border-transparent'
                            : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className={`p-1.5 rounded transition-transform group-hover:scale-110 ${
                        theme.id === 'minimal-light' ? 'bg-slate-100 text-black' : 'bg-black/35'
                      }`}>
                        <ItemIcon className={`w-4 h-4 ${theme.colorText}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold truncate flex items-center justify-between ${
                          currentTheme === 'minimal-light' ? 'text-black font-brutal' : 'text-text-primary font-display'
                        }`}>
                          {theme.name}
                          {isSelected && (
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              currentTheme === 'minimal-light' ? 'bg-black' : 'bg-accent-secondary'
                            }`} />
                          )}
                        </div>
                        <div className={`text-[10px] leading-relaxed truncate ${
                          currentTheme === 'minimal-light' ? 'text-slate-600' : 'text-text-secondary/80'
                        }`}>
                          {theme.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
