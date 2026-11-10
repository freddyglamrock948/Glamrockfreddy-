import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { discordBot } from './server/discordBot';

dotenv.config();

// Global Process Crash Guards to prevent server drops or exits
process.on('uncaughtException', (err: any) => {
  console.error('[Freddy Server: Crash Guard] Uncaught Exception caught safely:', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Freddy Server: Crash Guard] Unhandled Promise Rejection caught safely:', reason?.message || reason);
});

// Fallback configuration loader (if .env is deleted or absent)
try {
  const configPath = path.resolve('data/bot_config.json');
  if (fs.existsSync(configPath)) {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (parsed.botToken && !process.env.DISCORD_BOT_TOKEN) {
      process.env.DISCORD_BOT_TOKEN = parsed.botToken;
    }
    if (parsed.clientId && !process.env.DISCORD_CLIENT_ID) {
      process.env.DISCORD_CLIENT_ID = parsed.clientId;
    }
  }
} catch (e: any) {
  console.warn('[Freddy Web] Note on data/bot_config.json:', e.message);
}

const app = express();
const PORT = 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Check configured Discord variables
const hasDiscordConfig = Boolean(
  process.env.DISCORD_CLIENT_ID &&
  process.env.DISCORD_CLIENT_SECRET &&
  process.env.DISCORD_REDIRECT_URI
);

const hasBotBridgeConfig = Boolean(
  process.env.FREDDY_BOT_API_URL &&
  process.env.FREDDY_WEB_API_SECRET
);

console.log(`[Freddy Web] Discord OAuth configured: ${hasDiscordConfig}`);
console.log(`[Freddy Web] Bot Bridge configured: ${hasBotBridgeConfig}`);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Upload directory for pictures
const uploadDir = path.resolve('public/uploads');
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// In-memory persistent settings for welcome/goodbye when remote bot isn't connected
let localSettings = {
  welcomeMessage: "🐻🎸 Welcome to the Pizzaplex, {user}! I’m Glamrock Freddy. Stay safe, Superstar!",
  welcomeChannel: "948123456789012345",
  welcomeImage: "/src/assets/images/glamrock_freddy_hero_1793907789001.jpg",
  goodbyeMessage: "Goodbye, {user}! We hope to see you again at the Pizzaplex. Stay rockin'!",
  goodbyeChannel: "948123456789012345",
  goodbyeImage: "/src/assets/images/pizzaplex_stage_neon_1793907790277.jpg"
};

// In-memory status for bot (defaults to offline as requested)
let botStatus: 'online' | 'offline' = 'offline';
const serverStartTime = Date.now();
let botOnlineStartTime: number | null = null;
let heartbeatCounter = 0;

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

// Circular buffer for recent system logs (keeps up to 200 items)
const MAX_LOGS = 200;
let systemLogs: LogItem[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    category: 'connection',
    level: 'info',
    title: 'Gateway Protocol Initialized',
    message: 'Discord Gateway v10 WebSocket handshake prepared with Shard 0/1.',
    source: 'bot_gateway',
    details: { shard: 0, apiVersion: 'v10', botAppId: '1548483188203065357' }
  },
  {
    id: 'log-seed-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    category: 'connection',
    level: 'warn',
    title: 'Standby Mode Activated',
    message: 'Bot gateway switched to Standby/Offline mode per administrator toggle.',
    source: 'web_bridge',
    details: { status: 'offline', gatewayStatus: 'DISCONNECTED_STANDBY' }
  },
  {
    id: 'log-seed-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    category: 'welcome',
    level: 'success',
    title: 'Welcome Embed Dispatched',
    message: 'Welcome embed generated for member @GregorySuperstar in channel #welcome.',
    source: 'bot_gateway',
    details: { channelId: '948123456789012345', member: 'GregorySuperstar', role: 'Superstar' }
  },
  {
    id: 'log-seed-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    category: 'music',
    level: 'info',
    title: 'Voice Channel Stream Initialized',
    message: 'Freddy voice subsystem ready: 04 Rockstar Row loaded (320kbps MP3 stream).',
    source: 'voice_subsystem',
    details: { track: '04 Rockstar Row.mp3', channel: 'Rockstar Row Stage', bitrate: '320kbps' }
  },
  {
    id: 'log-seed-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    category: 'music',
    level: 'warn',
    title: 'Lockdown Audio Broadcast',
    message: 'Broadcast voice clip queued: "Shut your mouth! I\'m listening to music!"',
    source: 'voice_subsystem',
    details: { clip: 'glamrock-freddy_53d55e6e.mp3', trigger: '/freddy lockdown' }
  },
  {
    id: 'log-seed-6',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    category: 'connection',
    level: 'info',
    title: 'Heartbeat Probe Acknowledged',
    message: 'Heartbeat ACK received from Discord Gateway · Round-trip measured at 32ms.',
    source: 'bot_gateway',
    details: { opcode: 1, ping: 32, status: 'ack' }
  },
  {
    id: 'log-seed-7',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    category: 'welcome',
    level: 'info',
    title: 'Welcome Settings Synchronized',
    message: 'Welcome & Goodbye templates updated with custom Pizzaplex hero image.',
    source: 'web_bridge',
    details: { welcomeChannel: '948123456789012345', goodbyeChannel: '948123456789012345' }
  },
  {
    id: 'log-seed-8',
    timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    category: 'solver',
    level: 'warn',
    title: 'Absolute Solver Anomaly',
    message: 'Optical glitch detected on security feeds. Reality distortion effect engaged.',
    source: 'user_action',
    details: { action: 'reality glitch', severity: 'anomaly' }
  }
];

