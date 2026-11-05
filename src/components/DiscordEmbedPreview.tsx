import React from 'react';
import { Bot, Sparkles, Hash, ExternalLink } from 'lucide-react';

interface DiscordEmbedPreviewProps {
  type: 'welcome' | 'goodbye';
  message: string;
  channelId: string;
  imageUrl: string;
  serverName?: string;
}

export const DiscordEmbedPreview: React.FC<DiscordEmbedPreviewProps> = ({
  type,
  message,
  channelId,
  imageUrl,
  serverName = "Freddy's Mega Pizzaplex"
}) => {
  // Format placeholders
  const renderedMessage = message
    .replace(/\{user\}/g, '@Superstar')
    .replace(/\{server\}/g, serverName);

  return (
    <div className="bg-[#313338] border border-[#232428] rounded-xl p-4 text-[#dbdee1] font-sans shadow-2xl overflow-hidden">
      {/* Discord Channel Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#3f4147] text-xs text-[#949ba4]">
        <div className="flex items-center gap-1.5 font-semibold text-[#f2f3f5]">
          <Hash className="w-3.5 h-3.5 text-[#80848e]" />
          <span>{channelId ? `channel-${channelId.slice(-4)}` : 'welcome-lounge'}</span>
        </div>
        <span className="text-[11px] bg-[#232428] px-2 py-0.5 rounded text-[#b5bac1]">
          Discord Embed Preview
        </span>
      </div>

      {/* Message Row */}
      <div className="flex items-start gap-3.5">
        {/* Glamrock Freddy Avatar */}
        <div className="relative shrink-0">
          <img
            src="/src/assets/images/freddy_avatar_badge_1793907789970.jpg"
            alt="Glamrock Freddy Bot"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-[#53e7ff]/60"
            referrerPolicy="no-referrer"
          />
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#23a55a] rounded-full ring-2 ring-[#313338]" />
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-white hover:underline cursor-pointer">
              Glamrock Freddy
            </span>
            <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider flex items-center gap-0.5">
              <Bot className="w-2.5 h-2.5" />
              BOT
            </span>
            <span className="text-[11px] text-[#949ba4]">Today at 10:00 PM</span>
          </div>

          {/* Embed Container */}
          <div className="mt-2 bg-[#2b2d31] border-l-4 border-[#ff9b45] rounded-r-lg p-3 max-w-xl shadow-md">
            {/* Embed Header / Author */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#53e7ff] mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{serverName} · {type === 'welcome' ? 'New Superstar Arrival' : 'Superstar Departure'}</span>
            </div>

            {/* Embed Title */}
            <h4 className="text-sm font-bold text-white mb-1.5">
              {type === 'welcome' ? '🌟 Welcome to the Stage!' : '👋 See You Later, Superstar!'}
            </h4>

            {/* Embed Description */}
            <p className="text-xs text-[#dbdee1] leading-relaxed whitespace-pre-wrap break-words">
              {renderedMessage}
            </p>

            {/* Embed Image */}
            {imageUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-[#3f4147] bg-[#1e1f22]">
                <img
                  src={imageUrl}
                  alt={`${type} banner`}
                  className="w-full max-h-56 object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Embed Footer */}
            <div className="mt-2.5 pt-2 border-t border-[#383a40] flex items-center justify-between text-[10px] text-[#949ba4]">
              <span>Fazbear Security Network · Automated Greetings</span>
              <span className="font-mono tabular-nums">{channelId ? `ID: ${channelId}` : 'Default System'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
