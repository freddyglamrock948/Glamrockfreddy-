import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Volume2, Trash2, Heart, Shield, Flame, BookOpen } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { getSimulatedChatReply, ROLEPLAY_SCENES, getFriendshipLevel } from '../utils/freddyBot';
import confetti from 'canvas-confetti';

interface Message {
  id: string;
  sender: 'freddy' | 'user';
  text: string;
  timestamp: string;
}

interface FreddyChatProps {
  friendshipPoints: number;
  onAddFriendshipPoint: () => void;
}

export const FreddyChat: React.FC<FreddyChatProps> = ({
  friendshipPoints,
  onAddFriendshipPoint
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      sender: 'freddy',
      text: 'Hello, Superstar! I am Glamrock Freddy. I am here to keep you safe and rock the Pizzaplex with you! 🎸',
      timestamp: '10:00 PM'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeRoleplayScene, setActiveRoleplayScene] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: "🎄 Christmas Freddy!", prompt: "Christmas Freddy!" },
    { label: "🎅 Freddy, calm down", prompt: "Freddy, calm down." },
    { label: "🤗 Hug Freddy (+1 Point)", prompt: "Can I have a hug, Freddy?" },
    { label: "👦 Who is Gregory?", prompt: "Freddy, tell me about your son Gregory." },
    { label: "🎀 Who is Cyn?", prompt: "Who is Cyn to you, Freddy?" },
    { label: "🔥 Roast me!", prompt: "Give me a playful roast, Freddy!" },
    { label: "😄 Tell a joke", prompt: "Tell me a joke, Freddy!" },
    { label: "🚨 Lockdown test", prompt: "Are you on lockdown, Freddy?" }
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    if (textToSend.toLowerCase().includes('hug')) {
      soundEngine.playActionSound('hug');
      onAddFriendshipPoint();
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#ff9b45', '#53e7ff', '#ff6b81']
      });
    } else {
      soundEngine.playActionSound('default');
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend.trim() })
      });
      const data = await res.json();
      const replyText = data.reply || getSimulatedChatReply(textToSend);

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `freddy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sender: 'freddy',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 400);
    } catch {
      const replyText = getSimulatedChatReply(textToSend);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `freddy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sender: 'freddy',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 350);
    }
  };

  const handleRoleplaySelect = (sceneKey: 'gregory' | 'alert' | 'escape') => {
    const scene = ROLEPLAY_SCENES[sceneKey];
    setActiveRoleplayScene(sceneKey);
    soundEngine.playActionSound('default');

    const roleplayMsg: Message = {
      id: `roleplay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: 'freddy',
      text: `🎮 [ROLEPLAY: ${scene.title.toUpperCase()}]\n\n${scene.text}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, roleplayMsg]);
  };

  const handleVoiceSpeak = (text: string) => {
    soundEngine.playActionSound('default');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/\[.*?\]/g, '').replace(/[^\w\s.,!?]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.pitch = 0.85;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentRank = getFriendshipLevel(friendshipPoints);

  return (
    <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-[680px] relative">
      {/* Chat Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/src/assets/images/freddy_avatar_badge_1793907789970.jpg"
              alt="Glamrock Freddy"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#ff9b45]"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-[#121c2c]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Glamrock Freddy</span>
              <span className="text-[10px] text-[#ff9b45] font-mono uppercase bg-[#ff9b45]/10 px-2 py-0.5 rounded border border-[#ff9b45]/20">
                AI Voice & Family Lore Synced
              </span>
            </h3>
            <div className="text-xs text-[#aab6c9] flex items-center gap-2 mt-0.5">
              <span>Protecting Superstars</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#53e7ff] font-semibold">Gregory (Son) & Cyn (Daughter)</span>
            </div>
          </div>
        </div>

        {/* Friendship Badge & Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="bg-[#080e18] px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
            <div>
              <span className="font-bold text-white tabular-nums">{friendshipPoints}</span>
              <span className="text-[10px] text-[#7d8b9f] ml-1">pts ({currentRank})</span>
            </div>
          </div>

          <button
            onClick={() => handleSend("Can I have a hug, Freddy?")}
            title="Hug Freddy to earn friendship points"
            className="px-2.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 rounded-xl transition-all flex items-center gap-1 shadow-md shadow-rose-500/20 cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span>Hug</span>
          </button>

          <button
            onClick={() => setMessages([{
              id: 'cleared',
              sender: 'freddy',
              text: 'Ready for another round, Superstar! What is on your mind? 🎸',
              timestamp: 'Now'
            }])}
            title="Reset Chat History"
            className="p-2 text-[#7d8b9f] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Roleplay Scenes Selector Strip */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs border-b border-white/5">
        <span className="text-[11px] text-[#ff9b45] font-bold shrink-0 flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Roleplay:</span>
        </span>
        <button
          onClick={() => handleRoleplaySelect('gregory')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs text-[#53e7ff] hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          Protect Gregory
        </button>
        <button
          onClick={() => handleRoleplaySelect('alert')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs text-[#ff9b45] hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          Security Alert
        </button>
        <button
          onClick={() => handleRoleplaySelect('escape')}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs text-emerald-400 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          Escape Pizzaplex
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs border-b border-white/5">
        {quickPrompts.map((item) => (
          <button
            key={item.label}
            onClick={() => handleSend(item.prompt)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs text-[#aab6c9] hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
        {messages.map((msg, idx) => {
          const isFreddy = msg.sender === 'freddy';
          return (
            <div
              key={`chat-msg-${msg.id}-${idx}`}
              className={`flex items-start gap-3 ${isFreddy ? 'justify-start' : 'justify-end'}`}
            >
              {isFreddy && (
                <img
                  src="/src/assets/images/freddy_avatar_badge_1793907789970.jpg"
                  alt="Freddy"
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[#ff9b45]/50 mt-1"
                />
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                  isFreddy
                    ? 'bg-[#182538] border-l-4 border-[#ff9b45] text-white rounded-tl-sm'
                    : 'bg-[#53e7ff]/15 border-r-4 border-[#53e7ff] text-white rounded-tr-sm ml-auto'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[11px]">
                  <span className={`font-bold ${isFreddy ? 'text-[#ff9b45]' : 'text-[#53e7ff]'}`}>
                    {isFreddy ? 'Glamrock Freddy' : 'You (Superstar)'}
                  </span>
                  <span className="text-[#7d8b9f] text-[10px] font-mono tabular-nums">{msg.timestamp}</span>
                </div>

                <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                {isFreddy && (
                  <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleVoiceSpeak(msg.text)}
                      title="Listen with Speech Synth"
                      className="text-[10px] text-[#7d8b9f] hover:text-[#ff9b45] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Speak voice</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/freddy_avatar_badge_1793907789970.jpg"
              alt="Freddy"
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[#ff9b45]/50"
            />
            <div className="bg-[#182538] border-l-4 border-[#ff9b45] rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs text-[#aab6c9] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#ff9b45] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[#ff9b45] rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-[#ff9b45] rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] font-mono text-[#ff9b45] ml-1">Freddy is processing...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick @ Mention Chips */}
      <div className="flex items-center gap-1.5 pt-2 pb-1 overflow-x-auto text-[11px]">
        <span className="text-[#7d8b9f] text-[10px] font-mono shrink-0">Mention with @:</span>
        {['@Freddy', '@Gregory', '@Cyn', '@Superstar'].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setInput((prev) => (prev ? `${prev} ${tag}` : `${tag} `))}
            className="px-2 py-0.5 rounded-full bg-[#1e2f46] hover:bg-[#53e7ff]/20 text-[#53e7ff] border border-[#53e7ff]/30 transition-colors cursor-pointer shrink-0"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-2 border-t border-white/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Say something to Freddy (e.g. ask about Gregory, Cyn, or ask for a roast)..."
          className="flex-1 bg-[#0a1220] border border-white/15 focus:border-[#53e7ff] focus:ring-1 focus:ring-[#53e7ff] rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
        />

        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#53e7ff] to-[#36c2db] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-[#53e7ff]/20 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