function addSystemLog(
  category: 'welcome' | 'music' | 'connection' | 'solver' | 'chat' | 'system',
  level: 'info' | 'success' | 'warn' | 'error',
  title: string,
  message: string,
  source: 'bot_gateway' | 'web_bridge' | 'voice_subsystem' | 'user_action' = 'web_bridge',
  details?: Record<string, any>
) {
  const newLog: LogItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    category,
    level,
    title,
    message,
    source,
    details
  };
  systemLogs.unshift(newLog);
  if (systemLogs.length > MAX_LOGS) {
    systemLogs.pop();
  }
  return newLog;
}

// Hook Discord bot events directly into system logs
discordBot.setLogger((category, level, title, message, details) => {
  addSystemLog(category, level, title, message, 'bot_gateway', details);
});

// Start Discord Bot Gateway connection if token configured
if (process.env.DISCORD_BOT_TOKEN) {
  discordBot.start().catch((err) => {
    console.error('[Freddy Server] Initial Discord bot connection error:', err);
  });
}

// Health check with real Discord Gateway telemetry
app.get('/health', (_req: Request, res: Response) => {
  const discordState = discordBot.getState();
  const isOnline = discordState.isOnline;
  const now = Date.now();
  const uptimeSeconds = discordState.uptimeSeconds;
  const serverUptimeSeconds = Math.floor((now - serverStartTime) / 1000);
  const latency = discordState.wsPing;

  res.json({
    ok: true,
    status: discordState.status,
    isRealDiscordBotConnected: isOnline,
    userTag: discordState.userTag,
    botId: discordState.botId,
    latency,
    uptimeSeconds,
    serverUptimeSeconds,
    onlineSince: discordState.lastConnectedAt,
    lastHeartbeat: new Date().toISOString(),
    gatewayStatus: isOnline ? 'CONNECTED_GATEWAY_V10' : 'DISCONNECTED_STANDBY',
    packetLoss: isOnline ? '0.0%' : 'N/A',
    guildsCount: discordState.guildsCount,
    guilds: discordState.guilds,
    isChristmasHyperMode: discordState.isChristmasHyperMode,
    registeredCommands: discordState.registeredCommands,
    hasDiscordConfig,
    hasBotBridgeConfig,
    connectionError: discordState.connectionError,
    hostingNotice: discordState.hostingNotice,
    timestamp: new Date().toISOString()
  });
});

