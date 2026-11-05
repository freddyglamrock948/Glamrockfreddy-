import React, { useState } from 'react';
import { soundEngine } from '../utils/audio';
import { getSimulatedActionReply } from '../utils/freddyBot';
import {
  Zap,
  ShieldAlert,
  Ghost,
  Radio,
  Sparkles,
  Terminal,
  Volume2,
  RefreshCw,
  Laugh,
  Flame
} from 'lucide-react';

interface SolverAndScaresProps {
  onTriggerGlitch: () => void;
}

export const SolverAndScares: React.FC<SolverAndScaresProps> = ({ onTriggerGlitch }) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string>("Choose an action, Superstar. Freddy is primed and ready.");
  const [resultStatus, setResultStatus] = useState<'ok' | 'glitch' | 'danger'>('ok');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionHistory, setActionHistory] = useState<Array<{ name: string; time: string; status: string }>>([
    { name: 'System Boot', time: '10:00 PM', status: 'ok' }
  ]);

  const actions = [
    {
      name: 'Reality Glitch',
      id: 'reality glitch',
      icon: Zap,
      desc: 'Corrupt camera matrix and temporal anchors',
      color: 'from-[#ff9b45] to-[#f43f5e]',
      type: 'glitch'
    },
    {
      name: 'Teleport',
      id: 'teleport',
      icon: Sparkles,
      desc: 'Phase-shift Freddy to a new Pizzaplex zone',
      color: 'from-[#53e7ff] to-[#0ea5e9]',
      type: 'ok'
    },
    {
      name: 'Solver Shield',
      id: 'solver shield',
      icon: ShieldAlert,
      desc: 'Deploy golden geometric deflection hex-barrier',
      color: 'from-[#eab308] to-[#f97316]',
      type: 'ok'
    },
    {
      name: 'System Override',
      id: 'system override',
      icon: Terminal,
      desc: 'Bypass Fazbear safety lockouts and restrictions',
      color: 'from-[#ef4444] to-[#b91c1c]',
      type: 'danger'
    },
    {
      name: 'Solver Jumpscare',
      id: 'solver jumpscare',
      icon: Ghost,
      desc: 'Eldritch absolute solver static roar',
      color: 'from-[#a855f7] to-[#ec4899]',
      type: 'glitch'
    },
    {
      name: 'Classic Jumpscare',
      id: 'jumpscare',
      icon: Flame,
      desc: 'Classic security camera animatronic scream',
      color: 'from-[#ff9b45] to-[#ea580c]',
      type: 'danger'
    },
    {
      name: 'Freddy Roar',
      id: 'roar',
      icon: Volume2,
      desc: 'Massive vocal resonance acoustic boom',
      color: 'from-[#3b82f6] to-[#6366f1]',
      type: 'ok'
    },
    {
      name: 'Tell Me A Joke',
      id: 'joke',
      icon: Laugh,
      desc: 'Freddy’s trademark protective dad humor',
      color: 'from-[#10b981] to-[#059669]',
      type: 'ok'
    }
  ];

  const handleTriggerAction = async (actionId: string, actionName: string) => {
    setActiveAction(actionId);
    setIsProcessing(true);
    setActionResult(`Executing ${actionName}...`);

    // Audio synthesizer effect
    soundEngine.playActionSound(actionId);

    // Screen glitch for high-intensity actions
    if (actionId.includes('glitch') || actionId.includes('jumpscare') || actionId.includes('override')) {
      onTriggerGlitch();
    }

    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionId })
      });
      const data = await res.json();
      const reply = data.reply || data.message || getSimulatedActionReply(actionId).reply;
      const sim = getSimulatedActionReply(actionId);

      setActionResult(reply);
      setResultStatus(sim.status);
      setActionHistory((prev) => [
        {
          name: actionName,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: sim.status
        },
        ...prev.slice(0, 7)
      ]);
    } catch {
      const sim = getSimulatedActionReply(actionId);
      setActionResult(sim.reply);
      setResultStatus(sim.status);
      setActionHistory((prev) => [
        {
          name: actionName,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: sim.status
        },
        ...prev.slice(0, 7)
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🔺 Absolute Solver & Scares</span>
          </h2>
          <p className="text-xs text-[#aab6c9] mt-1">
            Dispatch diagnostic commands, reality distortion events, and soundboard animatronic reactions to the connected bot.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#53e7ff] bg-[#121c2c] px-3 py-1.5 rounded-xl border border-white/10">
          <Radio className="w-3.5 h-3.5 animate-pulse text-[#ff9b45]" />
          <span>Gateway Link: Ready</span>
        </div>
      </div>

      {/* Grid: Action Grid & Live Terminal Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 8 Action Trigger Buttons */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {actions.map((act) => {
              const Icon = act.icon;
              const isSelected = activeAction === act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => handleTriggerAction(act.id, act.name)}
                  disabled={isProcessing}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'border-[#53e7ff] bg-[#1a293d] shadow-lg shadow-[#53e7ff]/20'
                      : 'border-white/10 bg-[#121c2c] hover:border-white/30 hover:bg-[#152336]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${act.color} text-black font-bold flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-mono text-[#7d8b9f] uppercase tracking-wider">
                      {act.type}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-0.5 group-hover:text-[#53e7ff] transition-colors">
                    {act.name}
                  </h4>
                  <p className="text-[11px] text-[#aab6c9] leading-tight line-clamp-1">
                    {act.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Action Result Terminal Panel */}
          <div className="bg-[#080e18] border border-white/15 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2 text-[#ff9b45] font-mono font-bold">
                <Terminal className="w-4 h-4" />
                <span>COMMAND EXECUTION LOG</span>
              </div>
              <span className="text-[10px] font-mono text-[#7d8b9f]">Channel: #freddy-actions</span>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs font-mono leading-relaxed transition-all ${
                resultStatus === 'glitch'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : resultStatus === 'danger'
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  : 'bg-cyan-950/40 border-[#53e7ff]/40 text-[#53e7ff]'
              }`}
            >
              {actionResult}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Monitor & Solver Lore */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-[#53e7ff]/30 shadow-2xl relative group bg-[#080e18]">
            <img
              src="/src/assets/images/absolute_solver_glitch_1793907789794.jpg"
              alt="Absolute Solver Animatronic Glitch"
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent opacity-90" />
            <div className="absolute top-3 left-3 bg-[#090d16]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-[#ff9b45]">
              SOLVER INTEGRITY: 48%
            </div>
            <div className="absolute bottom-3 left-3 right-3 text-xs text-white">
              <div className="font-bold flex items-center gap-1.5 text-[#ff9b45]">
                <Zap className="w-3.5 h-3.5" />
                <span>Absolute Solver Matrix</span>
              </div>
              <p className="text-[11px] text-[#aab6c9] mt-0.5">
                Synthetic reality corruption subroutine linked with Glamrock Freddy’s security firmware.
              </p>
            </div>
          </div>

          {/* Action History Log */}
          <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-bold text-white mb-2.5 flex items-center justify-between">
              <span>Recent Dispatches</span>
              <span className="text-[10px] text-[#7d8b9f] font-mono">Last 8 events</span>
            </h4>

            <div className="space-y-1.5 text-[11px] font-mono">
              {actionHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/5 border border-white/5"
                >
                  <span className="text-[#f5f7fb]">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#7d8b9f] tabular-nums">{item.time}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.status === 'glitch' ? 'bg-amber-400' : item.status === 'danger' ? 'bg-rose-500' : 'bg-emerald-400'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
