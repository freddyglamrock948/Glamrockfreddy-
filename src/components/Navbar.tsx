import React from 'react';
import { UserSession } from '../utils/freddyBot';
import { LogIn, LogOut, ShieldCheck, Volume2, AlertOctagon } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface NavbarProps {
  user: UserSession | null;
  activeTab: string;
  friendshipPoints: number;
  friendshipLevel: string;
  onTabChange: (tab: string) => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSimulateOwner: (variant?: 'main' | 'alt') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  friendshipPoints,
  friendshipLevel,
  onTabChange,
  onLoginClick,
  onLogoutClick,
  onSimulateOwner
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-[#ffffff15] px-6 py-3.5 flex items-center justify-between gap-8 transition-colors">
      {/* Zone 1: Wordmark with Live System Status Indicator */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onTabChange('hero')}
          className="text-left font-black tracking-wider text-white text-lg whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          ★ GLAMROCK <span className="text-[#ff9b45]">FREDDY</span>
        </button>

        <button
          onClick={() => onTabChange('bridge')}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
          title="Freddy Pizzaplex Console is active. Click to manage Discord Gateway bridge."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Console: Online</span>
        </button>
      </div>

      {/* Zone 2: 5 Concise Single-line Navigation Links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#aab6c9]">
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

        <button
          onClick={() => onTabChange('servers')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'servers' ? 'text-[#53e7ff] underline underline-offset-8 decoration-2' : ''
          }`}
        >
          Servers
        </button>

        <button
          onClick={() => onTabChange('logs')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'logs' ? 'text-[#53e7ff] underline underline-offset-8 decoration-2' : ''
          }`}
        >
          System Logs
        </button>

        <button
          onClick={() => onTabChange('contacts')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'contacts' ? 'text-[#53e7ff] underline underline-offset-8 decoration-2' : ''
          }`}
        >
          VIP Contacts
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action Area */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick audio triggers */}
        <div className="hidden xl:flex items-center gap-1.5 border-r border-white/10 pr-3">
          <button
            onClick={() => soundEngine.playGreeting()}
            title="Play authentic Freddy voice greeting: 'Way to go, superstar!'"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/5 hover:bg-[#53e7ff]/20 text-[#53e7ff] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#53e7ff]" />
            <span>Greeting</span>
          </button>

          <button
            onClick={() => soundEngine.playLockdown()}
            title="Play authentic Lockdown audio: 'Shut your mouth! I'm listening to music!'"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Lockdown</span>
          </button>
        </div>

        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex flex-col text-right">
              <div className="flex items-center justify-end gap-1.5">
                {user.isOwner && (
                  <button
                    onClick={() => onSimulateOwner(user.id === '1411436991005851832' ? 'alt' : 'main')}
                    title="Click to toggle between Main Owner and Alt Owner"
                    className="text-[11px] text-[#ff9b45] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{user.id === '1411436991005851832' ? 'Owner (Main)' : 'Owner (Alt)'}</span>
                  </button>
                )}
                <span className="text-xs font-semibold text-white truncate max-w-[110px]">
                  {user.global_name}
                </span>
              </div>
              <span className="text-[10px] text-[#7d8b9f]">
                {friendshipPoints} pts · {friendshipLevel}
              </span>
            </div>

            <button
              onClick={onLogoutClick}
              title="Log out"
              className="px-3 py-1.5 text-xs font-bold text-[#aab6c9] hover:text-white border border-[#ffffff20] hover:border-[#ffffff40] rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSimulateOwner('main')}
              title="Test the dashboard right now without Discord credentials"
              className="hidden sm:inline-flex px-3 py-1.5 text-xs font-bold text-[#53e7ff] border border-[#53e7ff]/40 hover:bg-[#53e7ff]/10 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