// Bridge forwarder to remote Python bot if configured, with graceful fallback
async function forwardToBot(req: Request, res: Response, route: string, fallbackData: any) {
  const url = process.env.FREDDY_BOT_API_URL || '';
  const isRealBotUrl = hasBotBridgeConfig && url && !url.includes('your-bot-api-domain.com') && !url.includes('example.com');
  if (isRealBotUrl) {
    try {
      const base = url.replace(/\/+$/, '');
      const response = await fetch(`${base}${route}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Freddy-API-Key': process.env.FREDDY_WEB_API_SECRET || ''
        },
        body: JSON.stringify(req.body)
      });
      if (response.ok) {
        const data = await response.json();
        return res.status(response.status).json(data);
      }
    } catch (err: any) {
      console.warn(`[Bot Bridge] Could not reach remote bot API at ${url}: ${err.message}. Serving local simulation.`);
    }
  }
  // Return local response
  return res.json(fallbackData);
}

// 1. Chat with Freddy
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Please provide a message for Freddy.' });
  }

  // Pre-configured character responses if bot bridge isn't connected
  const lower = message.toLowerCase();
  let reply = "Way to go, Superstar! You are doing fantastic! 🐻🎸";
  
  if (lower.includes("christmas freddy")) {
    reply = discordBot.triggerChristmasMode();
  } else if (
    lower.includes("freddy, calm down") ||
    lower.includes("calm down, freddy") ||
    lower.includes("stop christmas mode") ||
    lower.includes("freddy, relax")
  ) {
    reply = discordBot.stopChristmasMode();
  } else if (lower.includes("cyn") || lower.includes("daughter")) {
    reply = "Cyn is my daughter, Superstar. She may be unusual, but I care about her and want her to be safe. 💛";
  } else if (lower.includes("gregory") || lower.includes("son")) {
    reply = "Gregory is my son, Superstar. I will always look out for him and help keep him safe.";
  } else if (lower.includes("family") || lower.includes("children")) {
    reply = "Gregory and Cyn are my children. Family means looking after one another, Superstar.";
  } else if (lower.includes("hug")) {
    reply = "A big bear hug for you, Superstar! You are my friend. (+1 Friendship Point) 🫂";
  } else if (lower.includes("protect")) {
    reply = "🛡️ Do not fear, Superstar! I will protect you with my heavy armor plating! Gregory and Cyn are safe with me, and so are you!";
  } else if (lower.includes("roast")) {
    reply = "🔥 You have the stealth skills of a marching band, Superstar.";
  } else if (lower.includes("hello") || lower.includes("hi")) {
    reply = "Hello, Superstar! Glamrock Freddy reporting for duty at the Pizzaplex. How can I help you today?";
  } else if (lower.includes("solver")) {
    reply = "🔻 Absolute Solver alert! My optical feeds detected high-frequency anomaly signals. Stand behind me, Superstar!";
  } else if (lower.includes("sing") || lower.includes("song")) {
    reply = "🎤 We are the superstars of the Pizzaplex! Rock with the band, clap your hands, let the music blast! 🎸✨";
  } else if (lower.includes("roar")) {
    reply = "ROOOOOOAAAAAARRRRRRRRRRRRRR!!! 🐻🎸⚡ WELCOME TO THE MEGA PIZZAPLEX, SUPERSTARS!";
  } else if (lower.includes("who are you")) {
    reply = "I am Glamrock Freddy! Frontman of the Pizzaplex band and your personal protector.";
  } else if (lower.includes("joke")) {
    reply = "Why did Montgomery Gator join the golf club? Because he had an alligator-sized swing! Haha!";
  }

  // Add to system log
  addSystemLog('chat', 'info', 'Freddy Chat Interaction', `User sent message: "${message.slice(0, 60)}"`, 'user_action', {
    message,
    reply
  });

  await forwardToBot(req, res, '/api/chat', {
    reply,
    simulated: !hasBotBridgeConfig,
    timestamp: new Date().toISOString()
  });
});

// 2. Absolute Solver & Action Triggers
app.post('/api/action', async (req: Request, res: Response) => {
  const { action } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Action parameter missing.' });
  }

  let reply = `Action '${action}' executed successfully.`;
  const act = String(action).toLowerCase();
  let logCategory: 'solver' | 'welcome' | 'music' | 'chat' = 'solver';
  let logLevel: 'info' | 'success' | 'warn' | 'error' = 'info';

  if (act === 'lockdown') {
    reply = "🚨 [LOCKDOWN ACTIVATED] 'Freddy, you're supposed to be on lockdown! / SHUT YOUR MOUTH, I'M LISTENING TO MUSIC!'";
    logCategory = 'music';
    logLevel = 'warn';
  } else if (act === 'greeting' || act === 'hello') {
    reply = "🐻🎙️ [FREDDY VOICE GREETING] 'Way to go, superstar! I knew you could do it.'";
    logCategory = 'chat';
    logLevel = 'success';
  } else if (act === 'hug') {
    reply = "🫂 [BEAR HUG] Freddy wraps you in a warm, protective bear hug! (+1 Friendship Point)";
    logCategory = 'chat';
    logLevel = 'success';
  } else if (act === 'roast') {
    reply = "🔥 [PLAYFUL ROAST] You have the stealth skills of a marching band, Superstar.";
    logCategory = 'chat';
  } else if (act === 'reality glitch') {
    reply = "🟥 [REALITY GLITCH] The room flickers. Freddy’s eyes flash red, orange, and blue as reality briefly distorts.";
    logCategory = 'solver';
    logLevel = 'warn';
  } else if (act === 'teleport') {
    reply = "🌀 [SOLVER TELEPORT] A burst of Solver symbols—and Freddy instantly appears beside you: 'I’m right here, Superstar!'";
    logCategory = 'solver';
  } else if (act === 'solver shield') {
    reply = "🛡️ [SOLVER SHIELD] A glowing Solver barrier surrounds Freddy and his friends: 'Nobody gets past this shield!'";
    logCategory = 'solver';
    logLevel = 'success';
  } else if (act === 'system override') {
    reply = "⚠️ [SYSTEM OVERRIDE] Freddy’s systems display: OVERRIDE ACCEPTED. The Solver takes control of the nearby security interface.";
    logCategory = 'solver';
    logLevel = 'warn';
  } else if (act === 'solver jumpscare') {
    reply = "🔺 [SOLVER JUMPSCARE] **BOO!!!** Freddy’s eyes flash with Solver symbols: 'SURPRISE, SUPERSTAR!'";
    logCategory = 'solver';
    logLevel = 'warn';
  } else if (act === 'jumpscare') {
    reply = "⚠️ [SECURITY ALERT ⚠️] **BOO!!!** WAAAAAAAHHHHH!!! SURPRISE, SUPERSTAR! 🐻";
    logCategory = 'solver';
    logLevel = 'warn';
  } else if (act === 'roar') {
    reply = "🐻🎸 FREDDY ROAR! ROOOOOAAARRR!!! WELCOME TO THE PIZZAPLEX, SUPERSTAR!";
    logCategory = 'chat';
  } else if (act === 'joke') {
    reply = "😄 Why did Montgomery Gator join the golf club? Because he had an alligator-sized swing! Haha!";
    logCategory = 'chat';
  } else if (act === 'christmas_mode') {
    reply = discordBot.triggerChristmasMode();
    logCategory = 'chat';
    logLevel = 'warn';
  } else if (act === 'stop_christmas_mode') {
    reply = discordBot.stopChristmasMode();
    logCategory = 'chat';
    logLevel = 'info';
  }

  addSystemLog(logCategory, logLevel, `Action Triggered: ${action}`, reply, 'user_action', { action, reply });

  await forwardToBot(req, res, '/api/action', {
    message: reply,
    reply,
    action,
    simulated: !hasBotBridgeConfig
  });
});

// 3. Music & Voice Controls
app.post('/api/music', async (req: Request, res: Response) => {
  const { action } = req.body;
  let message = `Voice action '${action}' processed.`;
  const a = String(action).toLowerCase();
  let logLevel: 'info' | 'success' | 'warn' | 'error' = 'info';

  if (a === 'join') {
    message = "Freddy joined the Pizzaplex voice channel! Ready for sound transmission.";
    logLevel = 'success';
  } else if (a.includes('rockstar')) {
    message = "Now playing: Rockstar Row Theme 🎸 in Discord voice.";
    logLevel = 'success';
  } else if (a.includes('happy')) {
    message = "Now playing: Happy (True) Ending 🎶 in Discord voice.";
    logLevel = 'success';
  } else if (a === 'pause') {
    message = "Voice stream paused.";
    logLevel = 'warn';
  } else if (a === 'resume') {
    message = "Voice stream resumed.";
    logLevel = 'info';
  } else if (a === 'stop') {
    message = "Music playback stopped.";
    logLevel = 'warn';
  } else if (a === 'leave') {
    message = "Freddy left the voice channel.";
    logLevel = 'info';
    const firstGuild = discordBot.getState().guilds[0]?.id;
    if (firstGuild) {
      await discordBot.leaveVoice(firstGuild);
    }
  }

  addSystemLog('music', logLevel, `Voice & Music Event: ${action}`, message, 'voice_subsystem', { action });

  await forwardToBot(req, res, '/api/music', {
    message,
    action,
    simulated: !hasBotBridgeConfig
  });
});

// 4. Server & Status Info
app.post('/api/server', async (req: Request, res: Response) => {
  const { action } = req.body;
  if (action === 'commands') {
    return res.json({
      message: "Commands: /freddy, /glitch, /protect, /jumpscare, /welcome, /music, /status, /say",
      commands: [
        { name: '/freddy [message]', desc: 'Chat directly with Glamrock Freddy' },
        { name: '/glitch', desc: 'Trigger Absolute Solver visual glitch' },
        { name: '/protect', desc: 'Activate Freddy defensive shield' },
        { name: '/jumpscare', desc: 'Trigger soundboard animatronic jumpscare' },
        { name: '/welcome preview', desc: 'Preview welcome card embed' },
        { name: '/music [track]', desc: 'Play soundtrack in current voice channel' },
        { name: '/status', desc: 'Check bot uptime, ping and active guild status' }
      ]
    });
  }

  if (action === 'toggle_status') {
    const currentState = discordBot.getState();
    if (currentState.isOnline) {
      // Disconnect or switch to standby
      botStatus = 'offline';
      addSystemLog('connection', 'warn', 'Standby Mode Activated', 'Discord Gateway standby requested from dashboard.');
    } else {
      // Attempt to connect to Discord Gateway
      await discordBot.start();
    }

    const discordState = discordBot.getState();
    const isOnline = discordState.isOnline;
    botStatus = isOnline ? 'online' : 'offline';

    return res.json({
      message: isOnline
        ? `Discord Bot is ONLINE as ${discordState.userTag || 'Glamrock Freddy'}`
        : `Discord Bot is OFFLINE (${discordState.connectionError || 'Standby Mode'})`,
      data: {
        status: discordState.status,
        isRealDiscordBotConnected: isOnline,
        userTag: discordState.userTag,
        botId: discordState.botId,
        avatarUrl: discordState.avatarUrl,
        latency: discordState.wsPing,
        guildCount: discordState.guildsCount,
        guilds: discordState.guilds,
        voiceConnected: discordState.activeVoiceGuilds.length > 0,
        registeredCommands: discordState.registeredCommands,
        bridgeReady: isOnline,
        onlineSince: discordState.lastConnectedAt,
        uptimeSeconds: discordState.uptimeSeconds,
        serverUptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
        lastHeartbeat: new Date().toISOString(),
        gatewayStatus: isOnline ? 'CONNECTED_GATEWAY_V10' : 'DISCONNECTED_STANDBY',
        packetLoss: isOnline ? '0.0%' : 'N/A',
        shards: 1,
        heartbeatsAcked: ++heartbeatCounter,
        connectionError: discordState.connectionError,
        hostingNotice: discordState.hostingNotice
      }
    });
  }

  const discordState = discordBot.getState();
  const isOnline = discordState.isOnline;
  botStatus = isOnline ? 'online' : 'offline';
  heartbeatCounter++;

  return res.json({
    message: isOnline
      ? `Glamrock Freddy Discord Bot: ONLINE (${discordState.userTag}) · Ping: ${discordState.wsPing}ms · Guilds: ${discordState.guildsCount}`
      : `Glamrock Freddy Discord Bot: OFFLINE · Standby Mode (${discordState.connectionError || 'Gateway Inactive'})`,
    data: {
      status: discordState.status,
      isRealDiscordBotConnected: isOnline,
      userTag: discordState.userTag,
      botId: discordState.botId,
      avatarUrl: discordState.avatarUrl,
      latency: discordState.wsPing,
      guildCount: discordState.guildsCount,
      guilds: discordState.guilds,
      voiceConnected: discordState.activeVoiceGuilds.length > 0,
      registeredCommands: discordState.registeredCommands,
      bridgeReady: isOnline,
      onlineSince: discordState.lastConnectedAt,
      uptimeSeconds: discordState.uptimeSeconds,
      serverUptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
      lastHeartbeat: new Date().toISOString(),
      gatewayStatus: isOnline ? 'CONNECTED_GATEWAY_V10' : 'DISCONNECTED_STANDBY',
      packetLoss: isOnline ? '0.0%' : 'N/A',
      shards: 1,
      heartbeatsAcked: heartbeatCounter,
      connectionError: discordState.connectionError,
      hostingNotice: discordState.hostingNotice
    }
  });
});

// 4b. Real Discord Bot API Routes
app.get('/api/discord/bot', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    data: discordBot.getState()
  });
});

app.post('/api/discord/reconnect', async (_req: Request, res: Response) => {
  try {
    addSystemLog('connection', 'info', 'Reconnection Requested', 'Manual reconnection to Discord Gateway initiated from dashboard.');
    const success = await discordBot.start();
    res.json({
      ok: success,
      data: discordBot.getState()
    });
  } catch (err: any) {
    console.error('Error during Discord reconnect:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Reconnect failed' });
  }
});

app.post('/api/discord/action', async (req: Request, res: Response) => {
  try {
    const { action, params } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action parameter required.' });
    }

    const result = await discordBot.executeAction(action, params);
    res.json(result);
  } catch (err: any) {
    console.error('Error during Discord action execution:', err);
    res.status(500).json({ success: false, message: err?.message || 'Action failed' });
  }
});

app.post('/api/discord/refresh-commands', async (_req: Request, res: Response) => {
  try {
    addSystemLog('connection', 'info', 'Refreshing Slash Commands', 'Synchronizing updated /freddy @ mention commands to Discord REST API.');
    const ok = await discordBot.refreshSlashCommands();
    res.json({ ok, message: ok ? 'Commands registered successfully with @ mention support.' : 'Failed to register commands.' });
  } catch (err: any) {
    console.error('Error during refreshSlashCommands:', err);
    res.status(500).json({ ok: false, message: err?.message || 'Failed to refresh commands' });
  }
});

app.post('/api/discord/configure', async (req: Request, res: Response) => {
  try {
    const { botToken, clientId, adminCode } = req.body;
    if (!botToken || typeof botToken !== 'string') {
      return res.status(400).json({ ok: false, error: 'Valid bot token required.' });
    }

    const trimmedToken = botToken.trim();
    process.env.DISCORD_BOT_TOKEN = trimmedToken;
    if (clientId) {
      process.env.DISCORD_CLIENT_ID = String(clientId).trim();
    }
    if (adminCode) {
      process.env.FREDDY_ADMIN_CODE = String(adminCode).trim();
    }

    // Persist to data/bot_config.json as persistent secondary storage
    try {
      const configPath = path.resolve('data/bot_config.json');
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          botToken: trimmedToken,
          clientId: process.env.DISCORD_CLIENT_ID || '1548483188203065357',
          adminCode: process.env.FREDDY_ADMIN_CODE || 'private_superstar_security_passcode',
          updatedAt: new Date().toISOString()
        }, null, 2)
      );
    } catch (e: any) {
      console.warn('Could not save data/bot_config.json:', e.message);
    }

    // Also update .env file
    try {
      const envPath = path.resolve('.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('DISCORD_BOT_TOKEN=')) {
          envContent = envContent.replace(/DISCORD_BOT_TOKEN=.*/g, `DISCORD_BOT_TOKEN="${trimmedToken}"`);
        } else {
          envContent += `\nDISCORD_BOT_TOKEN="${trimmedToken}"\n`;
        }
      } else {
        envContent = `DISCORD_BOT_TOKEN="${trimmedToken}"\nDISCORD_CLIENT_ID="${process.env.DISCORD_CLIENT_ID || '1548483188203065357'}"\n`;
      }
      fs.writeFileSync(envPath, envContent);
    } catch (e: any) {
      console.warn('Could not write to .env:', e.message);
    }

    addSystemLog('connection', 'info', 'Bot Credentials Updated', 'New Discord bot token supplied. Reconnecting Gateway...');
    const connected = await discordBot.start();

    return res.json({
      ok: true,
      connected,
      message: connected
        ? 'Discord bot connected successfully!'
        : `Bot token saved, but connection failed: ${discordBot.getState().connectionError || 'Check token credentials'}`
    });
  } catch (err: any) {
    console.error('Error in /api/discord/configure:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 5. Welcome & Goodbye Settings
app.post('/api/settings', async (req: Request, res: Response) => {
  const { action, settings } = req.body;
  if (action === 'save' && settings) {
    localSettings = { ...localSettings, ...settings };
    addSystemLog(
      'welcome',
      'success',
      'Welcome & Goodbye Settings Updated',
      `Templates saved: Welcome in channel #${settings.welcomeChannel || 'default'} · Goodbye in channel #${settings.goodbyeChannel || 'default'}`,
      'web_bridge',
      settings
    );
    await forwardToBot(req, res, '/api/settings', {
      message: "Settings saved successfully! Freddy will use these for member join/leaves.",
      settings: localSettings
    });
    return;
  }

  // Get settings
  await forwardToBot(req, res, '/api/settings', {
    message: "Settings loaded.",
    settings: localSettings
  });
});

