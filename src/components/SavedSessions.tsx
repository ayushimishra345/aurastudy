/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, Trash2, Calendar, FileText, Database, ChevronRight } from 'lucide-react';
import { SavedBrainItem, StudyTheme } from '../types';

interface SavedSessionsProps {
  currentTheme: StudyTheme;
  sessions: SavedBrainItem[];
  onLoadSession: (session: SavedBrainItem) => void;
  onDeleteSession: (id: string) => void;
  activeSessionId?: string;
}

export default function SavedSessions({
  currentTheme,
  sessions,
  onLoadSession,
  onDeleteSession,
  activeSessionId,
}: SavedSessionsProps) {
  const [search, setSearch] = useState('');

  const filteredSessions = sessions.filter((s) => {
    const searchLower = search.toLowerCase();
    return (
      s.synthesis.title.toLowerCase().includes(searchLower) ||
      s.synthesis.overview.toLowerCase().includes(searchLower) ||
      s.notesExcerpt?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent Session';
    }
  };

  return (
    <div
      id="saved-sessions-section"
      className={`p-6 rounded-xl h-full flex flex-col ${
        currentTheme === 'minimal-light'
          ? 'border-3 border-black bg-white shadow-[6px_6px_0px_rgba(0,0,0,1)] rounded-none'
          : 'bg-card-bg/70 border border-border-accent/20 shadow-xl backdrop-blur-md'
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className={`text-lg font-bold flex items-center gap-2 ${
          currentTheme === 'minimal-light' ? 'text-black font-brutal font-extrabold' : 'text-text-primary font-display'
        }`}>
          <Database className="w-4 h-4 text-accent-primary" />
          Second Brain Vault
        </h2>
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
          currentTheme === 'minimal-light' ? 'border border-black bg-slate-100 text-black font-bold' : 'bg-white/5 text-text-secondary border border-white/5'
        }`}>
          {sessions.length} Saved
        </span>
      </div>

      {/* Local Search Input */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-text-secondary opacity-60" />
        </span>
        <input
          id="vault-search-input"
          type="text"
          placeholder="Search through knowledge vault..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-9 pr-4 py-2 text-xs transition-all duration-300 focus:outline-none ${
            currentTheme === 'minimal-light'
              ? 'border-2 border-black bg-white font-semibold text-black focus:bg-slate-50'
              : 'bg-black/30 border border-white/15 text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 rounded'
          }`}
        />
      </div>

      {/* Session Lists */}
      <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2.5">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xs text-text-secondary italic">
              {search ? 'No search matches found' : 'Knowledge Vault Empty'}
            </p>
            <p className="text-[10px] text-text-secondary/60 mt-1">
              {search ? 'Try adapting query keyword' : 'Synthesize research texts to fill storage.'}
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = activeSessionId === session.id;
            const themeBadgeColor = 
              session.themeUsed === 'midnight' 
                ? 'bg-purple-950 text-purple-300 border-purple-800' 
                : session.themeUsed === 'vaporwave' 
                  ? 'bg-pink-950 text-pink-300 border-pink-800' 
                  : session.themeUsed === 'modern-slate'
                    ? 'bg-slate-900 text-sky-400 border-slate-700'
                    : 'bg-slate-100 text-slate-800 border-slate-400';

            return (
              <div
                key={session.id}
                className={`p-3 border transition-all duration-300 flex items-center justify-between gap-3 group relative cursor-pointer ${
                  isActive
                    ? currentTheme === 'minimal-light'
                      ? 'border-2 border-black bg-black text-white rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                      : 'border-accent-secondary bg-white/5 text-text-primary'
                    : currentTheme === 'minimal-light'
                      ? 'border-2 border-slate-200 bg-white hover:border-black text-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                      : 'border-white/5 bg-black/15 hover:bg-black/35 hover:border-white/10 text-text-secondary hover:text-text-primary rounded'
                }`}
                onClick={() => onLoadSession(session)}
              >
                <div id={`vault-item-${session.id}`} className="flex-1 min-w-0 pr-6">
                  {/* Section Title & Theme Tag */}
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${themeBadgeColor}`}>
                      {session.themeUsed === 'minimal-light' ? 'brutalist' : session.themeUsed}
                    </span>
                    <span className="text-[9px] text-text-secondary/80 flex items-center gap-1 font-mono">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatDate(session.timestamp)}
                    </span>
                  </div>

                  <h3 className={`text-xs font-bold truncate ${
                    isActive && currentTheme === 'minimal-light' ? 'text-white' : 'text-text-primary'
                  }`}>
                    {session.synthesis.title}
                  </h3>

                  <p className="text-[10px] truncate opacity-70 mt-0.5 max-w-[200px]">
                    {session.notesExcerpt || 'No excerpt'}
                  </p>
                </div>

                {/* Loading Detail / Delete button */}
                <div className="flex items-center gap-1.5 flex-shrink-0 z-10">
                  <button
                    type="button"
                    title="Delete saved session"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className={`p-1.5 transition-all text-red-400/80 hover:text-red-400 hover:scale-110 cursor-pointer ${
                      currentTheme === 'minimal-light' ? 'hover:bg-slate-100 rounded-none' : 'hover:bg-white/5 rounded'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 opacity-60 ${
                    isActive ? 'text-accent-secondary' : 'text-text-secondary/50'
                  }`} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={`mt-4 pt-3 border-t text-[10px] text-text-secondary/50 flex items-center gap-1.5 ${
        currentTheme === 'minimal-light' ? 'border-t-black' : 'border-t-white/5'
      }`}>
        <FileText className="w-3.5 h-3.5" />
        <span>Persistence active inside LocalStorage.</span>
      </div>
    </div>
  );
}
