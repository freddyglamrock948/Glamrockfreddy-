import React, { useState, useEffect, useMemo } from 'react';
import {
  Terminal,
  Filter,
  Search,
  RefreshCw,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Music,
  Wifi,
  UserPlus,
  Flame,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  PlusCircle
} from 'lucide-react';

export interface LogItem {
  id: string;
  timestamp: string;
  category: 'welcome' | 'music' | 'connection' | 'solver' | 'chat' | 'system';
  level: 'info' | 'success' | 'warn' | 'error';
  title: string;
  message: string;
  source: 'bot_gateway' | 'web_bridge' | 'voice_subsystem' | 'user_action';
  details?: Record<string, any>;
}

export type CategoryFilter = 'all' | 'welcome' | 'music' | 'connection' | 'solver' | 'chat';
export type LevelFilter = 'all' | 'info' | 'success' | 'warn' | 'error';

interface SystemLogPanelProps {
  embedded?: boolean;
}

export const SystemLogPanel: React.FC<SystemLogPanelProps> = ({ embedded = false }) => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    all: 0,
    welcome: 0,
    music: 0,
    connection: 0,
    solver: 0,
    chat: 0
  });
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Fetch logs from backend
  const fetchLogs = async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const res = await fetch('/api/logs?limit=150');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch system logs:', err);
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, []);

  // Auto-refresh interval (every 8 seconds when tab is active)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchLogs(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Clear logs
  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        setCounts({ all: 0, welcome: 0, music: 0, connection: 0, solver: 0, chat: 0 });
        setBannerNotice('System log history cleared.');
        setTimeout(() => setBannerNotice(null), 3000);
      }
    } catch {
      setBannerNotice('Could not clear logs.');
    }
  };

  // Reset default logs
  const handleResetLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/logs/reset', { method: 'POST' });
      if (res.ok) {
        await fetchLogs(false);
        setBannerNotice('Default seed logs restored successfully.');
        setTimeout(() => setBannerNotice(null), 3000);
      }
    } catch {
      setBannerNotice('Could not reset logs.');
    } finally {
      setIsLoading(false);
    }
  };

  // Inject a simulated test event for testing categories
  const handleSimulateTestLog = async (cat: 'welcome' | 'music' | 'connection') => {
    let title = '';
    let message = '';
    let level: 'info' | 'success' | 'warn' | 'error' = 'info';
    let details: Record<string, any> = {};

    if (cat === 'welcome') {
      title = 'Member Joined: @SuperstarGregory';
      message = 'Dispatched welcome card to #welcome (Guild: 948123456789012345) with custom embed.';
      level = 'success';
      details = { user: 'SuperstarGregory', channel: 'welcome', joinTimestamp: new Date().toISOString() };
    } else if (cat === 'music') {
      title = 'Playback: 04 Rockstar Row Streamed';
      message = 'Discord Voice: Track queued in channel "Rockstar Row Stage" @ 320kbps.';
      level = 'info';
      details = { track: '04 Rockstar Row.mp3', bitrate: '320kbps', volume: 85 };
    } else {
      title = 'Gateway Heartbeat Check';
      message = 'Discord Gateway v10 Heartbeat latency probe acknowledged (Ping: 34ms).';
      level = 'info';
      details = { ping: 34, opcode: 1, shard: 0 };
    }

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cat,
          level,
          title,
          message,
          source: 'user_action',
          details
        })
      });
      if (res.ok) {
        await fetchLogs(false);
        setBannerNotice(`Test ${cat.toUpperCase()} event logged successfully.`);
        setTimeout(() => setBannerNotice(null), 3000);
      }
    } catch (err) {
      console.warn('Simulation failed:', err);
    }
  };

  // Export logs to JSON file
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freddy-system-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }
      // Level filter
      if (selectedLevel !== 'all' && log.level !== selectedLevel) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = log.title.toLowerCase().includes(q);
        const matchesMsg = log.message.toLowerCase().includes(q);
        const matchesCategory = log.category.toLowerCase().includes(q);
        const matchesSource = log.source && log.source.toLowerCase().includes(q);
        return matchesTitle || matchesMsg || matchesCategory || matchesSource;
      }
      return true;
    });
  }, [logs, selectedCategory, selectedLevel, searchQuery]);

  // Format relative timestamp
  const formatRelativeTime = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 5) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      return `${diffHr}h ago`;
    } catch {
      return '';
    }
  };

  const formatAbsoluteTime = (iso: string) => {
    try {
      return new Date(iso).toTimeString().split(' ')[0];
    } catch {
      return iso;
    }
  };

  // Category visual styles & icons
  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'welcome':
        return {
          label: 'Welcome Events',
          icon: <UserPlus className="w-3.5 h-3.5" />,
          colorClass: 'text-[#53e7ff] bg-[#53e7ff]/10 border-[#53e7ff]/20'
        };
      case 'music':
        return {
          label: 'Music',
          icon: <Music className="w-3.5 h-3.5" />,
          colorClass: 'text-[#ff9b45] bg-[#ff9b45]/10 border-[#ff9b45]/20'
        };
      case 'connection':
        return {
          label: 'Connection Issues',
          icon: <Wifi className="w-3.5 h-3.5" />,
          colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        };
      case 'solver':
        return {
          label: 'Solver & Security',
          icon: <Flame className="w-3.5 h-3.5" />,
          colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
        };
      case 'chat':
        return {
          label: 'Freddy Chat',
          icon: <MessageSquare className="w-3.5 h-3.5" />,
          colorClass: 'text-amber-300 bg-amber-400/10 border-amber-400/20'
        };
      default:
        return {
          label: 'System',
          icon: <Terminal className="w-3.5 h-3.5" />,
          colorClass: 'text-slate-300 bg-slate-500/10 border-slate-500/20'
        };
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>OK</span>
          </span>
        );
      case 'warn':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            <span>WARN</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400">
            <AlertCircle className="w-3 h-3" />
            <span>ERR</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#53e7ff]">
            <Info className="w-3 h-3" />
            <span>INFO</span>
          </span>
        );
    }
  };

  const categories: { key: CategoryFilter; label: string; countKey: string }[] = [
    { key: 'all', label: 'All Events', countKey: 'all' },
    { key: 'welcome', label: 'Welcome Events', countKey: 'welcome' },
    { key: 'music', label: 'Music', countKey: 'music' },
    { key: 'connection', label: 'Connection Issues', countKey: 'connection' },
    { key: 'solver', label: 'Solver & Security', countKey: 'solver' },
    { key: 'chat', label: 'Chat & Roleplay', countKey: 'chat' }
  ];

  return (
    <div className={`space-y-6 ${embedded ? '' : 'max-w-6xl mx-auto'}`}>
      {/* Header */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Terminal className="w-6 h-6 text-[#ff9b45]" />
              <span>System Log & Bridge Audit Console</span>
            </h2>
            <p className="text-xs text-[#aab6c9] mt-1">
              Transparent, real-time log history of Discord bot activities, welcome events, music playback changes, and connection health.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchLogs(true)}
              disabled={isLoading}
              className="px-3.5 py-2 text-xs font-bold text-[#53e7ff] border border-[#53e7ff]/30 hover:bg-[#53e7ff]/10 rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                autoRefresh
                  ? 'border-[#53e7ff]/30 bg-[#53e7ff]/10 text-[#53e7ff]'
                  : 'border-white/10 text-[#7d8b9f] hover:text-white hover:bg-white/5'
              }`}
            >
              {autoRefresh ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{autoRefresh ? 'Live Streaming' : 'Paused'}</span>
            </button>

            <button
              onClick={handleExportJson}
              disabled={logs.length === 0}
              className="px-3 py-2 text-xs font-semibold text-white/80 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Download raw logs as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={handleClearLogs}
              disabled={logs.length === 0}
              className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              onClick={handleResetLogs}
              className="px-3 py-2 text-xs font-semibold text-amber-300 hover:text-amber-200 border border-amber-400/20 hover:bg-amber-400/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Restore initial event logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Logs</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner Notice */}
      {bannerNotice && (
        <div className="p-3 bg-[#121c2c] border border-[#53e7ff]/30 rounded-xl text-xs text-[#53e7ff] flex items-center justify-between">
          <span>{bannerNotice}</span>
          <button onClick={() => setBannerNotice(null)} className="text-[#7d8b9f] hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Category Filter Bar (Segmented Controls) */}
      <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-3.5 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs text-[#aab6c9] font-medium pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#ff9b45]" />
            <span className="font-bold text-white text-xs uppercase tracking-wide">Filter by Category</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#7d8b9f]">
            <span>Showing {filteredLogs.length} of {logs.length} events</span>
          </div>
        </div>

        {/* Category Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((c) => {
            const count = counts[c.countKey] || 0;
            const isSelected = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#ff9b45] to-[#ffaa40] text-black shadow-md shadow-[#ff9b45]/20'
                    : 'bg-[#0a1220] hover:bg-[#142033] text-[#aab6c9] hover:text-white border border-white/5'
                }`}
              >
                <span>{c.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-black/20 text-black' : 'bg-white/5 text-[#7d8b9f]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Row: Search & Severity Level & Test Trigger Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#7d8b9f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs by keyword, channel ID, user, or action..."
              className="w-full pl-9 pr-3 py-2 bg-[#0a1220] border border-white/10 rounded-xl text-xs text-white placeholder-[#7d8b9f] focus:outline-none focus:border-[#53e7ff]/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#7d8b9f] hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Level Filter Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-[#7d8b9f] mr-1">Severity:</span>
            {(['all', 'info', 'warn', 'error'] as LevelFilter[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono capitalize transition-colors cursor-pointer border ${
                  selectedLevel === lvl
                    ? 'bg-white/10 text-white border-white/30 font-bold'
                    : 'bg-[#0a1220] text-[#7d8b9f] hover:text-white border-white/5'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Test Event Injection Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-[#7d8b9f] hidden xl:inline">Simulate:</span>
            <button
              onClick={() => handleSimulateTestLog('welcome')}
              className="px-2 py-1 bg-white/5 hover:bg-[#53e7ff]/10 text-[#53e7ff] text-[10px] font-mono rounded-lg border border-white/5 hover:border-[#53e7ff]/20 transition-colors flex items-center gap-1 cursor-pointer"
              title="Inject sample Welcome Event"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Welcome</span>
            </button>
            <button
              onClick={() => handleSimulateTestLog('music')}
              className="px-2 py-1 bg-white/5 hover:bg-[#ff9b45]/10 text-[#ff9b45] text-[10px] font-mono rounded-lg border border-white/5 hover:border-[#ff9b45]/20 transition-colors flex items-center gap-1 cursor-pointer"
              title="Inject sample Music Track Event"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Music</span>
            </button>
            <button
              onClick={() => handleSimulateTestLog('connection')}
              className="px-2 py-1 bg-white/5 hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-mono rounded-lg border border-white/5 hover:border-emerald-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              title="Inject sample Connection Probe Event"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Connection</span>
            </button>
          </div>
        </div>
      </div>

      {/* Log Feed Display */}
      <div className="bg-[#121c2c] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-[#090e18] border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block opacity-80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block opacity-80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block opacity-80" />
            <span className="font-mono text-[11px] text-[#7d8b9f] ml-2">freddy-bridge.log (live buffer)</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[#7d8b9f]">
            <span>Filter: <strong className="text-white">{selectedCategory}</strong></span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">{filteredLogs.length} active entries</span>
          </div>
        </div>

        {/* Logs List */}
        <div className="divide-y divide-white/5 max-h-[580px] overflow-y-auto font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Terminal className="w-8 h-8 text-[#7d8b9f] mx-auto opacity-50" />
              <div className="text-sm font-bold text-white">No logs matching "{selectedCategory}"</div>
              <p className="text-xs text-[#7d8b9f] max-w-sm mx-auto">
                No events currently match the selected category or search filters. Try switching to "All Events" or trigger an event in the console.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedLevel('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-sans font-bold cursor-pointer transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => handleSimulateTestLog(selectedCategory === 'all' ? 'welcome' : selectedCategory as any)}
                  className="px-3 py-1.5 rounded-lg bg-[#53e7ff]/20 hover:bg-[#53e7ff]/30 text-[#53e7ff] text-xs font-sans font-bold cursor-pointer transition-colors"
                >
                  Emit Test Event
                </button>
              </div>
            </div>
          ) : (
            filteredLogs.map((log, idx) => {
              const catCfg = getCategoryConfig(log.category);
              const isExpanded = expandedLogId === log.id;
              const hasDetails = log.details && Object.keys(log.details).length > 0;

              return (
                <div
                  key={`log-item-${log.id || idx}-${idx}`}
                  className="p-3.5 hover:bg-[#142033] transition-colors group cursor-pointer"
                  onClick={() => hasDetails && setExpandedLogId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Time, Level, Category, and Title */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Expand / Collapse Caret */}
                      <div className="pt-0.5 text-[#7d8b9f] shrink-0">
                        {hasDetails ? (
                          isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#53e7ff]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                          )
                        ) : (
                          <div className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[#7d8b9f] text-[11px] tabular-nums shrink-0 pt-0.5">
                        {formatAbsoluteTime(log.timestamp)}
                      </span>

                      {/* Level Indicator */}
                      <div className="shrink-0 pt-0.5">{getLevelBadge(log.level)}</div>

                      {/* Category Label */}
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 shrink-0 ${catCfg.colorClass}`}
                      >
                        {catCfg.icon}
                        <span>{catCfg.label}</span>
                      </span>

                      {/* Title & Message */}
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-bold text-xs truncate flex items-center gap-2">
                          <span>{log.title}</span>
                          {log.source && (
                            <span className="text-[10px] text-[#7d8b9f] font-normal font-mono opacity-60">
                              @{log.source}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#aab6c9] mt-0.5 leading-relaxed break-words font-sans">
                          {log.message}
                        </p>
                      </div>
                    </div>

                    {/* Right: Relative Time */}
                    <div className="text-[10px] text-[#7d8b9f] tabular-nums shrink-0 pt-0.5 whitespace-nowrap">
                      {formatRelativeTime(log.timestamp)}
                    </div>
                  </div>

                  {/* Expandable JSON Metadata Inspector */}
                  {isExpanded && hasDetails && (
                    <div className="mt-3 ml-6 p-3 bg-[#0a1220] rounded-xl border border-white/5 space-y-1.5 animate-fadeIn">
                      <div className="text-[10px] font-mono font-bold text-[#53e7ff] flex items-center justify-between">
                        <span>EVENT PAYLOAD INSPECTOR</span>
                        <span className="text-[10px] text-[#7d8b9f] font-normal">Log ID: {log.id}</span>
                      </div>
                      <pre className="text-[11px] text-[#aab6c9] font-mono overflow-x-auto p-2 bg-black/40 rounded border border-white/5">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
