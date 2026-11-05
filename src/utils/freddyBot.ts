export interface FreddySettings {
  welcomeMessage: string;
  welcomeChannel: string;
  welcomeImage: string;
  goodbyeMessage: string;
  goodbyeChannel: string;
  goodbyeImage: string;
}

export interface UserSession {
  id: string;
  username: string;
  global_name: string;
  avatar: string | null;
  isOwner: boolean;
  role: 'owner' | 'member' | 'guest';
}

export const DEFAULT_SETTINGS: FreddySettings = {
  welcomeMessage: "🐻🎸 Welcome to the Pizzaplex, {user}! I’m Glamrock Freddy. Stay safe, Superstar!",
  welcomeChannel: "948123456789012345",
  welcomeImage: "/src/assets/images/glamrock_freddy_hero_1793907789001.jpg",
  goodbyeMessage: "Goodbye, {user}! We hope to see you again at the Pizzaplex. Stay rockin'!",
  goodbyeChannel: "948123456789012345",
  goodbyeImage: "/src/assets/images/pizzaplex_stage_neon_1793907790277.jpg",
};

export const DEFAULT_OWNER: UserSession = {
  id: "1411436991005851832",
  username: "pizzaplex_captain",
  global_name: "Superstar Captain",
  avatar: null,
  isOwner: true,
  role: 'owner',
};

export const FREDDY_QUOTES = [
  "Way to go, Superstar! You are doing great!",
  "I am Glamrock Freddy! Lead singer of the Fazbear band.",
  "Gregory, do you see that small vent on the floor? Have you ever heard of Among Us, Gregory?",
  "I will protect you. My friends may seem angry, but they are just malfunctioning.",
  "Show time is at 10 PM sharp at the Main Stage!",
  "I cannot see you, Superstar, but I can hear your microphone loud and clear.",
  "Did you bring your security pass? Level 7 access granted!",
  "I feel a strange glitch in my subroutine... Wait, the Absolute Solver is whispering.",
  "I am programmed to be the finest bear in showbiz!",
  "If you ever feel lost in the Pizzaplex, find a recharge station and press the call button."
];

export const FREDDY_JOKES = [
  "Why did Montgomery Gator join the golf club? Because he had an alligator-sized swing! Haha!",
  "What does Chica order at the bakery? A rock-and-roll cupcake with extra glam!",
  "Why was Roxanne Wolf looking in the mirror all day? Because she's number one, of course!",
  "How does Sun keep the daycare tidy? By shining light on every mess!",
  "What is my favorite key on the synthesizer? The 'Bear'-itone chord! A classic!"
];

export function getSimulatedChatReply(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("hello") || m.includes("hi") || m.includes("hey")) {
    return "Hello, Superstar! It is so good to see you here in the Pizzaplex. What adventure shall we embark on?";
  }
  if (m.includes("solver") || m.includes("absolute")) {
    return "🔻 Absolute Solver detected! My optical feeds are showing strange golden geometric arrays. Do not worry, I will hold the corruption at bay!";
  }
  if (m.includes("who are you") || m.includes("freddy")) {
    return "I am Glamrock Freddy! Your personal guardian animatronic and frontman of the Mega Pizzaplex band. 🐻🎸";
  }
  if (m.includes("gregory")) {
    return "Gregory? Where is he? If you see him, tell him to hide in my chest cavity—it is safe and climate controlled!";
  }
  if (m.includes("music") || m.includes("song") || m.includes("play")) {
    return "Music is the pulse of the Pizzaplex! Use the Music & Voice panel below to play our greatest hits directly in voice chat.";
  }
  if (m.includes("joke")) {
    return FREDDY_JOKES[Math.floor(Math.random() * FREDDY_JOKES.length)];
  }
  if (m.includes("help") || m.includes("protect")) {
    return "I will protect you with every ounce of my Fazbear servos. Stay close to me and nothing will hurt you!";
  }
  return FREDDY_QUOTES[Math.floor(Math.random() * FREDDY_QUOTES.length)];
}

export function getSimulatedActionReply(action: string): { reply: string; status: 'ok' | 'glitch' | 'danger' } {
  switch (action.toLowerCase()) {
    case 'reality glitch':
      return {
        reply: "🔻 [SOLVER GLITCH] Reality matrix corrupted! Temporal anchor desynced. Optical sensors flickering between dimensions.",
        status: 'glitch'
      };
    case 'teleport':
      return {
        reply: "✨ [WARP DISPLACEMENT] Phase-shifting complete! Freddy vanished in a flash of cyan light and reappeared at the Stage Door.",
        status: 'ok'
      };
    case 'solver shield':
      return {
        reply: "🛡️ [SOLVER SHIELD] Absolute Solver hex-barrier deployed! Deflecting all incoming physical and emotional damage for 15 seconds.",
        status: 'ok'
      };
    case 'system override':
      return {
        reply: "⚠️ [SYSTEM OVERRIDE] Fazbear firmware 1.0.8 bypassed! Safe-mode unlocked. All restricted Pizzaplex zones are now accessible.",
        status: 'danger'
      };
    case 'solver jumpscare':
      return {
        reply: "💥 [STATIC HORROR] THE ABSOLUTE SOLVER OVERTAKES FREDDY'S EYES WITH YELLOW WINGS OF LIGHT! *Screeeeech!*",
        status: 'glitch'
      };
    case 'jumpscare':
      return {
        reply: "🐻💥 *LOUD ANIMATRONIC JUMPSCARE ROAR* ...Did I scare you, Superstar? My vocal dampeners must have tripped!",
        status: 'ok'
      };
    case 'joke':
      return {
        reply: "🐻 " + FREDDY_JOKES[Math.floor(Math.random() * FREDDY_JOKES.length)],
        status: 'ok'
      };
    case 'roar':
      return {
        reply: "🔊 *MASSIVE BASS ROAR* RRRRRRAAAWWWWRRR! The crowd in Rockstar Row goes wild!",
        status: 'ok'
      };
    default:
      return {
        reply: `Action '${action}' executed successfully on Freddy's Discord bot.`,
        status: 'ok'
      };
  }
}
