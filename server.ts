import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

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

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    status: 'online',
    hasDiscordConfig,
    hasBotBridgeConfig,
    timestamp: new Date().toISOString()
  });
});

// Bridge forwarder to remote Python bot if configured, with graceful fallback
async function forwardToBot(req: Request, res: Response, route: string, fallbackData: any) {
  if (hasBotBridgeConfig && process.env.FREDDY_BOT_API_URL) {
    try {
      const base = process.env.FREDDY_BOT_API_URL.replace(/\/+$/, '');
      const response = await fetch(`${base}${route}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Freddy-API-Key': process.env.FREDDY_WEB_API_SECRET || ''
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      console.warn(`[Bot Bridge] Could not reach remote bot API at ${process.env.FREDDY_BOT_API_URL}: ${err.message}. Serving local simulation.`);
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
  if (lower.includes("cyn") || lower.includes("daughter")) {
    reply = "Cyn is my daughter, Superstar. She may be unusual, but I care about her and want her to be safe. 💛";
  } else if (lower.includes("gregory") || lower.includes("son")) {
    reply = "Gregory is my son, Superstar. I will always look out for him and help keep him safe.";
  } else if (lower.includes("family") || lower.includes("children")) {
    reply = "Gregory and Cyn are my children. Family means looking after one another, Superstar.";
  } else if (lower.includes("hug")) {
    reply = "A big bear hug for you, Superstar! You are my friend. 🫂";
  } else if (lower.includes("roast")) {
    reply = "🔥 You have the stealth skills of a marching band, Superstar.";
  } else if (lower.includes("hello") || lower.includes("hi")) {
    reply = "Hello, Superstar! Glamrock Freddy reporting for duty at the Pizzaplex. How can I help you today?";
  } else if (lower.includes("solver")) {
    reply = "🔻 Absolute Solver alert! My optical feeds detected high-frequency anomaly signals. Stand behind me, Superstar!";
  } else if (lower.includes("who are you")) {
    reply = "I am Glamrock Freddy! Frontman of the Pizzaplex band and your personal protector.";
  } else if (lower.includes("joke")) {
    reply = "Why did the animatronic bring a guitar? To make some byte-sized music!";
  }

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
  if (act === 'lockdown') {
    reply = "🚨 [LOCKDOWN ACTIVATED] 'Freddy, you're supposed to be on lockdown! / SHUT YOUR MOUTH, I'M LISTENING TO MUSIC!'";
  } else if (act === 'greeting' || act === 'hello') {
    reply = "🐻🎙️ [FREDDY VOICE GREETING] 'Way to go, superstar! I knew you could do it.'";
  } else if (act === 'hug') {
    reply = "🫂 [BEAR HUG] Freddy wraps you in a warm, protective bear hug! (+1 Friendship Point)";
  } else if (act === 'roast') {
    reply = "🔥 [PLAYFUL ROAST] You have the stealth skills of a marching band, Superstar.";
  } else if (act === 'reality glitch') {
    reply = "🟥 [REALITY GLITCH] The room flickers. Freddy’s eyes flash red, orange, and blue as reality briefly distorts.";
  } else if (act === 'teleport') {
    reply = "🌀 [SOLVER TELEPORT] A burst of Solver symbols—and Freddy instantly appears beside you: 'I’m right here, Superstar!'";
  } else if (act === 'solver shield') {
    reply = "🛡️ [SOLVER SHIELD] A glowing Solver barrier surrounds Freddy and his friends: 'Nobody gets past this shield!'";
  } else if (act === 'system override') {
    reply = "⚠️ [SYSTEM OVERRIDE] Freddy’s systems display: OVERRIDE ACCEPTED. The Solver takes control of the nearby security interface.";
  } else if (act === 'solver jumpscare') {
    reply = "🔺 [SOLVER JUMPSCARE] **BOO!!!** Freddy’s eyes flash with Solver symbols: 'SURPRISE, SUPERSTAR!'";
  } else if (act === 'jumpscare') {
    reply = "⚠️ [SECURITY ALERT ⚠️] **BOO!!!** WAAAAAAAHHHHH!!! SURPRISE, SUPERSTAR! 🐻";
  } else if (act === 'roar') {
    reply = "🐻🎸 FREDDY ROAR! ROOOOOAAARRR!!! WELCOME TO THE PIZZAPLEX, SUPERSTAR!";
  } else if (act === 'joke') {
    reply = "😄 Why did Montgomery Gator join the golf club? Because he had an alligator-sized swing! Haha!";
  }

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
  if (a === 'join') {
    message = "Freddy joined the Pizzaplex voice channel! Ready for sound transmission.";
  } else if (a.includes('rockstar')) {
    message = "Now playing: Rockstar Row Theme 🎸 in Discord voice.";
  } else if (a.includes('happy')) {
    message = "Now playing: Happy (True) Ending 🎶 in Discord voice.";
  } else if (a === 'pause') {
    message = "Voice stream paused.";
  } else if (a === 'resume') {
    message = "Voice stream resumed.";
  } else if (a === 'stop') {
    message = "Music playback stopped.";
  } else if (a === 'leave') {
    message = "Freddy left the voice channel.";
  }

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

  await forwardToBot(req, res, '/api/server', {
    message: "Glamrock Freddy Discord Bot: ONLINE · Ping: 32ms · Active Guilds: 1 · Voice: Connected",
    data: {
      status: 'online',
      latency: 32,
      guildCount: 1,
      voiceConnected: true,
      bridgeReady: hasBotBridgeConfig
    }
  });
});

// 5. Welcome & Goodbye Settings
app.post('/api/settings', async (req: Request, res: Response) => {
  const { action, settings } = req.body;
  if (action === 'save' && settings) {
    localSettings = { ...localSettings, ...settings };
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
        hmr: {
          server: httpServer
        }
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
