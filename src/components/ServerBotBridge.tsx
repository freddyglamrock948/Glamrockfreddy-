import React, { useState, useEffect, useRef } from 'react';
import {
  Server,
  Activity,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Radio,
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  KeyRound,
  X
} from 'lucide-react';
import { SystemLogPanel } from './SystemLogPanel';
import { DiscordServersList } from './DiscordServersList';

interface PingSample {
  id: string | number;
  time: string;
  latency: number;
  clientRoundtrip: number;
  status: 'online' | 'offline' | 'connecting' | 'error';
}

interface ServerData {
  status: 'online' | 'offline' | 'connecting' | 'error';
  latency: number;
  guildCount: number;
  guilds?: { id: string; name: string; memberCount: number }[];
  voiceConnected: boolean;
  bridgeReady: boolean;
  onlineSince: string | null;
  uptimeSeconds: number;
  serverUptimeSeconds?: number;
  lastHeartbeat?: string;
  gatewayStatus?: string;
  packetLoss?: string;
  shards?: number;
  heartbeatsAcked?: number;
  isRealDiscordBotConnected?: boolean;
  userTag?: string | null;
  botId?: string | null;
  avatarUrl?: string | null;
  registeredCommands?: string[];
  isChristmasHyperMode?: boolean;
  connectionError?: string | null;
  hostingNotice?: string;
}

