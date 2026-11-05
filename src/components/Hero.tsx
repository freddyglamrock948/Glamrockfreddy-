import React from 'react';
import { Sparkles, MessageSquare, Flame, Music, Shield, ArrowRight, ExternalLink } from 'lucide-react';

interface HeroProps {
  onOpenDashboard: () => void;
  onLoginClick: () => void;
  onSimulateOwner: () => void;
  isLoggedIn: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenDashboard,
  onLoginClick,
  onSimulateOwner,
  isLoggedIn
}) => {
  return (
    <section className="relative overflow-hidden py-10 md:py-16">
      {/* Background glow and subtle ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#53e7ff]/10 via-[#ff9b45]/10 to-transparent blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Split grid: Content & Hero Artwork */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Brand & Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#53e7ff] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#ff9b45]" />
              <span>Welcome to the Mega Pizzaplex</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Meet <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#53e7ff] via-[#ff9b45] to-[#ffaa40]">
                Glamrock Freddy.
              </span>
            </h1>

            <p className="text-base md:text-lg text-[#aab6c9] max-w-xl leading-relaxed">
              Your superstar protector animatronic and lead singer. Connect your Discord server to customize member welcome & goodbye embeds, chat with Freddy in character, unleash Absolute Solver glitches, and orchestrate Pizzaplex voice soundtrack streams.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isLoggedIn ? (
                <button
                  onClick={onOpenDashboard}
                  className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#ff9b45] to-[#ff8020] text-black hover:brightness-110 transition-all shadow-lg shadow-[#ff9b45]/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>Open Console Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={onLoginClick}
                    className="px-6 py-3.5 rounded-xl font-bold text-sm bg-[#5865f2] hover:bg-[#4752c4] text-white transition-all shadow-lg shadow-[#5865f2]/25 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Log in with Discord</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onSimulateOwner}
                    className="px-5 py-3.5 rounded-xl font-bold text-sm text-[#53e7ff] border border-[#53e7ff]/40 hover:bg-[#53e7ff]/10 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Try Interactive Demo</span>
                  </button>
                </>
              )}
            </div>

            {/* Quiet metadata row complying with anti-slop guidelines */}
            <div className="pt-4 flex flex-wrap items-center gap-3 text-xs text-[#7d8b9f]">
              <span>OAuth2 Identify Scope</span>
              <span aria-hidden="true">·</span>
              <span>Python Bot Bridge Ready</span>
              <span aria-hidden="true">·</span>
              <span>Absolute Solver Protocol</span>
              <span aria-hidden="true">·</span>
              <span>Synthesizer Soundboard</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#53e7ff]/30 shadow-2xl shadow-[#53e7ff]/10 group">
              <img
                src="/src/assets/images/glamrock_freddy_hero_1793907789001.jpg"
                alt="Glamrock Freddy center stage at the Mega Pizzaplex"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-[#090d16]/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Glamrock Freddy #1</div>
                  <div className="text-[11px] text-[#53e7ff]">Rockstar Row Lead Vocalist</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#ff9b45] font-mono tabular-nums font-bold">FAZBEAR 1.0.8</div>
                  <div className="text-[10px] text-[#7d8b9f]">Pizzaplex Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Columns below Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
          <div className="bg-[#121c2c]/80 border border-white/10 hover:border-[#53e7ff]/40 p-5 rounded-2xl transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#5865f2]/20 flex items-center justify-center text-[#5865f2] mb-3.5 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Discord OAuth2</h3>
            <p className="text-xs text-[#aab6c9] leading-relaxed">
              Secure identity sign-in with owner verification. Only authorized server managers can control the bot.
            </p>
          </div>

          <div className="bg-[#121c2c]/80 border border-white/10 hover:border-[#ff9b45]/40 p-5 rounded-2xl transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#ff9b45]/20 flex items-center justify-center text-[#ff9b45] mb-3.5 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Freddy Chat</h3>
            <p className="text-xs text-[#aab6c9] leading-relaxed">
              Talk directly with your protective superstar bear. Features authentic lines, dad jokes, and lore dialogue.
            </p>
          </div>

          <div className="bg-[#121c2c]/80 border border-white/10 hover:border-[#53e7ff]/40 p-5 rounded-2xl transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#53e7ff]/20 flex items-center justify-center text-[#53e7ff] mb-3.5 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Absolute Solver</h3>
            <p className="text-xs text-[#aab6c9] leading-relaxed">
              Trigger reality glitches, teleportation shifts, jumpscares, and animatronic roar effects on demand.
            </p>
          </div>

          <div className="bg-[#121c2c]/80 border border-white/10 hover:border-[#ff9b45]/40 p-5 rounded-2xl transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#9d4edd]/20 flex items-center justify-center text-[#9d4edd] mb-3.5 group-hover:scale-110 transition-transform">
              <Music className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Music & Voice</h3>
            <p className="text-xs text-[#aab6c9] leading-relaxed">
              Instruct Freddy to join your voice channel, broadcast Rockstar Row tracks, and preview with live audio visualizers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