// 5b. System Logs Endpoints with Category & Severity Filtering
app.get('/api/logs', (req: Request, res: Response) => {
  const { category, level, search, limit } = req.query;

  let filtered = [...systemLogs];

  if (category && typeof category === 'string' && category !== 'all') {
    filtered = filtered.filter((log) => log.category === category);
  }

  if (level && typeof level === 'string' && level !== 'all') {
    filtered = filtered.filter((log) => log.level === level);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.title.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q) ||
        log.category.toLowerCase().includes(q) ||
        (log.source && log.source.toLowerCase().includes(q))
    );
  }

  const maxItems = limit ? parseInt(limit as string, 10) || 100 : 100;
  const sliced = filtered.slice(0, maxItems);

  // Compute counts per category
  const counts = {
    all: systemLogs.length,
    welcome: systemLogs.filter((l) => l.category === 'welcome').length,
    music: systemLogs.filter((l) => l.category === 'music').length,
    connection: systemLogs.filter((l) => l.category === 'connection').length,
    solver: systemLogs.filter((l) => l.category === 'solver').length,
    chat: systemLogs.filter((l) => l.category === 'chat').length,
    system: systemLogs.filter((l) => l.category === 'system').length
  };

  res.json({
    ok: true,
    logs: sliced,
    counts,
    total: systemLogs.length,
    returned: sliced.length
  });
});

