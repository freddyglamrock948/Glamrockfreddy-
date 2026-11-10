import React, { useState, useEffect } from 'react';
import {
  Server,
  Users,
  Radio,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Volume2,
  Shield,
  Clock,
  Sparkles,
  Wifi,
  WifiOff,
  Hash
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

export interface DiscordGuild {
  id: string;
  name: string;
  memberCount: number;
  icon?: string | null;
  ownerId?: string;
  joinedAt?: string | null;
  voiceConnected?: boolean;
  channelsCount?: number;
  rolesCount?: number;
}

interface DiscordServersListProps {
  embedded?: boolean;
}

export const DiscordServersList: React.FC<DiscordServersListProps> = ({ embedded = false }) => {
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [botTag, setBotTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchServers = async (showSpin = true) => {
    if (showSpin) setIsLoading(true);
    try {
      const res = await fetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });
      const json = await res.json();
      if (json && json.data) {
        setGuilds(json.data.guilds || []);
        setIsOnline(json.data.status === 'online');
        setBotTag(json.data.userTag || null);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch Discord servers', err);
    } finally {
      if (showSpin) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers(true);
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchServers(false);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundEngine.playActionSound('default');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVoicePlay = async (guildId: string) => {
    soundEngine.playActionSound('default');
    setActionMessage(`Streaming Rockstar Row into guild voice...`);
    try {
      const res = await fetch('/api/discord/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'voice_play', params: { guildId, track: 'rockstar_row' } })
      });
      const data = await res.json();
      setActionMessage(data.message || 'Track dispatched.');
      fetchServers(false);
    } catch (e: any) {
      setActionMessage(`Voice error: ${e.message}`);
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleVoiceLeave = async (guildId: string) => {
    soundEngine.playActionSound('default');
    setActionMessage(`Disconnecting Freddy from voice...`);
    try {
      const res = await fetch('/api/discord/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'voice_leave', params: { guildId } })
      });
      const data = await res.json();
      setActionMessage(data.message || 'Freddy left voice.');
      fetchServers(false);
    } catch (e: any) {
      setActionMessage(`Voice error: ${e.message}`);
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Filter guilds
  const filteredGuilds = guilds.filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return g.name.toLowerCase().includes(q) || g.id.includes(q);
  });

  const totalMembers = guilds.reduce((sum, g) => sum + (g.memberCount || 0), 0);

  return (
    <div className={`space-y-6 ${embedded ? '' : 'p-6 bg-[#121c2c] border border-white/10 rounded-2xl shadow-2xl'}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5865f2] to-[#53e7ff] text-white flex items-center justify-center shadow-md shadow-[#5865f2]/20 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>Discord Servers Directory</span>
                <span className="text-xs bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/40 font-mono px-2.5 py-0.5 rounded-full">
                  {guilds.length} {guilds.length === 1 ? 'Server' : 'Servers'}
                </span>
              </h2>
              <p className="text-xs text-[#aab6c9] mt-0.5">
                Every Discord community and server where Glamrock Freddy is installed and active.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh button */}
          <button
            onClick={() => fetchServers(true)}
            disabled={isLoading}
            className="px-3 py-2 text-xs font-bold text-[#53e7ff] border border-[#53e7ff]/30 hover:bg-[#53e7ff]/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Discord server list from Gateway"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* 1-Click Invite */}
          <a
            href="https://discord.com/oauth2/authorize?client_id=1548483188203065357&permissions=3148800&scope=bot%20applications.commands"
            target="_blank"
            rel="noreferrer noopener"
            className="px-3.5 py-2 text-xs font-bold bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#5865f2]/25 cursor-pointer shrink-0"
          >
            <span>Invite Freddy to Server</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="bg-[#182538] border border-[#53e7ff]/40 text-xs text-[#53e7ff] px-4 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#ff9b45] shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Servers */}
        <div className="bg-[#0a1220] border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-[#7d8b9f]">TOTAL SERVERS (GUILDS)</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {guilds.length}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>{isOnline ? 'Active on Gateway v10' : 'Standby / Offline'}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#5865f2]/10 text-[#5865f2] flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
        </div>

        {/* Total Superstars / Members */}
        <div className="bg-[#0a1220] border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-[#7d8b9f]">TOTAL SUPERSTARS REACHED</div>
            <div className="text-2xl font-black text-[#ff9b45] mt-1 font-mono">
              {totalMembers.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#aab6c9] mt-1">
              Across all configured servers
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ff9b45]/10 text-[#ff9b45] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Bot Profile */}
        <div className="bg-[#0a1220] border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-[#7d8b9f]">CONNECTED BOT IDENTITY</div>
            <div className="text-sm font-bold text-white mt-1 truncate max-w-[150px]">
              {botTag || 'Glamrockfreddy#8234'}
            </div>
            <div className="text-[10px] text-[#53e7ff] font-mono mt-1">
              App ID: 1548483188203065357
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#53e7ff]/10 text-[#53e7ff] flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#7d8b9f] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by server name or server ID..."
          className="w-full bg-[#0a1220] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#53e7ff] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7d8b9f] hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Servers Grid / List */}
      {filteredGuilds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGuilds.map((guild, idx) => {
            const initials = guild.name
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() || '')
              .join('');

            return (
              <div
                key={`guild-${guild.id || idx}-${idx}`}
                className="bg-[#0a1220] border border-white/10 hover:border-[#53e7ff]/40 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Icon, Name & Status */}
                  <div className="flex items-start gap-3.5">
                    {guild.icon ? (
                      <img
                        src={guild.icon}
                        alt={guild.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/10 shrink-0 shadow-md group-hover:ring-2 ring-[#53e7ff]/40 transition-all"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff9b45] to-[#53e7ff] text-black font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                        {initials || 'GF'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white truncate" title={guild.name}>
                          {guild.name}
                        </h3>
                      </div>

                      {/* Member Count Pill */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#ff9b45] bg-[#ff9b45]/10 px-2 py-0.5 rounded-full border border-[#ff9b45]/20">
                          <Users className="w-3 h-3" />
                          <span>{guild.memberCount?.toLocaleString() || 1} Members</span>
                        </span>

                        {guild.voiceConnected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Voice Active</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#7d8b9f]">
                            Voice Standby
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Server Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-[11px] font-mono">
                    <div className="bg-[#121c2c] p-2 rounded-lg border border-white/5">
                      <div className="text-[10px] text-[#7d8b9f]">SERVER ID</div>
                      <div className="flex items-center justify-between text-white mt-0.5">
                        <span className="truncate max-w-[120px]">{guild.id}</span>
                        <button
                          onClick={() => handleCopy(guild.id, `guild-${guild.id}`)}
                          className="text-[#7d8b9f] hover:text-[#53e7ff] p-0.5 transition-colors cursor-pointer"
                          title="Copy Server ID"
                        >
                          {copiedId === `guild-${guild.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#121c2c] p-2 rounded-lg border border-white/5">
                      <div className="text-[10px] text-[#7d8b9f]">GATEWAY STATUS</div>
                      <div className="text-emerald-400 mt-0.5 font-bold truncate">
                        🟢 Active (Shard 0)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Controls */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-[#7d8b9f] font-mono">
                    Commands: <span className="text-white">/freddy, /play, /leave</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {guild.voiceConnected ? (
                      <button
                        onClick={() => handleVoiceLeave(guild.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Disconnect Freddy from voice in this server"
                      >
                        <Volume2 className="w-3 h-3 text-rose-400" />
                        <span>Disconnect</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVoicePlay(guild.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#53e7ff] bg-[#53e7ff]/10 hover:bg-[#53e7ff]/20 border border-[#53e7ff]/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Play Rockstar Row OST in server voice channel"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Play Voice</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 text-center bg-[#0a1220] border border-white/10 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center mx-auto">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            {searchQuery ? 'No matching servers found' : 'No Discord Servers Connected Yet'}
          </h3>
          <p className="text-xs text-[#aab6c9] max-w-md mx-auto">
            {searchQuery
              ? `No server names or IDs matched "${searchQuery}". Clear your search query to see all servers.`
              : 'Glamrock Freddy is ready to connect! Invite him to your Discord server to start streaming music, handling welcome messages, and chatting with Superstars.'}
          </p>
          <div className="pt-2">
            <a
              href="https://discord.com/oauth2/authorize?client_id=1548483188203065357&permissions=3148800&scope=bot%20applications.commands"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-xl transition-all shadow-md shadow-[#5865f2]/25 cursor-pointer"
            >
              <span>Add Freddy to Discord</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Footer Info Notice */}
      <div className="text-[11px] text-[#7d8b9f] flex items-center justify-between pt-1">
        <span>
          Auto-synchronized with Discord Gateway v10 · {lastRefreshed ? `Updated at ${lastRefreshed.toLocaleTimeString()}` : 'Live'}
        </span>
        <span>
          Bot App ID: <code className="text-[#53e7ff]">1548483188203065357</code>
        </span>
      </div>
    </div>
  );
};
