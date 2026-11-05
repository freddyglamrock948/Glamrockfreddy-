import React from 'react';
import { UserSession } from '../utils/freddyBot';
import { LogIn, LogOut, ShieldCheck, User } from 'lucide-react';

interface NavbarProps {
  user: UserSession | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSimulateOwner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onLoginClick,
  onLogoutClick,
  onSimulateOwner
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-[#ffffff15] px-6 py-4 flex items-center justify-between gap-8 transition-colors">
      {/* Zone 1: Single Text Element Wordmark */}
      <button
        onClick={() => onTabChange('hero')}
        className="text-left font-black tracking-wider text-white text-lg whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
      >
        ★ GLAMROCK <span className="text-[#ff9b45]">FREDDY</span>
      </button>

      {/* Zone 2: 5 Concise Single-line Navigation Links */}
      <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-[#aab6c9]">
        <button
          onClick={() => onTabChange('settings')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'settings' ? 'text-[#53e7ff] underline underline-offset-8 decoration-2' : ''
          }`}
        >
          Welcome & Goodbye
        </button>

        <button
          onClick={() => onTabChange('chat')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'chat' ? 'text-[#53e7ff] underline underline-offset-8 decoration-2' : ''
          }`}
        >
          Freddy Chat
        </button>

        <button
          onClick={() => onTabChange('solver')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'solver' ? 'text-[#53e7ff] underline underline-offset-8 decoration-2' : ''
          }`}
        >
          Solver & Scares
        </button>

        <button
          onClick={() => onTabChange('music')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'music' ? 'text-[#53e7ff] underline underline-offset-8 decoration-2' : ''
          }`}
        >
          Music & Voice
        </button>

        <button
          onClick={() => onTabChange('bridge')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'bridge' ? 'text-[#53e7ff] underline underline-offset-8 decoration-2' : ''
          }`}
        >
          Bot Bridge
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-right">
              {user.isOwner && (
                <span className="text-xs text-[#ff9b45] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Owner
                </span>
              )}
              <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                {user.global_name}
              </span>
            </div>

            <button
              onClick={onLogoutClick}
              title="Log out"
              className="px-3.5 py-1.5 text-xs font-bold text-[#aab6c9] hover:text-white border border-[#ffffff20] hover:border-[#ffffff40] rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onSimulateOwner}
              title="Test the dashboard right now without Discord credentials"
              className="hidden sm:inline-flex px-3 py-1.5 text-xs font-bold text-[#53e7ff] border border-[#53e7ff]/40 hover:bg-[#53e7ff]/10 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Demo Sign In
            </button>

            <button
              onClick={onLoginClick}
              className="px-4 py-2 text-xs font-bold text-white bg-[#5865f2] hover:bg-[#4752c4] rounded-xl transition-all shadow-lg shadow-[#5865f2]/20 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log in with Discord</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