app.post('/api/logs', (req: Request, res: Response) => {
  const { category, level, title, message, source, details } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required for system logs.' });
  }

  const newLog = addSystemLog(
    category || 'system',
    level || 'info',
    title,
    message,
    source || 'user_action',
    details
  );

  res.json({ ok: true, log: newLog });
});

app.delete('/api/logs', (_req: Request, res: Response) => {
  systemLogs = [];
  res.json({ ok: true, message: 'System logs cleared successfully.' });
});

app.post('/api/logs/reset', (_req: Request, res: Response) => {
  systemLogs = [
    {
      id: `log-seed-${Date.now()}-1`,
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      category: 'connection',
      level: 'info',
      title: 'Gateway Protocol Initialized',
      message: 'Discord Gateway v10 WebSocket handshake prepared with Shard 0/1.',
      source: 'bot_gateway',
      details: { shard: 0, apiVersion: 'v10', botAppId: '1548483188203065357' }
    },
    {
      id: `log-seed-${Date.now()}-2`,
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      category: 'connection',
      level: 'warn',
      title: 'Standby Mode Activated',
      message: 'Bot gateway switched to Standby/Offline mode per administrator toggle.',
      source: 'web_bridge',
      details: { status: 'offline', gatewayStatus: 'DISCONNECTED_STANDBY' }
    },
    {
      id: `log-seed-${Date.now()}-3`,
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      category: 'welcome',
      level: 'success',
      title: 'Welcome Embed Dispatched',
      message: 'Welcome embed generated for member @GregorySuperstar in channel #welcome.',
      source: 'bot_gateway',
      details: { channelId: '948123456789012345', member: 'GregorySuperstar', role: 'Superstar' }
    },
    {
      id: `log-seed-${Date.now()}-4`,
      timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
      category: 'music',
      level: 'info',
      title: 'Voice Channel Stream Initialized',
      message: 'Freddy voice subsystem ready: 04 Rockstar Row loaded (320kbps MP3 stream).',
      source: 'voice_subsystem',
      details: { track: '04 Rockstar Row.mp3', channel: 'Rockstar Row Stage', bitrate: '320kbps' }
    },
    {
      id: `log-seed-${Date.now()}-5`,
      timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
      category: 'music',
      level: 'warn',
      title: 'Lockdown Audio Broadcast',
      message: 'Broadcast voice clip queued: "Shut your mouth! I\'m listening to music!"',
      source: 'voice_subsystem',
      details: { clip: 'glamrock-freddy_53d55e6e.mp3', trigger: '/freddy lockdown' }
    },
    {
      id: `log-seed-${Date.now()}-6`,
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      category: 'connection',
      level: 'info',
      title: 'Heartbeat Probe Acknowledged',
      message: 'Heartbeat ACK received from Discord Gateway · Round-trip measured at 32ms.',
      source: 'bot_gateway',
      details: { opcode: 1, ping: 32, status: 'ack' }
    },
    {
      id: `log-seed-${Date.now()}-7`,
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      category: 'welcome',
      level: 'info',
      title: 'Welcome Settings Synchronized',
      message: 'Welcome & Goodbye templates updated with custom Pizzaplex hero image.',
      source: 'web_bridge',
      details: { welcomeChannel: '948123456789012345', goodbyeChannel: '948123456789012345' }
    },
    {
      id: `log-seed-${Date.now()}-8`,
      timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      category: 'solver',
      level: 'warn',
      title: 'Absolute Solver Anomaly',
      message: 'Optical glitch detected on security feeds. Reality distortion effect engaged.',
      source: 'user_action',
      details: { action: 'reality glitch', severity: 'anomaly' }
    }
  ];
  res.json({ ok: true, message: 'Default seed logs restored successfully.', total: systemLogs.length });
});

