import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Info,
  Radio,
  RefreshCw
} from 'lucide-react';

export const ServerBotBridge: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<string>("Connected to Fazbear Security Network · Ping: 32ms");
  const [isPinging, setIsPinging] = useState(false);
  const [serverData, setServerData] = useState<any>({
    status: 'online',
    latency: 32,
    guildCount: 1,
    voiceConnected: true,
    bridgeReady: true
  });

  const commands = [
    { cmd: '/freddy [message]', desc: 'Chat directly with Glamrock Freddy in character' },
    { cmd: '/glitch', desc: 'Trigger Absolute Solver optical distortion' },
    { cmd: '/protect', desc: 'Activate defensive shield protocol for a user' },
    { cmd: '/jumpscare', desc: 'Trigger soundboard animatronic jumpscare' },
    { cmd: '/welcome preview', desc: 'Preview welcome card embed in Discord' },
    { cmd: '/music [track]', desc: 'Stream soundtrack in active voice channel' },
    { cmd: '/status', desc: 'Check bot uptime, ping, and server status' },
    { cmd: '/roar', desc: 'Broadcast mechanical bear roar across audio channels' }
  ];

  const envVars = [
    { name: 'DISCORD_CLIENT_ID', desc: 'OAuth2 application ID from Discord Developer Portal', type: 'Website' },
    { name: 'DISCORD_CLIENT_SECRET', desc: 'OAuth2 client secret for identity exchange', type: 'Website' },
    { name: 'DISCORD_REDIRECT_URI', desc: 'Callback URL: https://YOUR-DOMAIN/auth/discord/callback', type: 'Website' },
    { name: 'OWNER_DISCORD_ID', desc: 'Your Discord account ID for restricted owner access', type: 'Website' },
    { name: 'FREDDY_BOT_API_URL', desc: 'Public HTTPS base URL of your Python bot service', type: 'Bridge' },
    { name: 'FREDDY_WEB_API_SECRET', desc: 'Shared secret matching FREDDY_WEB_API_SECRET on bot', type: 'Bridge' },
    { name: 'DISCORD_BOT_TOKEN', desc: 'Bot token with Guild & Message Content intents', type: 'Bot' }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePingStatus = async () => {
    setIsPinging(true);
    setBridgeStatus("Pinging Glamrock Freddy bot service...");

    try {
      const res = await fetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });
      const data = await res.json();
      setBridgeStatus(data.message || "Bot bridge active.");
      if (data.data) {
        setServerData(data.data);
      }
    } catch {
      setBridgeStatus("Simulated bridge operational (offline fallback mode active).");
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    handlePingStatus();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🎮 Discord Server & Bot Bridge</span>
          </h2>
          <p className="text-xs text-[#aab6c9] mt-1">
            Status monitor, command cheat sheet, and environment setup instructions for your Glamrock Freddy Python bot.
          </p>
        </div>

        <button
          onClick={handlePingStatus}
          disabled={isPinging}
          className="px-4 py-2 text-xs font-bold text-[#53e7ff] border border-[#53e7ff]/30 hover:bg-[#53e7ff]/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
          <span>Refresh Bridge Status</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121c2c] border border-white/10 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-[#7d8b9f] mb-1">BOT STATUS</div>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
          <div className="text-[11px] text-[#aab6c9] mt-1">Gateway Connected</div>
        </div>

        <div className="bg-[#121c2c] border border-white/10 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-[#7d8b9f] mb-1">LATENCY / PING</div>
          <div className="text-lg font-bold text-[#53e7ff] font-mono tabular-nums">
            {serverData.latency || 32} ms
          </div>
          <div className="text-[11px] text-[#aab6c9] mt-1">Fazbear Telemetry</div>
        </div>

        <div className="bg-[#121c2c] border border-white/10 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-[#7d8b9f] mb-1">CONNECTED GUILDS</div>
          <div className="text-lg font-bold text-white font-mono tabular-nums">
            {serverData.guildCount || 1} Server
          </div>
          <div className="text-[11px] text-[#aab6c9] mt-1">Freddy's Mega Pizzaplex</div>
        </div>

        <div className="bg-[#121c2c] border border-white/10 p-4 rounded-xl">
          <div className="text-[11px] font-mono text-[#7d8b9f] mb-1">VOICE CHANNEL</div>
          <div className="text-lg font-bold text-[#ff9b45] flex items-center gap-1.5">
            <Radio className="w-4 h-4" />
            <span>Rockstar Row</span>
          </div>
          <div className="text-[11px] text-[#aab6c9] mt-1">Ready for Broadcast</div>
        </div>
      </div>

      {/* Grid: Commands Reference & Environment Variables Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Commands Cheat Sheet */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#ff9b45]" />
                <span>Discord Slash Commands</span>
              </h3>
              <span className="text-[11px] text-[#7d8b9f]">Click to copy</span>
            </div>

            <div className="space-y-2">
              {commands.map((c) => (
                <div
                  key={c.cmd}
                  onClick={() => handleCopy(c.cmd, c.cmd)}
                  className="p-3 bg-[#0a1220] hover:bg-[#142033] border border-white/5 hover:border-white/20 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <code className="text-xs font-mono font-bold text-[#53e7ff] group-hover:text-white transition-colors">
                      {c.cmd}
                    </code>
                    <p className="text-[11px] text-[#aab6c9] mt-0.5 truncate">
                      {c.desc}
                    </p>
                  </div>

                  <div className="text-[#7d8b9f] group-hover:text-white shrink-0 ml-2">
                    {copiedKey === c.cmd ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Environment Setup Guide */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#53e7ff]" />
                <span>Bot Bridge Environment Setup</span>
              </h3>
              <span className="text-[11px] text-[#7d8b9f]">Architecture Guide</span>
            </div>

            <div className="p-3.5 bg-[#0a1220] rounded-xl border border-white/5 text-xs text-[#aab6c9] leading-relaxed">
              Glamrock Freddy operates as a two-service architecture: this <strong>Node.js Website</strong> handles OAuth2 login, live embed editors, and web controls; the companion <strong>Python Bot</strong> runs <code>discord.py</code> and connects to Discord Gateway.
            </div>

            <div className="space-y-2">
              {envVars.map((item) => (
                <div
                  key={item.name}
                  className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-white text-[11px]">
                      {item.name}
                    </span>
                    <p className="text-[11px] text-[#7d8b9f] mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    item.type === 'Website'
                      ? 'bg-[#53e7ff]/10 text-[#53e7ff] border border-[#53e7ff]/20'
                      : item.type === 'Bridge'
                      ? 'bg-[#ff9b45]/10 text-[#ff9b45] border border-[#ff9b45]/20'
                      : 'bg-[#9d4edd]/10 text-[#9d4edd] border border-[#9d4edd]/20'
                  }`}>
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
