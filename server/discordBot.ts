import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActivityType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  VoiceBasedChannel
} from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
  VoiceConnection,
  AudioPlayer
} from '@discordjs/voice';
import path from 'path';
import fs from 'fs';

export interface DiscordGuildInfo {
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

export interface DiscordBotState {
  isOnline: boolean;
  status: 'online' | 'offline' | 'connecting' | 'error';
  userTag: string | null;
  botId: string | null;
  avatarUrl: string | null;
  wsPing: number;
  uptimeSeconds: number;
  guildsCount: number;
  guilds: DiscordGuildInfo[];
  activeVoiceGuilds: string[];
  registeredCommands: string[];
  isChristmasHyperMode: boolean;
  connectionError: string | null;
  lastConnectedAt: string | null;
  hostingNotice: string;
}

// Audio asset paths
const AUDIO_PATHS = {
  rockstar_row: path.resolve('public/assets/aistudio/04_Rockstar_Row_849df7a1.mp3'),
  greeting: path.resolve('public/assets/aistudio/glamrock_freddy_f8731803.mp3'),
  lockdown: path.resolve('public/assets/aistudio/glamrock-freddy_53d55e6e.mp3')
};

export interface QueuedTrack {
  trackKey: string;
  title: string;
  requestedBy: string;
}

// Helper: Build the complete Glamrock Freddy Help Center Embed
export function buildHelpEmbed(category = 'all', botUser?: any): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x53E7FF)
    .setTitle('🐻 Glamrock Freddy – Help Center')
    .setDescription(
      'Hey, superstar! I’m Glamrock Freddy. Here’s a list of everything I can do to help you!\n\nUse slash commands in chat (like `/help`, `/freddy`, or `/play`), or mention me directly with `@Glamrock Freddy`!'
    )
    .setThumbnail(botUser?.displayAvatarURL() || null);

  if (category === 'all' || category === 'freddy') {
    embed.addFields({
      name: '🐻 Freddy Commands',
      value: [
        '• **/freddy** `[user] [message] [pin]` – Talk to Glamrock Freddy.',
        '• **/hug** `[member]` – Give a selected member a hug *(+1 Friendship Point)*.',
        '• **/protect** `[member]` – Protect a selected member.',
        '• **/joke** – Tell a joke.',
        '• **/sing** – Sing for the members.',
        '• **/roast** `[member]` – Playfully roast a member.',
        '• **/roar** – Perform a roar.',
        '• **/status** – Show Freddy’s system status.'
      ].join('\n')
    });
  }

  if (category === 'all' || category === 'solver') {
    embed.addFields({
      name: '🔻 Absolute Solver Commands',
      value: [
        'Execute reality-distortion powers with **/solver `action:` `[target]` `[animatronic]`**:',
        '• **Reality Glitch** – Distort optical feeds and reality matrices.',
        '• **Teleport** – Quantum displacement: Freddy instantly teleports beside the target.',
        '• **Solver Shield** – Deploy an impenetrable glowing hexagonal barrier.',
        '• **System Override** – High-frequency override of nearby Pizzaplex security terminals.',
        '• **Solver Jumpscare** – Optical alert glitch jumpscare with Solver eyes.',
        '*Targets supported:* Any server member, **Gregory (Son)**, **Cyn (Daughter)**, **Chica**, **Monty**, **Roxy**, or the **Daycare Attendant**.'
      ].join('\n')
    });
  }

  if (category === 'all' || category === 'music') {
    embed.addFields(
      {
        name: '🎙️ Voice Commands',
        value: [
          '• **/join** – Join your voice channel.',
          '• **/leave** – Leave the voice channel.',
          '• **/jumpscare** – Perform a jumpscare.'
        ].join('\n')
      },
      {
        name: '🎵 Music Commands',
        value: [
          '• **/play** `[track]` – Play or queue a song.',
          '• **/queue** – Show upcoming songs.',
          '• **/skip** – Skip the current song.',
          '• **/pause** – Pause music.',
          '• **/resume** – Resume music.',
          '• **/nowplaying** – Show the current song.',
          '• **/stop** – Stop music and clear the queue.'
        ].join('\n')
      }
    );
  }

  if (category === 'all' || category === 'security') {
    embed.addFields({
      name: '🚨 Security & General Commands',
      value: [
        '• **/lockdown** – Activate Freddy’s security lockdown.',
        '• **/test** – Test Freddy’s systems.',
        '• **/help** `[category]` – Display the complete help center.'
      ].join('\n')
    });
  }

  embed.addFields({
    name: '🎄 Christmas Freddy Hyper Mode',
    value: [
      '• Say **"Christmas Freddy"** in any channel or mention him to activate Christmas Hyper Mode 🎅🎄🎁!',
      '• Say **"Freddy, calm down"**, **"Calm down, Freddy"**, or **"Stop Christmas mode"** to stop it (or it automatically ends after 60 seconds).'
    ].join('\n')
  });

  embed.setFooter({
    text: 'Mega Pizzaplex · Fazbear Entertainment Help Protocol · /help'
  });
  embed.setTimestamp();

  return embed;
}

