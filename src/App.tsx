import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { WelcomeSettings } from './components/WelcomeSettings';
import { FreddyChat } from './components/FreddyChat';
import { SolverAndScares } from './components/SolverAndScares';
import { MusicVoiceControls } from './components/MusicVoiceControls';
import { ServerBotBridge } from './components/ServerBotBridge';
import {
  DEFAULT_SETTINGS,
  DEFAULT_OWNER,
  FreddySettings,
  UserSession
} from './utils/freddyBot';
import { soundEngine } from './utils/audio';
import { Sparkles, Shield, UserCheck, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('freddy_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default to owner simulation so the user can immediately play with the dashboard!
    return DEFAULT_OWNER;
  });

  const [settings, setSettings] = useState<FreddySettings>(() => {
    const saved = localStorage.getItem('freddy_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState<string>('hero');
  const [isGlitching, setIsGlitching] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Check URL parameters for OAuth callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordUserParam = params.get('discord_user');
    const oauthNotice = params.get('oauth_notice');
    const oauthError = params.get('oauth_error');

    if (discordUserParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(discordUserParam));
        setUser(parsed);
        localStorage.setItem('freddy_user', JSON.stringify(parsed));
        setActiveTab('settings');
        setBannerNotice(`Logged in as ${parsed.global_name || parsed.username}!`);
      } catch (e) {
        console.error('Failed to parse Discord OAuth user', e);
      }
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthNotice === 'not_configured') {
      setBannerNotice("Discord OAuth credentials are not configured in .env yet. You are using the interactive Demo Session.");
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthError) {
      setBannerNotice(`Discord Login: ${oauthError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Fetch initial settings from server
  useEffect(() => {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get' })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          localStorage.setItem('freddy_settings', JSON.stringify(data.settings));
        }
      })
      .catch(() => {
        // Fallback to local storage
      });
  }, []);

  const handleSaveSettings = async (newSettings: FreddySettings): Promise<boolean> => {
    setSettings(newSettings);
    localStorage.setItem('freddy_settings', JSON.stringify(newSettings));

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', settings: newSettings })
      });
      return res.ok;
    } catch {
      // In offline mode, localStorage persistence still succeeds
      return true;
    }
  };

  const handleTriggerGlitch = () => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 550);
  };

  const handleLoginClick = () => {
    // Redirect to real Discord OAuth endpoint
    window.location.href = '/auth/discord';
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('freddy_user');
    soundEngine.playActionSound('default');
    setBannerNotice("Logged out of Discord session.");
  };

  const handleSimulateOwner = () => {
    setUser(DEFAULT_OWNER);
    localStorage.setItem('freddy_user', JSON.stringify(DEFAULT_OWNER));
    setActiveTab('settings');
    soundEngine.playActionSound('default');
    setBannerNotice("Switched to Bot Owner Demo session (Full administrative access).");
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all ${isGlitching ? 'glitch-active' : ''}`}>
      {/* Visual Glitch Vignette */}
      {isGlitching && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-red-500/10 mix-blend-color-dodge backdrop-invert-15 animate-pulse" />
      )}

      {/* Top Banner Alert (if applicable) */}
      {bannerNotice && (
        <div className="bg-[#121c2c] border-b border-[#53e7ff]/30 px-6 py-2.5 text-xs text-[#53e7ff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#ff9b45]" />
            <span>{bannerNotice}</span>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="p-1 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
        onSimulateOwner={handleSimulateOwner}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {activeTab === 'hero' && (
          <Hero
            onOpenDashboard={() => setActiveTab('settings')}
            onLoginClick={handleLoginClick}
            onSimulateOwner={handleSimulateOwner}
            isLoggedIn={Boolean(user)}
          />
        )}

        {activeTab === 'settings' && (
          <WelcomeSettings
            settings={settings}
            onSave={handleSaveSettings}
          />
        )}

        {activeTab === 'chat' && (
          <FreddyChat />
        )}

        {activeTab === 'solver' && (
          <SolverAndScares onTriggerGlitch={handleTriggerGlitch} />
        )}

        {activeTab === 'music' && (
          <MusicVoiceControls />
        )}

        {activeTab === 'bridge' && (
          <ServerBotBridge />
        )}
      </main>

      {/* Anti-Slop Clean Footer */}
      <footer className="border-t border-white/10 py-8 bg-[#090d16]/80 text-xs text-[#7d8b9f]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="font-bold text-white tracking-wide">
              ★ GLAMROCK <span className="text-[#ff9b45]">FREDDY</span> CONSOLE
            </div>
            <p className="text-[11px] text-[#7d8b9f]">
              Fan-made Glamrock Freddy Pizzaplex website and bot bridge · Not affiliated with Discord, Scott Cawthon, or Steel Wool Studios.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-[#aab6c9]">
            <button
              onClick={() => setActiveTab('settings')}
              className="hover:text-[#53e7ff] transition-colors cursor-pointer"
            >
              Settings
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('chat')}
              className="hover:text-[#53e7ff] transition-colors cursor-pointer"
            >
              Chat
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('solver')}
              className="hover:text-[#53e7ff] transition-colors cursor-pointer"
            >
              Solver
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('music')}
              className="hover:text-[#53e7ff] transition-colors cursor-pointer"
            >
              Music
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('bridge')}
              className="hover:text-[#53e7ff] transition-colors cursor-pointer"
            >
              Bridge
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