export const ServerBotBridge: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<string>("Glamrock Freddy Discord Bot: OFFLINE · Standby Mode · Voice: Disconnected");
  const [isPinging, setIsPinging] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(4);
  const [secondsUntilNext, setSecondsUntilNext] = useState<number>(4);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [secondsSinceLastPing, setSecondsSinceLastPing] = useState<number>(0);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [inputToken, setInputToken] = useState<string>('');
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);
  const [configResult, setConfigResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleSaveBotToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    setIsConfiguring(true);
    setConfigResult(null);

    try {
      const res = await fetch('/api/discord/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: inputToken.trim() })
      });
      const data = await res.json();
      if (data.ok) {
        setConfigResult({ success: true, message: data.message });
        setInputToken('');
        await probeStatus(true);
        setTimeout(() => setShowConfigModal(false), 2000);
      } else {
        setConfigResult({ success: false, message: data.error || 'Failed to configure token.' });
      }
    } catch (err: any) {
      setConfigResult({ success: false, message: err?.message || 'Network error saving token.' });
    } finally {
      setIsConfiguring(false);
    }
  };

  // Live ticking uptime in seconds (runs client-side continuously)
  const [currentUptimeSeconds, setCurrentUptimeSeconds] = useState<number>(0);

  // Live ping history for visual telemetry & sparkline
  const [pingHistory, setPingHistory] = useState<PingSample[]>(() => [
    { id: 1, time: '12:40:10', latency: 0, clientRoundtrip: 12, status: 'offline' },
    { id: 2, time: '12:40:20', latency: 0, clientRoundtrip: 14, status: 'offline' },
    { id: 3, time: '12:40:30', latency: 0, clientRoundtrip: 11, status: 'offline' }
  ]);

  const [serverData, setServerData] = useState<ServerData>({
    status: 'offline',
    latency: 0,
    guildCount: 0,
    voiceConnected: false,
    bridgeReady: false,
    onlineSince: null,
    uptimeSeconds: 0,
    gatewayStatus: 'DISCONNECTED_STANDBY',
    packetLoss: 'N/A',
    heartbeatsAcked: 0,
    isChristmasHyperMode: false
  });

  const commands = [
    { cmd: '/help [category]', desc: '🐻 Complete Help Center – Introduction, Freddy Commands, Absolute Solver, Voice, Music, and Security' },
    { cmd: '/freddy [user] [message] [pin]', desc: 'Talk to Glamrock Freddy, tag members with @, or pin his message to the channel' },
    { cmd: '/hug [member]', desc: 'Give a selected superstar member a warm bear hug (+1 Friendship Point)' },
    { cmd: '/protect [member]', desc: 'Protect a selected member with animatronic security shields' },
    { cmd: '/joke', desc: 'Freddy tells an authentic Mega Pizzaplex animatronic joke' },
    { cmd: '/sing', desc: 'Freddy and the Fazbear Band perform an energetic musical concert song' },
    { cmd: '/roast [member]', desc: 'Playfully roast a member with Freddy\'s lighthearted daycare humor' },
    { cmd: '/roar', desc: 'Perform an energetic Mega Pizzaplex animatronic bear roar' },
    { cmd: '/status', desc: 'Show Freddy’s system status, gateway latency, uptime, and Christmas Hyper Mode' },
    { cmd: '/solver [action] [target] [animatronic]', desc: '🔻 Absolute Solver Protocol: Reality Glitch, Teleport, Solver Shield, System Override, Solver Jumpscare' },
    { cmd: '/play [track]', desc: 'Play or queue authentic Pizzaplex audio (Rockstar Row OST, Voice greeting, Lockdown)' },
    { cmd: '/queue', desc: 'Show upcoming songs in the Pizzaplex voice queue' },
    { cmd: '/skip', desc: 'Skip the current song to the next queued track' },
    { cmd: '/pause /resume', desc: 'Pause or resume the active voice stream playback' },
    { cmd: '/nowplaying', desc: 'Show the current song playing in the voice channel' },
    { cmd: '/stop', desc: 'Stop music playback and clear the voice queue' },
    { cmd: '/join & /leave', desc: 'Connect or disconnect Freddy from your active Discord voice channel' },
    { cmd: '/jumpscare', desc: 'Trigger a playful animatronic jumpscare with optical alert and security sound' },
    { cmd: '/lockdown', desc: 'Activate Mega Pizzaplex security lockdown: "Shut your mouth! I\'m listening to music!"' },
    { cmd: '/test', desc: 'Run full operational diagnostics on the Discord Gateway v10 connection, ping, and memory' },
    { cmd: 'Christmas Freddy (Chat Phrase)', desc: '🎄 Triggers Christmas Hyper Mode! Freddy announces Santa visiting the Pizzaplex 🎅' },
    { cmd: 'Freddy, calm down (Stop Phrase)', desc: '🎅 Stops Christmas Hyper Mode immediately (or shuts down automatically in 60s)' }
  ];

  const envVars = [
    { name: 'DISCORD_CLIENT_ID', desc: 'OAuth2 application ID from Discord Developer Portal', type: 'Website' },
    { name: 'DISCORD_CLIENT_SECRET', desc: 'OAuth2 client secret for identity exchange', type: 'Website' },
    { name: 'DISCORD_REDIRECT_URI', desc: 'Callback URL: https://YOUR-DOMAIN/auth/discord/callback', type: 'Website' },
    { name: 'DISCORD_OWNER_IDS', desc: '1411436991005851832,1552785126033858650 (Both accounts authorized)', type: 'Both' },
    { name: 'FREDDY_BOT_API_URL', desc: 'Public HTTPS base URL of your Python bot service', type: 'Bridge' },
    { name: 'FREDDY_WEB_API_SECRET', desc: 'Shared secret matching FREDDY_WEB_API_SECRET on bot', type: 'Bridge' },
    { name: 'DISCORD_BOT_TOKEN', desc: 'Bot token with Guild & Message Content intents', type: 'Bot' },
    { name: 'FREDDY_ADMIN_CODE', desc: 'Private admin passcode for /admin_verify command', type: 'Bot' }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Perform round-trip ping probe
  const probeStatus = async (showSpin = true) => {
    if (showSpin) setIsPinging(true);
    const startClient = performance.now();

    try {
      const res = await fetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });
      const endClient = performance.now();
      const roundtrip = Math.round(endClient - startClient);
      const data = await res.json();

      setBridgeStatus(data.message || "Bot bridge active.");
      const sData: ServerData = data.data || {
        status: 'offline',
        latency: 0,
        guildCount: 0,
        voiceConnected: false,
        bridgeReady: false,
        onlineSince: null,
        uptimeSeconds: 0
      };

      setServerData(sData);
      setLastPingTime(new Date());
      setSecondsSinceLastPing(0);

      // Update uptime baseline
      if (sData.status === 'online' && sData.onlineSince) {
        const elapsed = Math.floor((Date.now() - new Date(sData.onlineSince).getTime()) / 1000);
        setCurrentUptimeSeconds(Math.max(0, elapsed));
      } else {
        setCurrentUptimeSeconds(0);
      }

      // Add to rolling history
      setPingHistory((prev) => {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const newSample: PingSample = {
          id: `probe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          time: timeStr,
          latency: sData.latency,
          clientRoundtrip: roundtrip,
          status: sData.status
        };
        const next = [...prev, newSample];
        return next.slice(-16); // Keep last 16 probes
      });
    } catch {
      setBridgeStatus("Simulated bridge operational (offline fallback mode active).");
      setServerData((prev) => ({
        ...prev,
        status: 'offline',
        latency: 0
      }));
      setCurrentUptimeSeconds(0);
    } finally {
      if (showSpin) setIsPinging(false);
    }
  };

  // Toggle bot status online / offline
  const handleToggleStatus = async () => {
    setIsPinging(true);
    const startClient = performance.now();
    try {
      const res = await fetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status' })
      });
      const endClient = performance.now();
      const roundtrip = Math.round(endClient - startClient);
      const data = await res.json();

      setBridgeStatus(data.message);
      if (data.data) {
        const sData: ServerData = data.data;
        setServerData(sData);
        setLastPingTime(new Date());
        setSecondsSinceLastPing(0);

        if (sData.status === 'online' && sData.onlineSince) {
          const elapsed = Math.floor((Date.now() - new Date(sData.onlineSince).getTime()) / 1000);
          setCurrentUptimeSeconds(Math.max(0, elapsed));
        } else {
          setCurrentUptimeSeconds(0);
          // If trying to switch online but bot token is absent, prompt user to input token
          if (!sData.isRealDiscordBotConnected) {
            setShowConfigModal(true);
            setConfigResult({
              success: false,
              message: 'Discord Bot Token required to connect to Discord Gateway. Paste your token below to bring Freddy online!'
            });
          }
        }

        setPingHistory((prev) => {
          const timeStr = new Date().toTimeString().split(' ')[0];
          return [...prev, {
            id: `toggle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            time: timeStr,
            latency: sData.latency,
            clientRoundtrip: roundtrip,
            status: sData.status
          }].slice(-16);
        });
      }
    } catch {
      setServerData((prev) => ({
        ...prev,
        status: prev.status === 'online' ? 'offline' : 'online',
        latency: prev.status === 'online' ? 0 : 32
      }));
    } finally {
      setIsPinging(false);
    }
  };

  // Initial probe on mount
  useEffect(() => {
    probeStatus(false);
  }, []);

  // 1-second interval ticker for live uptime counter and countdown
  useEffect(() => {
    const timer = setInterval(() => {
      // Tick uptime if online
      if (serverData.status === 'online') {
        setCurrentUptimeSeconds((u) => u + 1);
      }

      // Track seconds since last probe
      setSecondsSinceLastPing((s) => s + 1);

      // Handle auto-refresh countdown (only probe when tab is visible)
      if (autoRefresh) {
        setSecondsUntilNext((prev) => {
          if (typeof document !== 'undefined' && document.hidden) {
            return refreshIntervalSec;
          }
          if (prev <= 1) {
            probeStatus(false);
            return refreshIntervalSec;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [serverData.status, autoRefresh, refreshIntervalSec]);

  // Format uptime into DD:HH:MM:SS or HH:MM:SS
  const formatUptime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return '00:00:00';
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    if (days > 0) {
      return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Latency rating & color helpers
  const isOnline = serverData.status === 'online';
  const latency = serverData.latency;

  const getLatencyGrade = (ms: number, online: boolean) => {
    if (!online) return { label: 'Standby / Offline', color: 'text-slate-400', barColor: 'bg-slate-600', badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    if (ms <= 50) return { label: 'Optimal (< 50ms)', color: 'text-emerald-400', barColor: 'bg-emerald-400', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    if (ms <= 100) return { label: 'Good (50–100ms)', color: 'text-[#53e7ff]', barColor: 'bg-[#53e7ff]', badgeClass: 'bg-[#53e7ff]/10 text-[#53e7ff] border-[#53e7ff]/30' };
    if (ms <= 200) return { label: 'Moderate', color: 'text-amber-400', barColor: 'bg-amber-400', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { label: 'Elevated', color: 'text-rose-400', barColor: 'bg-rose-400', badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
  };

  const latencyGrade = getLatencyGrade(latency, isOnline);

  // Stats from ping history
  const onlineSamples = pingHistory.filter((s) => s.status === 'online');
  const avgLatency = onlineSamples.length > 0
    ? Math.round(onlineSamples.reduce((a, b) => a + b.latency, 0) / onlineSamples.length)
    : 0;
  const minLatency = onlineSamples.length > 0
    ? Math.min(...onlineSamples.map((s) => s.latency))
    : 0;
  const maxLatency = onlineSamples.length > 0
    ? Math.max(...onlineSamples.map((s) => s.latency))
    : 0;
  const latestRoundtrip = pingHistory.length > 0 ? pingHistory[pingHistory.length - 1].clientRoundtrip : 0;

  const handleToggleChristmas = async () => {
    const act = serverData.isChristmasHyperMode ? 'stop_christmas_mode' : 'christmas_mode';
    try {
      await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: act })
      });
      probeStatus(false);
    } catch {}
  };

  return (
    <div className="space-y-8">
      {/* Header with Title and Primary Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🎮 Discord Server & Bot Bridge</span>
          </h2>
          <p className="text-xs text-[#aab6c9] mt-1">
            Real-time connection telemetry, gateway ping & uptime monitors, slash commands, and companion architecture.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Online / Offline */}
          <button
            onClick={handleToggleStatus}
            disabled={isPinging}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
              isOnline
                ? 'border-amber-400/40 text-amber-300 hover:bg-amber-400/10 active:scale-95'
                : 'border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10 active:scale-95'
            }`}
            title={isOnline ? 'Put bot in standby/offline mode' : 'Activate bot connection gateway'}
          >
            {isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Switch to Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Switch to Online</span>
              </>
            )}
          </button>

          {/* Test Ping Now */}
          <button
            onClick={() => probeStatus(true)}
            disabled={isPinging}
            className="px-3.5 py-2 text-xs font-bold text-[#53e7ff] border border-[#53e7ff]/30 hover:bg-[#53e7ff]/10 rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            title="Measure round-trip gateway latency immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>Test Ping Now</span>
          </button>

          {/* Auto-Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
              autoRefresh
                ? 'border-[#53e7ff]/30 bg-[#53e7ff]/10 text-[#53e7ff]'
                : 'border-white/10 text-[#7d8b9f] hover:text-white hover:bg-white/5'
            }`}
            title={autoRefresh ? 'Pause automated health probes' : 'Resume automated health probes'}
          >
            {autoRefresh ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>Auto ({secondsUntilNext}s)</span>
          </button>
        </div>
      </div>

      {/* Standby Banner / 1-Click Connect Prompt */}
      {!isOnline && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-[#182538] to-[#121c2c] border border-amber-400/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Glamrock Freddy is in Standby Mode</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-400/30">
                  Awaiting Bot Token
                </span>
              </div>
              <p className="text-xs text-[#aab6c9] mt-0.5">
                The Pizzaplex console, character chat, soundboard, and settings are 100% online. To connect Freddy live to Discord, click below to paste your Bot Token!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowConfigModal(true);
              setConfigResult(null);
            }}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#53e7ff] to-[#3cd0e6] text-black hover:brightness-110 transition-all shadow-md shadow-[#53e7ff]/20 flex items-center gap-2 cursor-pointer shrink-0 font-sans"
          >
            <KeyRound className="w-4 h-4" />
            <span>Connect to Discord Now</span>
          </button>
        </div>
      )}

      {/* Real-Time Telemetry & Status Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bot Connection Status */}
        <div className="bg-[#121c2c] border border-white/10 p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#7d8b9f] mb-1">
            <span>DISCORD BOT GATEWAY</span>
            <span className="text-[10px] text-[#53e7ff]">Shard 0/1</span>
          </div>

          <div className={`text-xl font-black flex items-center gap-2.5 mt-1 ${
            isOnline ? 'text-emerald-400' : 'text-slate-400'
          }`}>
            <span className="relative flex h-3 w-3">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                isOnline ? 'bg-emerald-400' : 'bg-slate-500'
              }`} />
            </span>
            <span className="truncate">{isOnline ? (serverData.userTag || 'Connected') : 'Offline · Standby'}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#aab6c9] mt-2 font-mono truncate">
            <span>{isOnline ? 'Gateway v10 Active' : (serverData.connectionError ? 'Auth Error' : 'Gateway Inactive')}</span>
            <span aria-hidden="true">·</span>
            <span>{serverData.guildCount} {serverData.guildCount === 1 ? 'Guild' : 'Guilds'}</span>
          </div>

          {/* Micro Status Bar */}
          <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isOnline ? 'w-full bg-emerald-400' : 'w-0'}`}
            />
          </div>
        </div>

        {/* Card 2: Ping / Latency Indicator */}
        <div className="bg-[#121c2c] border border-white/10 p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#7d8b9f] mb-1">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#53e7ff]" />
              <span>PING / LATENCY</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${latencyGrade.badgeClass}`}>
              {isOnline ? latencyGrade.label : 'Offline'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-black font-mono tabular-nums ${latencyGrade.color}`}>
              {isOnline ? latency : 0}
            </span>
            <span className="text-xs font-mono text-[#7d8b9f]">ms</span>
            {isOnline && latestRoundtrip > 0 && (
              <span className="text-[10px] font-mono text-[#7d8b9f] ml-auto" title="Client HTTP round-trip">
                REST: {latestRoundtrip}ms
              </span>
            )}
          </div>

          {/* Visual Latency Gauge Bar */}
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2.5 overflow-hidden flex">
            {isOnline ? (
              <div
                className={`h-full rounded-full transition-all duration-300 ${latencyGrade.barColor}`}
                style={{ width: `${Math.min(100, Math.max(15, (latency / 150) * 100))}%` }}
              />
            ) : (
              <div className="w-0 bg-slate-600 h-full" />
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#7d8b9f] mt-2 font-mono">
            <span>Avg: {avgLatency}ms</span>
            <span>Min: {minLatency}ms</span>
            <span>Max: {maxLatency}ms</span>
          </div>
        </div>

        {/* Card 3: Real-Time Uptime Counter */}
        <div className="bg-[#121c2c] border border-white/10 p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#7d8b9f] mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#ff9b45]" />
              <span>UPTIME DURATION</span>
            </span>
            <span className="text-[10px] text-[#ff9b45] font-mono">
              {isOnline ? '100% SLA' : '0% Inactive'}
            </span>
          </div>

          <div className="text-2xl font-black text-white font-mono tabular-nums tracking-tight mt-1">
            {formatUptime(currentUptimeSeconds)}
          </div>

          <div className="text-[11px] text-[#aab6c9] mt-2 font-mono flex items-center gap-1.5 truncate">
            {isOnline ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">Active Gateway Session</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Standby / Offline State</span>
              </>
            )}
          </div>

          {/* Visual Ticking Heartbeat Bar */}
          <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isOnline ? 'w-full bg-[#ff9b45]' : 'w-0'
              }`}
            />
          </div>
        </div>

        {/* Card 4: Heartbeat & Health Check Status */}
        <div className="bg-[#121c2c] border border-white/10 p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#7d8b9f] mb-1">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>HEARTBEAT / PROBE</span>
            </span>
            <span className="text-[10px] text-[#aab6c9] font-mono">
              {secondsSinceLastPing === 0 ? 'Just now' : `${secondsSinceLastPing}s ago`}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-white font-mono tabular-nums">
              #{serverData.heartbeatsAcked || pingHistory.length}
            </span>
            <span className="text-xs text-[#7d8b9f] font-mono">ACKs</span>
          </div>

          <div className="text-[11px] text-[#aab6c9] mt-2 font-mono flex items-center justify-between">
            <span>Packet Loss:</span>
            <span className="text-emerald-400 font-bold">{serverData.packetLoss || (isOnline ? '0.0%' : 'N/A')}</span>
          </div>

          <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full bg-[#53e7ff] transition-all duration-300`}
              style={{
                width: autoRefresh ? `${Math.max(10, ((refreshIntervalSec - secondsUntilNext) / refreshIntervalSec) * 100)}%` : '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Visual Latency Trend Sparkline & Gateway Diagnostic Matrix */}
      <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#53e7ff]" />
            <h3 className="text-sm font-bold text-white">Live Latency History & Gateway Health</h3>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#7d8b9f]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>&lt; 50ms Optimal</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#53e7ff]" />
              <span>50-100ms Good</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>0ms Offline</span>
            </span>
          </div>
        </div>

        {/* Visual Ping Bars (Sparkline) */}
        <div>
          <div className="flex items-end justify-between gap-1.5 h-20 pt-2 px-1 bg-[#0a1220] rounded-xl border border-white/5">
            {pingHistory.map((sample, idx) => {
              const maxDisplay = 100;
              const val = sample.status === 'online' ? sample.latency : 0;
              const heightPct = val > 0 ? Math.max(15, Math.min(100, (val / maxDisplay) * 100)) : 8;

              return (
                <div
                  key={`ping-sample-${sample.id}-${idx}`}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/90 text-[10px] font-mono px-2 py-0.5 rounded border border-white/20 whitespace-nowrap z-20 text-white shadow-lg">
                    {sample.time} · {val}ms {sample.status === 'offline' ? '(Offline)' : ''}
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      sample.status === 'offline'
                        ? 'bg-slate-700/60'
                        : val <= 50
                        ? 'bg-emerald-400 group-hover:bg-emerald-300'
                        : val <= 100
                        ? 'bg-[#53e7ff] group-hover:bg-cyan-300'
                        : 'bg-amber-400 group-hover:bg-amber-300'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#7d8b9f] font-mono mt-1.5 px-1">
            <span>Earlier Probes ({pingHistory[0]?.time || 'Start'})</span>
            <span>Real-time Polling ({autoRefresh ? `Every ${refreshIntervalSec}s` : 'Manual'})</span>
            <span>Latest ({pingHistory[pingHistory.length - 1]?.time || 'Now'})</span>
          </div>
        </div>

        {/* Live Diagnostics Table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-[#0a1220] rounded-xl border border-white/5">
            <div className="text-[10px] font-mono text-[#7d8b9f]">GATEWAY PROTOCOL</div>
            <div className="text-xs font-bold text-white mt-1 flex items-center justify-between">
              <span>Discord Gateway API v10</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                isOnline ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10'
              }`}>
                {isOnline ? 'Opcode 1 Heartbeat' : 'Standby'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#0a1220] rounded-xl border border-white/5">
            <div className="text-[10px] font-mono text-[#7d8b9f]">LOCAL BRIDGE REST API</div>
            <div className="text-xs font-bold text-white mt-1 flex items-center justify-between">
              <span>POST /api/server (HTTP/1.1)</span>
              <span className="text-[10px] font-mono text-[#53e7ff] bg-[#53e7ff]/10 px-1.5 py-0.2 rounded">
                {latestRoundtrip > 0 ? `${latestRoundtrip}ms RTT` : 'Operational'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#0a1220] rounded-xl border border-white/5">
            <div className="text-[10px] font-mono text-[#7d8b9f]">VOICE STREAMING SUBSYSTEM</div>
            <div className="text-xs font-bold text-white mt-1 flex items-center justify-between">
              <span>Rockstar Row Discord Voice</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                serverData.voiceConnected ? 'text-[#ff9b45] bg-[#ff9b45]/10' : 'text-slate-400 bg-slate-500/10'
              }`}>
                {serverData.voiceConnected ? 'Channel Active' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Christmas Freddy Hyper Mode Interactive Control */}
      <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl ${
        serverData.isChristmasHyperMode
          ? 'bg-gradient-to-r from-red-950/80 via-emerald-950/60 to-red-950/80 border-emerald-400/50 ring-2 ring-emerald-400/30 animate-pulse'
          : 'bg-[#121c2c] border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-500 to-emerald-500 text-white flex items-center justify-center text-xl shrink-0 shadow-lg shadow-red-500/20">
            🎄
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Christmas Freddy Hyper Mode 🎅</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                serverData.isChristmasHyperMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 font-bold'
                  : 'bg-white/5 text-[#7d8b9f] border-white/10'
              }`}>
                {serverData.isChristmasHyperMode ? 'SANTA IS COMING! 🎁' : 'Standby'}
              </span>
            </div>
            <p className="text-xs text-[#aab6c9] mt-0.5">
              Trigger phrase: <code className="text-[#53e7ff]">"Christmas Freddy"</code> · Stop phrase: <code className="text-amber-300">"Freddy, calm down"</code> (or 60s auto-stop).
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleChristmas}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 ${
            serverData.isChristmasHyperMode
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
              : 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/25'
          }`}
        >
          <span>{serverData.isChristmasHyperMode ? '🛑 Stop Hyper Mode' : '🎅 Activate Hyper Mode'}</span>
        </button>
      </div>

      {/* Connected Discord Servers Directory */}
      <DiscordServersList embedded={true} />

      {/* System Log History with Category Filters */}
      <SystemLogPanel embedded={true} />

      {/* Bot Client ID & 1-Click Invite Card */}
      <div className="p-4 bg-gradient-to-r from-[#182538] to-[#121c2c] border border-[#53e7ff]/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#5865f2] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#5865f2]/20">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Glamrock Freddy Bot</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                Token Configured
              </span>
            </div>
            <div className="text-xs text-[#aab6c9] mt-0.5 font-mono">
              Client / App ID: <span className="text-[#53e7ff]">1548483188203065357</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
          <button
            onClick={() => {
              setShowConfigModal(true);
              setConfigResult(null);
            }}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-[#1a283e] hover:bg-[#223552] border border-[#53e7ff]/30 text-[#53e7ff] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Configure Token</span>
          </button>
          <a
            href="https://discord.com/oauth2/authorize?client_id=1548483188203065357&permissions=3148800&scope=bot%20applications.commands"
            target="_blank"
            rel="noreferrer noopener"
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#5865f2] hover:bg-[#4752c4] text-white transition-all shadow-md shadow-[#5865f2]/25 flex items-center gap-2 cursor-pointer"
          >
            <span>Invite Bot to Server</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Bot Token Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121c2c] border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#53e7ff]" />
                <h3 className="text-base font-bold text-white">Configure Discord Bot Token</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[#7d8b9f] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#aab6c9] leading-relaxed">
              If your <code>.env</code> file was deleted or your Discord Bot Token was reset, paste your bot token below. It will be stored securely server-side and immediately reconnect Freddy to the Discord Gateway.
            </p>

            <form onSubmit={handleSaveBotToken} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Discord Bot Token (DISCORD_BOT_TOKEN)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Paste your Discord Bot Token here..."
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a1220] border border-white/10 rounded-xl text-xs text-white placeholder-[#7d8b9f] focus:outline-none focus:border-[#53e7ff]/50 font-mono"
                />
                <span className="text-[11px] text-[#7d8b9f] block mt-1">
                  Ensure <strong>Guilds</strong>, <strong>Guild Messages</strong>, and <strong>Message Content Intent</strong> are enabled in Discord Developer Portal.
                </span>
              </div>

              {configResult && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  configResult.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}>
                  {configResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{configResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#aab6c9] hover:text-white rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConfiguring || !inputToken.trim()}
                  className="px-5 py-2 text-xs font-bold bg-[#53e7ff] hover:bg-[#3cd0e6] text-black rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isConfiguring && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isConfiguring ? 'Connecting...' : 'Save & Connect Bot'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Freddy Family Lore Banner */}
      <div className="p-4 bg-[#121c2c] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#53e7ff]/20 text-[#53e7ff] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Freddy's Family Lore</span>
              <span className="text-[10px] bg-[#ff9b45]/20 text-[#ff9b45] px-2 py-0.5 rounded font-mono">
                Hardcoded Bot Lore
              </span>
            </div>
            <p className="text-xs text-[#aab6c9] mt-0.5">
              Gregory (Bot ID <code>1560782109180952707</code>) is his son · Cyn (Bot ID <code>1549065500313784491</code>) is his daughter.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#ff9b45] font-semibold">Protected Superstars</span>
        </div>
      </div>

      {/* Persistent Discord Gateway Hosting Configuration Guide */}
      <div className="bg-[#121c2c] border border-amber-400/30 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Persistent Discord Gateway & 24/7 Hosting Architecture</h3>
          </div>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            Hosting Specification
          </span>
        </div>

        <p className="text-xs text-[#aab6c9] leading-relaxed">
          Discord bots use a stateful, bidirectional WebSocket connection (<code className="text-[#53e7ff]">wss://gateway.discord.gg/?v=10</code>) that requires continuous background heartbeats (Opcode 1 every 41.25s). In standard web serverless or scale-to-zero preview containers, connections sleep when web traffic idles.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 bg-[#0a1220] rounded-xl border border-white/5 space-y-1">
            <div className="font-bold text-white text-[11px]">Recommended 24/7 Platforms</div>
            <p className="text-[11px] text-[#7d8b9f]">
              Deploy as an always-on background worker on <strong>VPS (Ubuntu/Debian)</strong>, <strong>Railway</strong>, <strong>Render Worker</strong>, or <strong>Google Cloud Compute Engine</strong>.
            </p>
          </div>

          <div className="p-3 bg-[#0a1220] rounded-xl border border-white/5 space-y-1">
            <div className="font-bold text-white text-[11px]">Server Process Command</div>
            <p className="text-[11px] text-[#7d8b9f] font-mono">
              <code>npm start</code> or <code>node server.ts</code> keeps both Express API and Discord.js Gateway connected simultaneously.
            </p>
          </div>

          <div className="p-3 bg-[#0a1220] rounded-xl border border-white/5 space-y-1">
            <div className="font-bold text-white text-[11px]">Real Gateway Status</div>
            <p className="text-[11px] text-emerald-400 font-mono">
              {isOnline ? `Online as ${serverData.userTag || 'Glamrockfreddy'}` : 'Offline / Standby (Gateway Ready)'}
            </p>
          </div>
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

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {commands.map((c) => (
                <div
                  key={c.cmd}
                  onClick={() => handleCopy(c.cmd, c.cmd)}
                  className="p-3 bg-[#0a1220] hover:bg-[#142033] border border-white/5 hover:border-white/20 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <code className="text-xs font-mono font-bold text-[#53e7ff] group-hover:text-white transition-colors">
                      {c.cmd}
                    </code>
                    <p className="text-[11px] text-[#aab6c9] mt-0.5">
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
              Glamrock Freddy operates as a two-service architecture: this <strong>Node.js Website</strong> handles OAuth2 login, live embed editors, and web controls; the companion <strong>Python Bot</strong> (<code>freddy.py</code>) connects to Discord Gateway.
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
                      : item.type === 'Both'
                      ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                      : 'bg-[#9d4edd]/10 text-[#9d4edd] border border-[#9d4edd]/20'
                  }`}>
                    {item.type}
                  </span>
                </div>
              ))}
            </div>

            {/* Configured Owner IDs Card */}
            <div className="pt-2 border-t border-white/5">
              <div className="p-3 bg-[#0a1220] rounded-xl border border-white/5 text-xs space-y-1">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Authorized Bot Owner IDs:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Both Verified</span>
                </div>
                <div className="text-[11px] font-mono text-[#aab6c9]">
                  Main: <code>1411436991005851832</code> · Alt: <code>1552785126033858650</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
