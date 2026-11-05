import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../utils/audio';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Mic,
  MicOff,
  Volume2,
  Disc,
  Radio,
  Sparkles
} from 'lucide-react';

export const MusicVoiceControls: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<'rockstar' | 'happy' | 'jam'>('rockstar');
  const [musicStatus, setMusicStatus] = useState<string>("Ready to control Freddy's voice features.");
  const [volume, setVolume] = useState(80);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const tracks = [
    {
      id: 'rockstar',
      title: 'Rockstar Row Theme',
      artist: 'Glamrock Freddy & The Band',
      duration: '03:14',
      badge: 'Main Stage'
    },
    {
      id: 'happy',
      title: 'Happy (True) Ending',
      artist: 'Fazbear Entertainment OST',
      duration: '02:48',
      badge: 'Vocal Synth'
    },
    {
      id: 'jam',
      title: 'Pizzaplex Neon Jam',
      artist: 'Arcade Concourse Live',
      duration: '03:30',
      badge: '80s Synthwave'
    }
  ];

  // Visualizer animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = () => {
      animFrameRef.current = requestAnimationFrame(renderFrame);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const data = soundEngine.getByteFrequencyData();
      const numBars = 32;
      const barWidth = (canvas.width / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = (data[i] || 0) / 255 * (canvas.height - 10);
        // Add minimal idle pulsation when playing
        if (isPlaying && barHeight < 6) {
          barHeight = 6 + Math.sin(Date.now() / 150 + i) * 4;
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Gradient from cyan to orange
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#53e7ff');
        gradient.addColorStop(1, '#ff9b45');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };

    renderFrame();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  const handleAction = async (action: string) => {
    setMusicStatus(`Sending voice command: ${action}...`);

    try {
      await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch {
      // Offline fallback
    }

    if (action === 'join') {
      setIsVoiceConnected(true);
      setMusicStatus("Freddy joined the voice channel! Voice broadcast ready.");
      soundEngine.playActionSound('default');
    } else if (action === 'leave') {
      setIsVoiceConnected(false);
      setIsPlaying(false);
      soundEngine.stopMusic();
      setMusicStatus("Freddy left the voice channel.");
      soundEngine.playActionSound('default');
    } else if (action.startsWith('play')) {
      const trackId = action.includes('happy') ? 'happy' : action.includes('jam') ? 'jam' : 'rockstar';
      setCurrentTrack(trackId);
      setIsPlaying(true);
      setIsVoiceConnected(true);
      soundEngine.playMusic(trackId);
      setMusicStatus(`Now playing: ${tracks.find(t => t.id === trackId)?.title} in Discord voice! 🎸`);
    } else if (action === 'pause') {
      setIsPlaying(false);
      soundEngine.stopMusic();
      setMusicStatus("Playback paused.");
    } else if (action === 'resume') {
      setIsPlaying(true);
      soundEngine.playMusic(currentTrack);
      setMusicStatus("Playback resumed.");
    } else if (action === 'stop') {
      setIsPlaying(false);
      soundEngine.stopMusic();
      setMusicStatus("Music playback stopped.");
    } else if (action === 'skip') {
      const nextIndex = (tracks.findIndex(t => t.id === currentTrack) + 1) % tracks.length;
      const nextTrack = tracks[nextIndex].id as 'rockstar' | 'happy' | 'jam';
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
      soundEngine.playMusic(nextTrack);
      setMusicStatus(`Skipped to: ${tracks[nextIndex].title}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🎵 Music & Voice Controls</span>
          </h2>
          <p className="text-xs text-[#aab6c9] mt-1">
            Dispatch soundtrack playback and vocal announcements to Freddy in your configured Discord voice channel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAction(isVoiceConnected ? 'leave' : 'join')}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              isVoiceConnected
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-[#5865f2] hover:bg-[#4752c4] text-white shadow-md shadow-[#5865f2]/20'
            }`}
          >
            {isVoiceConnected ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Disconnect Voice</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Join Discord Voice</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Track List & Player Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Track Selection Column */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
            <span>Pizzaplex Soundtracks</span>
            <span className="text-xs text-[#7d8b9f]">Web Audio & Voice Stream</span>
          </h3>

          <div className="space-y-2.5">
            {tracks.map((track) => {
              const isSelected = currentTrack === track.id;
              const isCurrentlyPlaying = isSelected && isPlaying;
              return (
                <div
                  key={track.id}
                  onClick={() => handleAction(`play ${track.id}`)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'border-[#ff9b45] bg-[#182538] shadow-lg shadow-[#ff9b45]/15'
                      : 'border-white/10 bg-[#121c2c] hover:border-white/20 hover:bg-[#142235]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCurrentlyPlaying
                        ? 'bg-[#ff9b45] text-black shadow-md shadow-[#ff9b45]/30 animate-pulse'
                        : 'bg-white/5 text-[#aab6c9] group-hover:text-white'
                    }`}>
                      {isCurrentlyPlaying ? (
                        <Disc className="w-5 h-5 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white group-hover:text-[#53e7ff] transition-colors truncate">
                        {track.title}
                      </div>
                      <div className="text-xs text-[#7d8b9f] truncate">
                        {track.artist}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-[#53e7ff] bg-[#53e7ff]/10 px-2 py-0.5 rounded border border-[#53e7ff]/20">
                      {track.badge}
                    </span>
                    <div className="text-[11px] text-[#7d8b9f] font-mono tabular-nums mt-1">
                      {track.duration}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Voice Commands */}
          <div className="p-4 bg-[#0a1220] border border-white/10 rounded-xl space-y-2">
            <span className="text-xs font-bold text-[#ff9b45] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>Voice Channel Integration</span>
            </span>
            <p className="text-xs text-[#aab6c9] leading-relaxed">
              When Freddy is invited to your Discord server and in a voice room, you can trigger these soundtracks directly from this dashboard or via the <code>/music [song]</code> slash command.
            </p>
          </div>
        </div>

        {/* Audio Visualizer & Player Deck Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Visualizer Canvas */}
            <div className="bg-[#080e18] border border-white/10 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-[#aab6c9] mb-3">
                <span className="font-mono text-[#53e7ff] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  SPECTROGRAM
                </span>
                <span className="text-[11px] font-mono text-[#ff9b45]">
                  {isPlaying ? 'STREAMING ACTIVE' : 'STANDBY'}
                </span>
              </div>

              <canvas
                ref={canvasRef}
                width={360}
                height={90}
                className="w-full h-24 rounded-lg bg-[#05080f]"
              />

              <div className="mt-2 text-center">
                <span className="text-xs font-bold text-white">
                  {tracks.find(t => t.id === currentTrack)?.title}
                </span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleAction('skip')}
                title="Skip Track"
                className="p-3 text-[#aab6c9] hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <SkipForward className="w-5 h-5 rotate-180" />
              </button>

              <button
                onClick={() => handleAction(isPlaying ? 'pause' : 'resume')}
                title={isPlaying ? 'Pause' : 'Play'}
                className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#ff9b45] to-[#ff8020] text-black font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#ff9b45]/30 cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={() => handleAction('stop')}
                title="Stop Music"
                className="p-3 text-[#aab6c9] hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Square className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleAction('skip')}
                title="Next Track"
                className="p-3 text-[#aab6c9] hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              <Volume2 className="w-4 h-4 text-[#7d8b9f]" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#ff9b45] cursor-pointer"
              />
              <span className="text-xs font-mono text-[#7d8b9f] w-9 tabular-nums text-right">
                {volume}%
              </span>
            </div>

            {/* Status Feedback Box */}
            <div className="p-3 bg-[#0a1220] border-l-3 border-[#53e7ff] rounded-r-xl text-xs text-[#53e7ff] font-mono leading-relaxed">
              {musicStatus}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
