import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Volume2, Trash2 } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { getSimulatedChatReply } from '../utils/freddyBot';

interface Message {
  id: string;
  sender: 'freddy' | 'user';
  text: string;
  timestamp: string;
}

export const FreddyChat: React.FC = () => {
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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Tell me a joke, Freddy!",
    "Can you protect me?",
    "What is the Absolute Solver?",
    "Gregory is stuck in the vents!",
    "Play Rockstar Row!"
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    soundEngine.playActionSound('default');

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
        soundEngine.playActionSound('default');
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'freddy',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 500);
    } catch {
      // In case server is offline, fallback seamlessly to simulation
      const replyText = getSimulatedChatReply(textToSend);
      setTimeout(() => {
        setIsTyping(false);
        soundEngine.playActionSound('default');
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'freddy',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 400);
    }
  };

  const handleVoiceSpeak = (text: string) => {
    soundEngine.playActionSound('default');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[^\w\s.,!?]/g, ''));
      utterance.pitch = 0.85; // Slightly deeper robotic bear pitch
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-[650px] relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/src/assets/images/freddy_avatar_badge_1793907789970.jpg"
              alt="Glamrock Freddy"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[#ff9b45]"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#121c2c]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <span>Glamrock Freddy</span>
              <span className="text-[10px] text-[#ff9b45] font-mono uppercase bg-[#ff9b45]/10 px-1.5 py-0.5 rounded border border-[#ff9b45]/20">
                AI Voice Synced
              </span>
            </h3>
            <span className="text-xs text-[#aab6c9]">Pizzaplex Guardian & Frontman</span>
          </div>
        </div>

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

      {/* Quick Prompts Bar */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs border-b border-white/5">
        <span className="text-[11px] text-[#7d8b9f] shrink-0">Ask:</span>
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs text-[#53e7ff] hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
        {messages.map((msg) => {
          const isFreddy = msg.sender === 'freddy';
          return (
            <div
              key={msg.id}
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
                  <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-end">
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

              {!isFreddy && (
                <div className="w-8 h-8 rounded-full bg-[#5865f2] text-white flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
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
              <span className="text-[11px] font-mono text-[#ff9b45] ml-1">Freddy is formulating response...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-3 border-t border-white/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Say something to Freddy..."
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