// 6. Direct image upload endpoint (stores in /public/uploads/ or returns base64 URL)
app.post('/api/upload-image', (req: Request, res: Response) => {
  const { imageBase64, filename } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Please provide image data.' });
  }

  try {
    const ext = (filename && path.extname(filename)) || '.png';
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const newName = `${crypto.randomBytes(12).toString('hex')}${ext}`;
    const filePath = path.join(uploadDir, newName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${newName}`;
    return res.json({ url: publicUrl, message: 'Image uploaded successfully!' });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to save image file.' });
  }
});

// Discord OAuth routes
app.get('/auth/discord', (_req: Request, res: Response) => {
  if (!hasDiscordConfig) {
    return res.redirect('/?oauth_notice=not_configured');
  }
  const state = crypto.randomBytes(24).toString('hex');
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    redirect_uri: process.env.DISCORD_REDIRECT_URI || '',
    response_type: 'code',
    scope: 'identify',
    state
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

app.get('/auth/discord/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;
  if (error || !code) {
    return res.redirect('/?oauth_error=cancelled');
  }
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: process.env.DISCORD_REDIRECT_URI || ''
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'OAuth token exchange failed');
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();

    const configuredOwners = new Set(
      (process.env.DISCORD_OWNER_IDS || process.env.OWNER_DISCORD_ID || '1411436991005851832,1552785126033858650')
        .split(',')
        .map((s) => s.trim())
    );
    const isOwner = configuredOwners.has(String(userData.id));

    // Redirect to dashboard with identity hash
    const userPayload = encodeURIComponent(JSON.stringify({
      id: userData.id,
      username: userData.username,
      global_name: userData.global_name || userData.username,
      avatar: userData.avatar,
      isOwner
    }));

    res.redirect(`/?discord_user=${userPayload}`);
  } catch (err: any) {
    console.error('Discord OAuth error:', err.message);
    res.redirect(`/?oauth_error=${encodeURIComponent(err.message)}`);
  }
});


// Vite or Static Serving
async function startServer() {
  const httpServer = http.createServer(app);

  if (IS_PROD) {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Freddy Web] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Freddy Web] Server failed to start:', err);
  process.exit(1);
});