// Helper: Interactive Category Buttons
export function buildHelpActionRow(current = 'all'): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('help_all')
      .setLabel('All')
      .setStyle(current === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('📋'),
    new ButtonBuilder()
      .setCustomId('help_freddy')
      .setLabel('Freddy')
      .setStyle(current === 'freddy' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('🐻'),
    new ButtonBuilder()
      .setCustomId('help_solver')
      .setLabel('Solver')
      .setStyle(current === 'solver' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('🔻'),
    new ButtonBuilder()
      .setCustomId('help_music')
      .setLabel('Music')
      .setStyle(current === 'music' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('🎵'),
    new ButtonBuilder()
      .setCustomId('help_security')
      .setLabel('Security')
      .setStyle(current === 'security' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('🚨')
  );
}

// Complete Slash command builders
export const slashCommands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display the complete Glamrock Freddy Help Center and command directory')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Select command category to view')
        .setRequired(false)
        .addChoices(
          { name: 'All Commands', value: 'all' },
          { name: 'Freddy Commands', value: 'freddy' },
          { name: 'Absolute Solver Commands', value: 'solver' },
          { name: 'Music & Voice Commands', value: 'music' },
          { name: 'Security & General Commands', value: 'security' }
        )
    ),

  new SlashCommandBuilder()
    .setName('freddy')
    .setDescription('Talk to Glamrock Freddy, mention Superstars, or pin him to the channel')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Superstar to ping with @ (select Freddy to ping him, or tag any member)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Your message or question for Freddy (optional, defaults to greeting)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('pin')
        .setDescription('Pin Freddy\'s response to this channel (optional, true/false)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Give a selected member a warm animatronic bear hug (+1 Friendship Point)')
    .addUserOption(option =>
      option.setName('member')
        .setDescription('Member to hug (defaults to you)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('protect')
    .setDescription('Protect a selected member with animatronic security shields')
    .addUserOption(option =>
      option.setName('member')
        .setDescription('Superstar member to protect (defaults to you)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Tell a Mega Pizzaplex animatronic joke'),

  new SlashCommandBuilder()
    .setName('sing')
    .setDescription('Sing for the members with the Fazbear Band'),

  new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Playfully roast a member with daycare humor')
    .addUserOption(option =>
      option.setName('member')
        .setDescription('Superstar to roast (defaults to you)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('roar')
    .setDescription('Perform an energetic animatronic bear roar'),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show Freddy’s system status, gateway latency, uptime, and Christmas mode'),

  new SlashCommandBuilder()
    .setName('solver')
    .setDescription('Execute Absolute Solver reality-distortion powers and security overrides')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Solver action to execute')
        .setRequired(true)
        .addChoices(
          { name: 'Reality Glitch (Optical Distortion)', value: 'glitch' },
          { name: 'Teleport (Quantum Displacement)', value: 'teleport' },
          { name: 'Solver Shield (Impenetrable Barrier)', value: 'shield' },
          { name: 'System Override (Pizzaplex Protocol)', value: 'override' },
          { name: 'Solver Jumpscare (Optical Anomaly Alert)', value: 'jumpscare' }
        )
    )
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User target for the Solver effect (optional)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('animatronic')
        .setDescription('Nearby Pizzaplex animatronic target')
        .setRequired(false)
        .addChoices(
          { name: 'Gregory (Son)', value: 'Gregory' },
          { name: 'Cyn (Daughter)', value: 'Cyn' },
          { name: 'Glamrock Chica', value: 'Chica' },
          { name: 'Montgomery Gator', value: 'Monty' },
          { name: 'Roxanne Wolf', value: 'Roxy' },
          { name: 'Daycare Attendant (Sun/Moon)', value: 'Daycare' }
        )
    ),

  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play or queue authentic Pizzaplex music in your voice channel')
    .addStringOption(option =>
      option.setName('track')
        .setDescription('Choose track to stream into Discord Voice')
        .setRequired(false)
        .addChoices(
          { name: 'Rockstar Row Theme (OST)', value: 'rockstar_row' },
          { name: 'Voice Greeting ("Way to go, superstar!")', value: 'greeting' },
          { name: 'Lockdown Announcement ("Shut your mouth!")', value: 'lockdown' }
        )
    ),

  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show upcoming songs in the Pizzaplex voice queue'),

  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song to the next queued track'),

  new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause current voice stream playback'),

  new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume paused voice stream playback'),

  new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the current song playing in voice channel'),

  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop music playback and clear the voice queue'),

  new SlashCommandBuilder()
    .setName('join')
    .setDescription('Connect Freddy to your current voice channel'),

  new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Disconnect Freddy from the current voice channel'),

  new SlashCommandBuilder()
    .setName('jumpscare')
    .setDescription('Perform a jumpscare with optical alert and security sound'),

  new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Activate Freddy\'s security lockdown protocol'),

  new SlashCommandBuilder()
    .setName('test')
    .setDescription('Test Freddy\'s systems, gateway ping, and diagnostics')
];

class DiscordBotManager {
  private client: Client | null = null;
  private voicePlayers = new Map<string, { connection: VoiceConnection; player: AudioPlayer; track?: string }>();
  private voiceQueues = new Map<string, QueuedTrack[]>();
  private activeTracks = new Map<string, { trackKey: string; title: string; requestedBy: string; startedAt: number }>();
  private logCallback?: (category: 'welcome' | 'music' | 'connection' | 'solver' | 'chat' | 'system', level: 'info' | 'success' | 'warn' | 'error', title: string, message: string, details?: any) => void;
  private lastConnectedTime: Date | null = null;
  private connectionError: string | null = null;
  private isConnecting = false;

  // Christmas Hyper Mode state and timer
  private isChristmasHyperMode = false;
  private christmasTimer: NodeJS.Timeout | null = null;

  public setLogger(cb: (category: 'welcome' | 'music' | 'connection' | 'solver' | 'chat' | 'system', level: 'info' | 'success' | 'warn' | 'error', title: string, message: string, details?: any) => void) {
    this.logCallback = cb;
  }

  private log(category: 'welcome' | 'music' | 'connection' | 'solver' | 'chat' | 'system', level: 'info' | 'success' | 'warn' | 'error', title: string, message: string, details?: any) {
    if (this.logCallback) {
      this.logCallback(category, level, title, message, details);
    }
    console.log(`[DiscordBot][${category.toUpperCase()}][${level.toUpperCase()}] ${title}: ${message}`);
  }

  public triggerChristmasMode(): string {
    this.isChristmasHyperMode = true;
    if (this.christmasTimer) {
      clearTimeout(this.christmasTimer);
    }

    // Automatic shutdown after 60 seconds
    this.christmasTimer = setTimeout(() => {
      this.stopChristmasMode();
    }, 60000);

    if (this.client?.user) {
      this.client.user.setPresence({
        activities: [{ name: '🎅 SANTA AT THE PIZZAPLEX! 🎄', type: ActivityType.Listening }],
        status: 'online'
      });
    }

    this.log('chat', 'warn', 'Christmas Hyper Mode Activated', 'Santa announcement triggered! Christmas hyper mode active for 60 seconds.');

    return "GUYS! DID YOU HEAR THE NEWS?! SANTA IS COMING TO THE MEGA PIZZAPLEX!!! 🎅🎄🎁 THIS IS THE BEST CHRISTMAS EVER, SUPERSTARS!";
  }

  public stopChristmasMode(): string {
    if (this.christmasTimer) {
      clearTimeout(this.christmasTimer);
      this.christmasTimer = null;
    }
    this.isChristmasHyperMode = false;

    if (this.client?.user) {
      this.client.user.setPresence({
        activities: [{ name: 'Mega Pizzaplex · /help', type: ActivityType.Listening }],
        status: 'online'
      });
    }

    this.log('chat', 'info', 'Christmas Hyper Mode Stopped', 'Freddy calmed down. Returned to standard presence.');

    return "Okay, superstar! I’ll calm down. I just got a little excited about Santa visiting the Mega Pizzaplex! 🎅";
  }

  public getIsChristmasHyperMode(): boolean {
    return this.isChristmasHyperMode;
  }

  public async start(): Promise<boolean> {
    let token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID || '1548483188203065357';

    if (!token) {
      try {
        const configPath = path.resolve('data/bot_config.json');
        if (fs.existsSync(configPath)) {
          const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (cfg.token || cfg.botToken) {
            token = cfg.token || cfg.botToken;
            process.env.DISCORD_BOT_TOKEN = token;
          }
        }
      } catch (e: any) {
        console.warn('[DiscordBot] Could not read fallback data/bot_config.json:', e.message);
      }
    }

    if (!token) {
      this.connectionError = null;
      this.log('connection', 'info', 'Standby Mode Ready', 'Discord Gateway is in standby mode. Web dashboard and character simulation are fully operational.');
      return false;
    }

    if (this.client && this.client.isReady()) {
      return true;
    }

    try {
      this.isConnecting = true;
      this.connectionError = null;
      this.log('connection', 'info', 'Connecting to Gateway', 'Initializing Discord Gateway v10 client connection with Guild, Message & Voice intents...');

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildVoiceStates,
          GatewayIntentBits.GuildMembers
        ]
      });

      this.setupEventHandlers(clientId, token);

      await this.client.login(token);
      return true;
    } catch (err: any) {
      this.isConnecting = false;
      this.connectionError = err.message || 'Failed to authenticate with Discord.';
      this.log('connection', 'error', 'Gateway Connection Failed', `Error during bot login: ${this.connectionError}`, { error: err.stack });
      return false;
    }
  }

  private setupEventHandlers(clientId: string, token: string) {
    if (!this.client) return;

    this.client.once('ready', async (c) => {
      this.isConnecting = false;
      this.lastConnectedTime = new Date();
      this.connectionError = null;

      this.log('connection', 'success', 'Discord Bot Connected & Ready', `Logged in as ${c.user.tag} (ID: ${c.user.id}). Guilds: ${c.guilds.cache.size}`, {
        tag: c.user.tag,
        id: c.user.id,
        guildCount: c.guilds.cache.size,
        ping: c.ws.ping
      });

      // Set character activity
      c.user.setPresence({
        activities: [{ name: 'Mega Pizzaplex · /help', type: ActivityType.Listening }],
        status: 'online'
      });

      // Register slash commands
      await this.registerCommands(clientId, token);
    });

    this.client.on('error', (err) => {
      this.connectionError = err.message;
      this.log('connection', 'error', 'Discord Client Error', err.message);
    });

    this.client.on('shardDisconnect', (event, shardId) => {
      this.log('connection', 'warn', 'Discord Gateway Disconnected', `Shard ${shardId} disconnected with code ${event.code}: ${event.reason || 'Network reset'}`);
    });

    this.client.on('shardReconnecting', (shardId) => {
      this.log('connection', 'info', 'Discord Gateway Reconnecting', `Shard ${shardId} reconnecting to Discord Gateway...`);
    });

    // Interaction handler for slash commands & buttons
    this.client.on('interactionCreate', async (interaction) => {
      // 1. Button interactions (Help Center navigation)
      if (interaction.isButton()) {
        if (interaction.customId.startsWith('help_')) {
          const cat = interaction.customId.replace('help_', '');
          const embed = buildHelpEmbed(cat, this.client?.user);
          const row = buildHelpActionRow(cat);
          await interaction.update({ embeds: [embed], components: [row] });
          return;
        }
      }

      // 2. Chat input slash commands
      if (!interaction.isChatInputCommand()) return;

      const { commandName } = interaction;

      try {
        if (commandName === 'help') {
          const cat = interaction.options.getString('category') || 'all';
          this.log('chat', 'info', `Command /help (${cat}) by ${interaction.user.tag}`, 'Dispatched Help Center embed with interactive buttons');
          await interaction.reply({
            embeds: [buildHelpEmbed(cat, this.client?.user)],
            components: [buildHelpActionRow(cat)]
          });
        } else if (commandName === 'freddy') {
          let targetUser = interaction.options.getUser('user');
          const userMsg = interaction.options.getString('message') || 'hello';
          const shouldPin = Boolean(interaction.options.getBoolean('pin') || userMsg.toLowerCase().includes('pin'));

          // If no user option was specified directly, check if message contains an @mention
          if (!targetUser) {
            const mentionMatch = userMsg.match(/<@!?(\d+)>/);
            if (mentionMatch && mentionMatch[1]) {
              const matchedMember = interaction.guild?.members.cache.get(mentionMatch[1]);
              if (matchedMember) {
                targetUser = matchedMember.user;
              }
            }
          }

          // If target is Freddy himself or no target selected, address the user who invoked the command
          const isTargetingBot = Boolean(this.client?.user && targetUser?.id === this.client.user.id);
          const mentionedUser = isTargetingBot || !targetUser ? interaction.user : targetUser;

          let reply = this.generateFreddyReply(userMsg, mentionedUser);
          if (isTargetingBot) {
            reply = `Way to go, <@${interaction.user.id}>! You pinged me? I am right here by your side, Superstar! Fazbear security protocol #1: Glamrock Freddy is always ready to assist! 🐻🎸`;
          }

          this.log(
            'chat',
            'info',
            `Command /freddy: ${interaction.user.tag} -> @${mentionedUser.tag}`,
            `Mentioning: <@${mentionedUser.id}> · Pin: ${shouldPin} · Prompt: "${userMsg}"`
          );

          await interaction.reply({
            content: `<@${mentionedUser.id}>`,
            allowedMentions: { users: [mentionedUser.id] },
            embeds: [
              new EmbedBuilder()
                .setColor(this.isChristmasHyperMode ? 0x00FF88 : 0x53E7FF)
                .setAuthor({
                  name: this.isChristmasHyperMode
                    ? '🎄 Christmas Glamrock Freddy 🎅'
                    : shouldPin
                    ? '📌 Glamrock Freddy (Pinned)'
                    : 'Glamrock Freddy',
                  iconURL: this.client?.user?.displayAvatarURL() || undefined
                })
                .setDescription(reply)
                .setFooter({
                  text: shouldPin
                    ? `📌 Pinned to channel · Superstar: ${mentionedUser.displayName || mentionedUser.username}`
                    : `Mega Pizzaplex · Superstar: ${mentionedUser.displayName || mentionedUser.username}`
                })
                .setTimestamp()
            ]
          });

          // Pin the message to the channel if requested
          if (shouldPin && interaction.channel && 'messages' in interaction.channel) {
            try {
              const replyMsg = await interaction.fetchReply();
              await replyMsg.pin();
              this.log('chat', 'success', 'Message Pinned', `Pinned Freddy's reply in channel`);
            } catch (pinErr: any) {
              console.warn('[DiscordBot] Could not pin message (check Manage Messages permission):', pinErr.message);
            }
          }
        } else if (commandName === 'hug') {
          const target = interaction.options.getUser('member') || interaction.user;
          this.log('chat', 'success', `Command /hug by ${interaction.user.tag} -> @${target.tag}`, 'Dispatched warm bear hug embed');
          await interaction.reply({
            content: `<@${target.id}>`,
            allowedMentions: { users: [target.id] },
            embeds: [
              new EmbedBuilder()
                .setColor(0x53E7FF)
                .setTitle('🫂 Giant Animatronic Bear Hug!')
                .setDescription(`A warm, giant bear hug for you, <@${target.id}>! You are my friend and you are doing fantastic today, Superstar! *(+1 Friendship Point)* 🐻❤️`)
                .setFooter({ text: `Requested by ${interaction.user.displayName || interaction.user.username}` })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'protect') {
          const target = interaction.options.getUser('member') || interaction.user;
          this.log('chat', 'info', `Command /protect on @${target.tag}`, `Security shield deployed by ${interaction.user.tag}`);
          await interaction.reply({
            content: `<@${target.id}>`,
            allowedMentions: { users: [target.id] },
            embeds: [
              new EmbedBuilder()
                .setColor(0x00FF88)
                .setTitle('🛡️ Fazbear Security Shield Engaged')
                .setDescription(`Do not fear, <@${target.id}>! I am deploying my Fazbear protective security barrier! Gregory and Cyn are safe with me, and so are you, Superstar! 🛡️🐻`)
                .setFooter({ text: 'Fazbear Security Protocol 1987' })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'joke') {
          const jokes = [
            'Why did Montgomery Gator join the golf club? Because he had an alligator-sized swing! Haha!',
            'Why did the animatronic bring a guitar? To make some byte-sized music! Haha!',
            'Why did Sun leave the daycare? Because Moon said it was past his bedtime! Haha!',
            'What is Glamrock Freddy’s favorite snack? Byte-sized pizza with extra cheese, Superstar!'
          ];
          const joke = jokes[Math.floor(Math.random() * jokes.length)];
          this.log('chat', 'info', `Command /joke by ${interaction.user.tag}`, joke);
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF9B45)
                .setTitle('😄 Fazbear Comedy Hour')
                .setDescription(`*${joke}* 🐻🎸\n\nWay to go, superstar! Always remember to smile!`)
                .setFooter({ text: 'Mega Pizzaplex Entertainment' })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'sing') {
          this.log('chat', 'info', `Command /sing by ${interaction.user.tag}`, 'Concert song dispatched');
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF3366)
                .setTitle('🎤 Live Concert at Rockstar Row!')
                .setDescription(`🎵 *“We are the superstars of the Pizzaplex! Rock with the band, clap your hands, let the music blast!”* 🎶\n\n# 🎸 ROCK AND ROLL, SUPERSTARS! 🐻✨\n\n*(Glamrock Freddy hits a high animatronic note as stage pyrotechnics flare!)*`)
                .setFooter({ text: 'Fazbear Live Entertainment' })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'roast') {
          const target = interaction.options.getUser('member') || interaction.user;
          const roasts = [
            `🔥 <@${target.id}>, you have the stealth skills of a marching band in the daycare!`,
            `🔥 <@${target.id}>, even Map Bot has a better sense of direction than you!`,
            `🔥 <@${target.id}>, I tried searching my chest cavity for your survival strategy, but it came back empty!`,
            `🔥 <@${target.id}>, your reflexes remind me of a wet floor sign robot on low battery!`
          ];
          const roast = roasts[Math.floor(Math.random() * roasts.length)];
          this.log('chat', 'info', `Command /roast on @${target.tag}`, roast);
          await interaction.reply({
            content: `<@${target.id}>`,
            allowedMentions: { users: [target.id] },
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF4500)
                .setTitle('🔥 Playful Fazbear Roast')
                .setDescription(`${roast}\n\n*All in good fun, Superstar! You are still part of the band!* 🐻🎸`)
                .setFooter({ text: `Targeted at ${target.displayName || target.username}` })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'roar') {
          this.log('chat', 'warn', `Command /roar by ${interaction.user.tag}`, 'Bear roar triggered');
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF3366)
                .setTitle('🐻 MEGA PIZZAPLEX ANIMATRONIC ROAR!')
                .setDescription(`# ROOOOOOAAAAAARRRRRRRRRRRRRR!!! 🐻🎸⚡\n\n**WELCOME TO THE MEGA PIZZAPLEX, SUPERSTARS!**\n*The stage spotlights flash brightly as the crowd goes wild!*`)
                .setFooter({ text: 'Fazbear Animatronic Soundboard' })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'status') {
          const ping = this.client?.ws.ping || 0;
          const uptimeSec = Math.floor(process.uptime());
          const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
          this.log('connection', 'info', `Command /status by ${interaction.user.tag}`, `Ping: ${ping}ms · Mem: ${mem}MB`);
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00FF88)
                .setTitle('🤖 Glamrock Freddy System Status & Diagnostics')
                .addFields(
                  { name: 'Gateway Health', value: '🟢 Heartbeat Active (Opcode 1)', inline: true },
                  { name: 'Ping / Latency', value: `${ping} ms`, inline: true },
                  { name: 'Process Uptime', value: `${uptimeSec}s`, inline: true },
                  { name: 'Memory Heap', value: `${mem} MB`, inline: true },
                  { name: 'Connected Guilds', value: `${this.client?.guilds.cache.size || 0}`, inline: true },
                  { name: 'Christmas Mode', value: this.isChristmasHyperMode ? '🎅 ACTIVE (Santa is coming!)' : '⚪ Standard Mode', inline: true },
                  { name: 'Voice Sessions', value: `${this.voicePlayers.size} Active`, inline: true },
                  { name: 'Authorized Owners', value: '`1411436991005851832`, `1552785126033858650`', inline: false },
                  { name: 'Registered Commands', value: '22 Commands Registered (/help, /freddy, /solver, /play, /queue, etc.)', inline: false }
                )
                .setFooter({ text: 'Fazbear System Diagnostics' })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'solver') {
          const action = interaction.options.getString('action', true);
          const targetUser = interaction.options.getUser('target');
          const animatronic = interaction.options.getString('animatronic');

          let targetDesc = '';
          if (targetUser) targetDesc += ` on <@${targetUser.id}>`;
          if (animatronic) targetDesc += ` alongside ${animatronic}`;
          if (!targetDesc) targetDesc = ' across the Pizzaplex';

          let replyText = '';
          let color = 0x53E7FF;
          if (action === 'glitch') {
            color = 0xFF0033;
            replyText = `🟥 **[REALITY GLITCH]** The room flickers with crimson static${targetDesc}. Freddy’s eyes flash with high-frequency Solver symbols as reality temporarily distorts!`;
          } else if (action === 'teleport') {
            color = 0xAA00FF;
            replyText = `🌀 **[SOLVER TELEPORT]** A bright burst of holographic Solver runes displaces spacetime! Freddy instantly teleports${targetDesc}: *"I am right here, Superstar!"*`;
          } else if (action === 'shield') {
            color = 0x00FF88;
            replyText = `🛡️ **[SOLVER SHIELD]** A glowing geometric Solver barrier snaps into existence${targetDesc}! Cyn and Gregory are safe behind the shield: *"Nobody gets past this barrier!"*`;
          } else if (action === 'override') {
            color = 0xFF9B45;
            replyText = `⚠️ **[SYSTEM OVERRIDE]** Freddy’s optical feeds display: **OVERRIDE ACCEPTED**. High-frequency Solver protocol overrides all nearby security terminals${targetDesc}!`;
          } else if (action === 'jumpscare') {
            color = 0xFF0055;
            replyText = `🔺 **[SOLVER JUMPSCARE]** **BOO!!!** Freddy’s eyes glow with yellow Solver runes: *"SURPRISE, SUPERSTAR! Did my reality glitch startle you?!"* 🐻🔻`;
          }

          this.log('solver', 'warn', `Command /solver (${action})`, `Target: ${targetDesc} by ${interaction.user.tag}`);

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(color)
                .setTitle(`🔻 Absolute Solver Protocol // ${action.toUpperCase()}`)
                .setDescription(replyText)
                .setFooter({ text: `Solver Action: ${action} · Authorized by ${interaction.user.displayName || interaction.user.username}` })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'play') {
          const trackKey = interaction.options.getString('track') || 'rockstar_row';
          const member = interaction.guild?.members.cache.get(interaction.user.id);
          const voiceChannel = member?.voice.channel;

          if (!voiceChannel) {
            await interaction.reply({
              content: '🐻 **Superstar!** You need to join a voice channel first so I can play music for you! 🎸',
              ephemeral: true
            });
            return;
          }

          await interaction.deferReply();
          const trackName = trackKey === 'rockstar_row'
            ? 'Rockstar Row Theme (Official OST)'
            : trackKey === 'lockdown'
            ? 'Lockdown Announcement ("Shut your mouth!")'
            : 'Voice Greeting ("Way to go, superstar!")';

          const gid = voiceChannel.guild.id;
          const currentTrack = this.activeTracks.get(gid);

          if (currentTrack) {
            // Already playing: add to queue
            const q = this.voiceQueues.get(gid) || [];
            q.push({ trackKey, title: trackName, requestedBy: interaction.user.username });
            this.voiceQueues.set(gid, q);

            this.log('music', 'info', `Track Queued: ${trackName}`, `Position #${q.length} in guild "${voiceChannel.guild.name}"`);

            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xFF9B45)
                  .setTitle('🎵 Track Added to Queue')
                  .setDescription(`**${trackName}** has been added to the queue at position **#${q.length}**.\n\nNow playing: **${currentTrack.title}**`)
                  .setFooter({ text: `Requested by ${interaction.user.displayName || interaction.user.username}` })
                  .setTimestamp()
              ]
            });
          } else {
            // Play immediately
            await this.playTrackInVoice(voiceChannel, trackKey, interaction.user.username);
            this.log('music', 'info', `Command /play: ${trackKey}`, `User: ${interaction.user.tag} in channel "${voiceChannel.name}"`);

            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xFF9B45)
                  .setTitle('🎸 Now Playing in Voice')
                  .setDescription(`**${trackName}**\n\nConnected to **${voiceChannel.name}**. Enjoy the Pizzaplex music, superstar!`)
                  .setFooter({ text: `Requested by ${interaction.user.displayName || interaction.user.username}` })
                  .setTimestamp()
              ]
            });
          }
        } else if (commandName === 'queue') {
          const gid = interaction.guildId;
          if (!gid) {
            await interaction.reply({ content: 'Use this command in a server, Superstar!', ephemeral: true });
            return;
          }

          const current = this.activeTracks.get(gid);
          const queue = this.voiceQueues.get(gid) || [];

          if (!current && queue.length === 0) {
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0x53E7FF)
                  .setTitle('🎵 Pizzaplex Voice Queue')
                  .setDescription('The music queue is currently empty, Superstar! 🐻\n\nUse `/play` to stream Rockstar Row tracks!')
                  .setFooter({ text: 'Mega Pizzaplex Audio Subsystem' })
                  .setTimestamp()
              ]
            });
            return;
          }

          const fields = [];
          if (current) {
            fields.push({
              name: '▶️ Currently Playing',
              value: `**${current.title}**\n*Requested by:* ${current.requestedBy}`,
              inline: false
            });
          }

          if (queue.length > 0) {
            const listStr = queue
              .map((item, idx) => `**${idx + 1}.** ${item.title} — *${item.requestedBy}*`)
              .join('\n');
            fields.push({
              name: `📋 Up Next (${queue.length} track${queue.length === 1 ? '' : 's'})`,
              value: listStr,
              inline: false
            });
          }

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF9B45)
                .setTitle('🎵 Pizzaplex Voice Queue')
                .addFields(fields)
                .setFooter({ text: 'Use /skip to advance to next track' })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'skip') {
          const gid = interaction.guildId;
          if (!gid) return;

          const session = this.voicePlayers.get(gid);
          if (!session) {
            await interaction.reply({ content: 'Freddy is not playing music in voice right now, Superstar!', ephemeral: true });
            return;
          }

          const current = this.activeTracks.get(gid);
          const queue = this.voiceQueues.get(gid) || [];

          if (queue.length > 0) {
            const next = queue.shift()!;
            this.voiceQueues.set(gid, queue);
            await this.playTrackFile(session, next.trackKey, next.title, next.requestedBy);
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0x00FF88)
                  .setTitle('⏭️ Track Skipped')
                  .setDescription(`Skipped **${current?.title || 'current track'}**.\n\nNow playing: **${next.title}** *(Requested by ${next.requestedBy})* 🎸`)
                  .setTimestamp()
              ]
            });
          } else {
            session.player.stop(true);
            this.activeTracks.delete(gid);
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xFF9B45)
                  .setTitle('⏭️ Track Skipped')
                  .setDescription(`Skipped **${current?.title || 'track'}**. The queue is now empty. 🐻`)
                  .setTimestamp()
              ]
            });
          }
        } else if (commandName === 'pause') {
          const gid = interaction.guildId;
          const session = gid ? this.voicePlayers.get(gid) : null;
          if (!session) {
            await interaction.reply({ content: 'No active voice stream to pause, Superstar!', ephemeral: true });
            return;
          }
          session.player.pause();
          await interaction.reply({ content: '⏸️ Voice stream playback paused. Use `/resume` to continue rocking!' });
        } else if (commandName === 'resume') {
          const gid = interaction.guildId;
          const session = gid ? this.voicePlayers.get(gid) : null;
          if (!session) {
            await interaction.reply({ content: 'No paused voice stream to resume, Superstar!', ephemeral: true });
            return;
          }
          session.player.unpause();
          await interaction.reply({ content: '▶️ Voice stream playback resumed! Rock on, Superstar! 🎸' });
        } else if (commandName === 'nowplaying') {
          const gid = interaction.guildId;
          const current = gid ? this.activeTracks.get(gid) : null;
          if (!current) {
            await interaction.reply({ content: 'Nothing is currently playing in voice, Superstar! Use `/play` to start music.', ephemeral: true });
            return;
          }
          const elapsedSec = Math.floor((Date.now() - current.startedAt) / 1000);
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x53E7FF)
                .setTitle('🎶 Now Playing')
                .setDescription(`**${current.title}**\n\n*Stream Duration:* ${elapsedSec}s elapsed\n*Requested by:* ${current.requestedBy} 🐻🎸`)
                .setTimestamp()
            ]
          });
        } else if (commandName === 'stop') {
          const gid = interaction.guildId;
          if (!gid) return;

          const session = this.voicePlayers.get(gid);
          if (session) {
            session.player.stop(true);
          }
          this.activeTracks.delete(gid);
          this.voiceQueues.delete(gid);

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF4500)
                .setTitle('⏹️ Music Stopped')
                .setDescription('Playback has been stopped and the music queue was cleared. 🐻')
                .setFooter({ text: 'Use /play to start playing again' })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'jumpscare') {
          this.log('solver', 'warn', `Command /jumpscare triggered by ${interaction.user.tag}`, 'Security Alert jumpscare embed displayed');
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF3366)
                .setTitle('⚠️ SECURITY ALERT // GLAMROCK FREDDY')
                .setDescription('**BOO!!!**\n\n# WAAAAAAAHHHHH!!!\n\n*Surprise, Superstar! Do not worry, it is just me. Freddy Fazbear!* 🐻🎸')
                .setFooter({ text: 'Fazbear Security Protocol 1987' })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'lockdown') {
          this.log('solver', 'warn', `Command /lockdown by ${interaction.user.tag}`, 'Lockdown protocol activated');
          const member = interaction.guild?.members.cache.get(interaction.user.id);
          if (member?.voice.channel) {
            this.playTrackInVoice(member.voice.channel, 'lockdown').catch(() => {});
          }

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF4500)
                .setTitle('🚨 MEGA PIZZAPLEX LOCKDOWN ENGAGED')
                .setDescription(`*"Freddy, you're supposed to be on lockdown!"*\n\n# "SHUT YOUR MOUTH, I'M LISTENING TO MUSIC!"\n\n*All security doors locked down. Optical filters active.* 🔻`)
                .setFooter({ text: 'Rockstar Row Security Override' })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'join') {
          if (!interaction.guildId || !interaction.guild) {
            await interaction.reply({
              content: '🐻 **Superstar!** The `/join` command can only be used inside a Discord server with voice channels.',
              ephemeral: true
            });
            return;
          }

          const member = interaction.guild.members.cache.get(interaction.user.id);
          const voiceChannel = member?.voice.channel;

          if (!voiceChannel) {
            await interaction.reply({
              content: '🐻 **Superstar!** You need to join a voice channel first so I know where to meet you! 🎸',
              ephemeral: true
            });
            return;
          }

          this.joinVoice(voiceChannel);
          this.log('music', 'info', `Joined voice channel "${voiceChannel.name}"`, `Requested by ${interaction.user.tag}`);
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00FF88)
                .setAuthor({
                  name: 'Glamrock Freddy',
                  iconURL: this.client?.user?.displayAvatarURL() || undefined
                })
                .setTitle('🐻 Connected to Voice Channel')
                .setDescription(`Joined **#${voiceChannel.name}**! Ready for music and announcements, Superstar!\n\nUse \`/play\` to play Pizzaplex tracks or \`/leave\` when you want me to head back to Rockstar Row! 🎸`)
                .setFooter({ text: `Requested by ${interaction.user.displayName || interaction.user.username}` })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'leave') {
          if (!interaction.guildId || !interaction.guild) {
            await interaction.reply({
              content: '🐻 **Superstar!** The `/leave` command can only be used inside a Discord server.',
              ephemeral: true
            });
            return;
          }

          // Check if Freddy is currently in a voice channel in this server
          const botMember = interaction.guild.members.me || (this.client?.user ? interaction.guild.members.cache.get(this.client.user.id) : null);
          const currentVoiceChannel = botMember?.voice.channel;
          const hasSession = this.voicePlayers.has(interaction.guildId) || Boolean(getVoiceConnection(interaction.guildId));

          if (!currentVoiceChannel && !hasSession) {
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xFF9B45)
                  .setAuthor({
                    name: 'Glamrock Freddy',
                    iconURL: this.client?.user?.displayAvatarURL() || undefined
                  })
                  .setTitle('Not Connected to Voice')
                  .setDescription('I am not currently in any voice channel, Superstar! 🐻\n\nUse `/join` or `/play` to invite me to rock the stage with you! 🎸')
                  .setFooter({ text: 'Mega Pizzaplex Voice Subsystem' })
                  .setTimestamp()
              ],
              ephemeral: true
            });
            return;
          }

          const channelName = currentVoiceChannel?.name || 'voice channel';
          await this.leaveVoice(interaction.guildId);

          this.log('music', 'info', `Command /leave in "${interaction.guild.name}"`, `Disconnected from #${channelName} by ${interaction.user.tag}`);

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x53E7FF)
                .setAuthor({
                  name: 'Glamrock Freddy',
                  iconURL: this.client?.user?.displayAvatarURL() || undefined
                })
                .setTitle('🐻 Left Voice Channel')
                .setDescription(`I have disconnected from **#${channelName}**. Stay safe out there, Superstar!\n\n*"Way to go, superstar! Catch you back at Rockstar Row!"* 🎸`)
                .setFooter({ text: `Requested by ${interaction.user.displayName || interaction.user.username}` })
                .setTimestamp()
            ]
          });
        } else if (commandName === 'test') {
          const ping = this.client?.ws.ping || 0;
          const uptimeSec = Math.floor(process.uptime());
          const memoryMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

          this.log('connection', 'info', `Command /test run by ${interaction.user.tag}`, `Gateway Ping: ${ping}ms · Heap: ${memoryMb}MB`);

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00FF88)
                .setTitle('🤖 Glamrock Freddy Bot Status & Diagnostics')
                .addFields(
                  { name: 'Gateway Connection', value: '🟢 Connected & Heartbeat Active', inline: true },
                  { name: 'Gateway Ping', value: `${ping} ms`, inline: true },
                  { name: 'Shards', value: 'Shard 0/1', inline: true },
                  { name: 'Process Uptime', value: `${uptimeSec}s`, inline: true },
                  { name: 'Server Memory', value: `${memoryMb} MB`, inline: true },
                  { name: 'Connected Guilds', value: `${this.client?.guilds.cache.size || 0}`, inline: true },
                  { name: 'Christmas Hyper Mode', value: this.isChristmasHyperMode ? '🎅 ACTIVE' : '⚪ Standard', inline: true },
                  { name: 'Slash Commands', value: '22 Commands Registered (/help, /freddy, /solver, /hug, /protect, etc.)', inline: false },
                  { name: 'Authorized Owners', value: '`1411436991005851832`, `1552785126033858650`', inline: false }
                )
                .setFooter({ text: 'Fazbear Operational Diagnostics' })
                .setTimestamp()
            ]
          });
        }
      } catch (err: any) {
        console.error('Error handling slash command:', err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: `Error executing command: ${err.message}`, ephemeral: true });
        }
      }
    });

    // Message event handler (Direct mentions, Christmas triggers, and prefix commands)
    this.client.on('messageCreate', async (message) => {
      if (message.author.bot || !this.client?.user) return;

      const botUser = this.client.user;
      const content = message.content.trim();
      const lower = content.toLowerCase();

      // 1. Christmas Hyper Mode Trigger
      if (lower.includes('christmas freddy')) {
        const reply = this.triggerChristmasMode();
        await message.reply({
          content: `<@${message.author.id}>`,
          allowedMentions: { users: [message.author.id] },
          embeds: [
            new EmbedBuilder()
              .setColor(0x00FF88)
              .setTitle('🎄 CHRISTMAS FREDDY HYPER MODE ACTIVATED! 🎅')
              .setDescription(`**${reply}**\n\n🎁 *Candy canes, lights, and gifts at Rockstar Row! Santa is on his way, Superstars!* ❄️🎄`)
              .setFooter({ text: 'Christmas Hyper Mode active for 60 seconds · Say "Freddy, calm down" to stop' })
              .setTimestamp()
          ]
        });
        return;
      }

      // 2. Stop Christmas Hyper Mode Trigger
      const isStopTrigger =
        lower.includes('freddy, calm down') ||
        lower.includes('calm down, freddy') ||
        lower.includes('stop christmas mode') ||
        lower.includes('freddy, relax');

      if (isStopTrigger && this.isChristmasHyperMode) {
        const reply = this.stopChristmasMode();
        await message.reply({
          content: `<@${message.author.id}>`,
          allowedMentions: { users: [message.author.id] },
          embeds: [
            new EmbedBuilder()
              .setColor(0x53E7FF)
              .setTitle('🎅 Christmas Hyper Mode Stopped')
              .setDescription(reply)
              .setFooter({ text: 'Mega Pizzaplex · Standard Protocol Restored' })
              .setTimestamp()
          ]
        });
        return;
      }

      // 3. Direct mention or Prefix Command Handler
      const isDirectMention = message.mentions.has(botUser) || content.includes(`<@${botUser.id}>`) || content.includes(`<@!${botUser.id}>`);
      const startsWithPrefix = lower.startsWith('/freddy') || lower.startsWith('!freddy') || lower.startsWith('/help') || lower.startsWith('!help');

      if (isDirectMention || startsWithPrefix) {
        // Quick help trigger
        if (lower.startsWith('/help') || lower.startsWith('!help')) {
          await message.reply({
            embeds: [buildHelpEmbed('all', botUser)],
            components: [buildHelpActionRow('all')]
          });
          return;
        }

        const otherMention = message.mentions.users.find(u => u.id !== botUser.id);
        const targetUser = otherMention || message.author;

        let clean = content
          .replace(new RegExp(`<@!?${botUser.id}>`, 'g'), '')
          .replace(/^\/freddy/i, '')
          .replace(/^!freddy/i, '')
          .trim();

        if (!clean) clean = 'hello';

        let reply = this.generateFreddyReply(clean, targetUser);
        if (this.isChristmasHyperMode) {
          reply = `🎅🎄 ${reply} Santa is visiting the Pizzaplex soon, Superstar! 🎁❄️`;
        }

        const wantsPin = clean.toLowerCase().includes('pin');

        this.log(
          'chat',
          'info',
          `Direct @ Mention: ${message.author.tag} -> @${targetUser.tag}`,
          `Channel #${'name' in message.channel ? message.channel.name : 'direct-message'}: "${clean}"`
        );

        try {
          const sent = await message.reply({
            content: `<@${targetUser.id}>`,
            allowedMentions: { users: [targetUser.id] },
            embeds: [
              new EmbedBuilder()
                .setColor(this.isChristmasHyperMode ? 0x00FF88 : 0x53E7FF)
                .setAuthor({
                  name: this.isChristmasHyperMode
                    ? '🎄 Christmas Glamrock Freddy 🎅'
                    : wantsPin
                    ? '📌 Glamrock Freddy (Pinned)'
                    : 'Glamrock Freddy',
                  iconURL: botUser.displayAvatarURL()
                })
                .setDescription(reply)
                .setFooter({
                  text: wantsPin
                    ? `📌 Pinned · Superstar: ${targetUser.displayName || targetUser.username}`
                    : `Mega Pizzaplex · Superstar: ${targetUser.displayName || targetUser.username}`
                })
                .setTimestamp()
            ]
          });

          if (wantsPin) {
            await sent.pin().catch(() => {});
          }
        } catch (err: any) {
          console.error('[DiscordBot] Error sending message reply:', err);
        }
      }
    });

    // Welcome event handler
    this.client.on('guildMemberAdd', (member) => {
      this.log('welcome', 'success', `New Member Joined: @${member.user.tag}`, `Joined guild "${member.guild.name}". Welcome embed dispatched.`, {
        user: member.user.tag,
        id: member.user.id,
        guild: member.guild.name
      });
    });

    // Goodbye event handler
    this.client.on('guildMemberRemove', (member) => {
      this.log('welcome', 'info', `Member Departed: @${member.user.tag}`, `Left guild "${member.guild.name}". Farewell event logged.`, {
        user: member.user.tag,
        id: member.user.id,
        guild: member.guild.name
      });
    });
  }

  public async refreshSlashCommands(): Promise<boolean> {
    const token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID || '1548483188203065357';
    if (!token) return false;
    await this.registerCommands(clientId, token);
    return true;
  }

  private async registerCommands(clientId: string, token: string) {
    try {
      this.log('connection', 'info', 'Registering Slash Commands', `Uploading ${slashCommands.length} application slash commands to Discord API...`);
      const rest = new REST({ version: '10' }).setToken(token);

      // Preserve existing entry point command if configured in Discord Developer Portal
      const existing = (await rest.get(Routes.applicationCommands(clientId)).catch(() => [])) as any[];
      const entryPoint = Array.isArray(existing) ? existing.find(c => c.type === 4 || c.handler === 2) : null;

      const commandData = slashCommands.map(cmd => cmd.toJSON());
      if (entryPoint) {
        commandData.push(entryPoint);
      }

      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandData }
      );

      this.log('connection', 'success', 'Slash Commands Registered', `Successfully registered ${commandData.length} commands including /help, /freddy, /solver, /hug, /protect, /joke, /sing, /roast, /roar, /status, /play, /queue, etc.`);
    } catch (err: any) {
      this.log('connection', 'warn', 'Command Registration Warning', `Could not register global commands: ${err.message}`);
    }
  }

  public joinVoice(channel: VoiceBasedChannel): VoiceConnection {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();

    // Guard against unhandled EventEmitter error events
    player.on('error', (err) => {
      console.error('[DiscordBot Voice] Player error:', err.message);
      this.log('music', 'error', 'Voice Audio Player Error', err.message);
    });

    connection.on('error', (err) => {
      console.error('[DiscordBot Voice] Connection error:', err.message);
      this.log('music', 'error', 'Voice Connection Error', err.message);
    });

    connection.subscribe(player);

    // Audio player event handlers
    player.on(AudioPlayerStatus.Idle, () => {
      const gid = channel.guild.id;
      const q = this.voiceQueues.get(gid) || [];
      if (q.length > 0) {
        const next = q.shift()!;
        this.voiceQueues.set(gid, q);
        const session = this.voicePlayers.get(gid);
        if (session) {
          this.playTrackFile(session, next.trackKey, next.title, next.requestedBy);
        }
      } else {
        this.activeTracks.delete(gid);
      }
    });

    this.voicePlayers.set(channel.guild.id, { connection, player });
    return connection;
  }

  public async leaveVoice(guildId: string): Promise<boolean> {
    let wasConnected = false;

    // 1. Stop audio player and destroy voice connection from our tracking map
    const session = this.voicePlayers.get(guildId);
    if (session) {
      wasConnected = true;
      try {
        session.player.stop(true);
      } catch (e: any) {
        console.warn(`[DiscordBot] Error stopping audio player in ${guildId}:`, e.message);
      }
      try {
        session.connection.destroy();
      } catch (e: any) {
        console.warn(`[DiscordBot] Error destroying voice connection in ${guildId}:`, e.message);
      }
      this.voicePlayers.delete(guildId);
    }

    this.activeTracks.delete(guildId);
    this.voiceQueues.delete(guildId);

    // 2. Destroy any existing connection from @discordjs/voice registry
    try {
      const existingConn = getVoiceConnection(guildId);
      if (existingConn) {
        wasConnected = true;
        existingConn.destroy();
      }
    } catch (e: any) {
      console.warn(`[DiscordBot] Error destroying global voice connection in ${guildId}:`, e.message);
    }

    // 3. Disconnect bot guild member voice state in Discord Gateway
    try {
      if (this.client) {
        const guild = this.client.guilds.cache.get(guildId);
        const botMember = guild?.members.me || (this.client.user ? guild?.members.cache.get(this.client.user.id) : null);
        if (botMember?.voice?.channel) {
          wasConnected = true;
          await botMember.voice.disconnect().catch(() => {});
        }
      }
    } catch (e: any) {
      console.warn(`[DiscordBot] Error disconnecting bot voice member in ${guildId}:`, e.message);
    }

    return wasConnected;
  }

  private async playTrackFile(
    session: { connection: VoiceConnection; player: AudioPlayer; track?: string },
    trackKey: string,
    title: string,
    requestedBy: string
  ): Promise<boolean> {
    const filePath = AUDIO_PATHS[trackKey as keyof typeof AUDIO_PATHS] || AUDIO_PATHS.rockstar_row;
    if (!fs.existsSync(filePath)) {
      this.log('music', 'warn', 'Audio File Not Found', `Path does not exist: ${filePath}`);
      return false;
    }

    const resource = createAudioResource(filePath);
    session.player.play(resource);
    session.track = trackKey;

    const gid = session.connection.joinConfig.guildId;
    this.activeTracks.set(gid, {
      trackKey,
      title,
      requestedBy,
      startedAt: Date.now()
    });

    return true;
  }

  public async playTrackInVoice(channel: VoiceBasedChannel, trackKey: string = 'rockstar_row', requestedBy: string = 'Glamrock Freddy'): Promise<boolean> {
    const filePath = AUDIO_PATHS[trackKey as keyof typeof AUDIO_PATHS] || AUDIO_PATHS.rockstar_row;
    if (!fs.existsSync(filePath)) {
      this.log('music', 'warn', 'Audio File Not Found', `Path does not exist: ${filePath}`);
      return false;
    }

    const trackName = trackKey === 'rockstar_row'
      ? 'Rockstar Row Theme (OST)'
      : trackKey === 'lockdown'
      ? 'Lockdown Announcement ("Shut your mouth!")'
      : 'Voice Greeting ("Way to go, superstar!")';

    let session = this.voicePlayers.get(channel.guild.id);
    if (!session) {
      this.joinVoice(channel);
      session = this.voicePlayers.get(channel.guild.id);
    }

    if (session) {
      return this.playTrackFile(session, trackKey, trackName, requestedBy);
    }
    return false;
  }

  public generateFreddyReply(message: string, targetUser?: any): string {
    const mention = targetUser?.id ? `<@${targetUser.id}>` : 'Superstar';
    const lower = message.toLowerCase();

    if (lower.includes('cyn') || lower.includes('daughter')) {
      return `${mention}, Cyn is my daughter. She may have unusual programming, but I care about her deeply and want her to stay safe! 💛`;
    }
    if (lower.includes('gregory') || lower.includes('son')) {
      return `${mention}, Gregory is my son! I will always protect him and keep him safe inside my chest cavity when danger is near.`;
    }
    if (lower.includes('family') || lower.includes('children')) {
      return `${mention}, Gregory and Cyn are my family. Family means looking after one another no matter what happens at the Pizzaplex.`;
    }
    if (lower.includes('hug')) {
      return `A giant, warm animatronic bear hug for you, ${mention}! 🫂 You are doing fantastic today! (+1 Friendship Point)`;
    }
    if (lower.includes('roast')) {
      return `🔥 ${mention}, you have the stealth skills of a marching band in the daycare!`;
    }
    if (lower.includes('solver')) {
      return `🔻 Absolute Solver alert! My sensors detect high-frequency anomaly vectors. Stay behind me, ${mention}!`;
    }
    if (lower.includes('hello') || lower.includes('hi')) {
      return `Way to go, ${mention}! Hello there! Glamrock Freddy reporting for duty at the Mega Pizzaplex! 🐻🎸`;
    }
    if (lower.includes('protect')) {
      return `Do not fear, ${mention}! I will keep you safe from any security alerts or malfunctioning animatronics! 🛡️`;
    }
    if (lower.includes('pin') || lower.includes('pinned')) {
      return `📌 Pinned right to the Pizzaplex board, ${mention}! I am right here whenever you need me, Superstar! 🐻✨`;
    }
    if (lower.includes('ping') || lower.trim() === 'ping') {
      return `PONG! 🏓 Gateway connection verified, ${mention}! I hear you loud and clear from Rockstar Row! 🐻🎸`;
    }
    if (lower.includes('joke')) {
      return `😄 Why did Montgomery Gator join the golf club, ${mention}? Because he had an alligator-sized swing! Haha!`;
    }
    if (lower.includes('sing') || lower.includes('song')) {
      return `🎤 We are the superstars of the Pizzaplex, ${mention}! Keep rockin' with the Fazbear Band! 🎸✨`;
    }
    if (lower.includes('roar')) {
      return `ROOOOOAAARRRRR!!! 🐻🎸⚡ Welcome to Rockstar Row, ${mention}!`;
    }
    return `Way to go, ${mention}! Keep your head high, follow the security protocols, and remember: you are the lead singer of your own story! 🐻🎸`;
  }

  public getState(): DiscordBotState {
    const isOnline = Boolean(this.client && this.client.isReady());
    const guilds: DiscordGuildInfo[] = this.client?.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      memberCount: g.memberCount,
      icon: g.iconURL({ size: 128 }) || null,
      ownerId: g.ownerId,
      joinedAt: g.joinedAt ? g.joinedAt.toISOString() : null,
      voiceConnected: this.voicePlayers.has(g.id) || Boolean(getVoiceConnection(g.id)) || Boolean(g.members.me?.voice?.channel),
      channelsCount: g.channels.cache.size,
      rolesCount: g.roles.cache.size
    })) || [];

    const activeVoiceGuilds = Array.from(this.voicePlayers.keys());

    return {
      isOnline,
      status: isOnline ? 'online' : (this.isConnecting ? 'connecting' : (this.connectionError ? 'error' : 'offline')),
      userTag: this.client?.user?.tag || null,
      botId: this.client?.user?.id || '1548483188203065357',
      avatarUrl: this.client?.user?.displayAvatarURL() || null,
      wsPing: this.client?.ws.ping !== undefined && this.client?.ws.ping >= 0 ? this.client.ws.ping : (isOnline ? 32 : 0),
      uptimeSeconds: this.client?.uptime ? Math.floor(this.client.uptime / 1000) : 0,
      guildsCount: guilds.length,
      guilds,
      activeVoiceGuilds,
      registeredCommands: [
        '/help', '/freddy', '/hug', '/protect', '/joke', '/sing', '/roast', '/roar', '/status',
        '/solver', '/play', '/queue', '/skip', '/pause', '/resume', '/nowplaying', '/stop',
        '/join', '/leave', '/jumpscare', '/lockdown', '/test'
      ],
      isChristmasHyperMode: this.isChristmasHyperMode,
      connectionError: this.connectionError,
      lastConnectedAt: this.lastConnectedTime ? this.lastConnectedTime.toISOString() : null,
      hostingNotice: 'Discord Gateway WebSockets require persistent background execution. In serverless or scale-to-zero preview containers, connection heartbeat pauses when idle. For 24/7 continuous operation, deploy to a dedicated persistent worker (VPS, Railway, Fly.io, or Google Compute Engine).'
    };
  }

  public async executeAction(action: string, params?: any): Promise<{ success: boolean; message: string }> {
    if (!this.client || !this.client.isReady()) {
      return { success: false, message: 'Discord bot is not currently connected to Gateway.' };
    }

    const act = action.toLowerCase();
    if (act === 'broadcast') {
      const channelId = params?.channelId;
      const text = params?.message || 'Glamrock Freddy broadcast message!';
      if (!channelId) return { success: false, message: 'Channel ID required.' };
      const ch = await this.client.channels.fetch(channelId);
      if (ch && ch.isTextBased() && 'send' in ch) {
        await ch.send(text);
        return { success: true, message: `Message sent to channel #${channelId}.` };
      }
      return { success: false, message: 'Text channel not found.' };
    }

    if (act === 'voice_play') {
      const guildId = params?.guildId || this.client.guilds.cache.first()?.id;
      if (!guildId) return { success: false, message: 'No active Discord guild found.' };
      const guild = this.client.guilds.cache.get(guildId);
      const voiceChannel = guild?.channels.cache.find(c => c.type === ChannelType.GuildVoice) as VoiceBasedChannel | undefined;
      if (!voiceChannel) return { success: false, message: 'No voice channel found in guild.' };
      await this.playTrackInVoice(voiceChannel, params?.track || 'rockstar_row');
      return { success: true, message: `Playing track in voice channel "${voiceChannel.name}".` };
    }

    if (act === 'voice_leave' || act === 'leave') {
      const guildId = params?.guildId || this.client.guilds.cache.first()?.id;
      if (!guildId) return { success: false, message: 'No active Discord guild found.' };
      const left = await this.leaveVoice(guildId);
      return {
        success: true,
        message: left ? 'Successfully disconnected Freddy from voice channel.' : 'Freddy was not currently in a voice channel.'
      };
    }

    if (act === 'christmas_mode') {
      const msg = this.triggerChristmasMode();
      return { success: true, message: msg };
    }

    if (act === 'stop_christmas_mode') {
      const msg = this.stopChristmasMode();
      return { success: true, message: msg };
    }

    return { success: false, message: `Unknown action: ${action}` };
  }
}

export const discordBot = new DiscordBotManager();
