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

export const OWNER_IDS = ['1411436991005851832', '1552785126033858650'];

export const DEFAULT_OWNERS: Record<string, UserSession> = {
  main: {
    id: "1411436991005851832",
    username: "pizzaplex_captain",
    global_name: "Superstar Captain (Main Owner)",
    avatar: null,
    isOwner: true,
    role: 'owner',
  },
  alt: {
    id: "1552785126033858650",
    username: "fazbear_director",
    global_name: "Fazbear Director (Alt Owner)",
    avatar: null,
    isOwner: true,
    role: 'owner',
  }
};

export const DEFAULT_OWNER = DEFAULT_OWNERS.main;

export const DEFAULT_SETTINGS: FreddySettings = {
  welcomeMessage: "🐻🎸 Welcome to the Pizzaplex, {user}! I’m Glamrock Freddy. Stay safe, Superstar!",
  welcomeChannel: "948123456789012345",
  welcomeImage: "/src/assets/images/glamrock_freddy_hero_1793907789001.jpg",
  goodbyeMessage: "Goodbye, {user}! We hope to see you again at the Pizzaplex. Stay rockin'!",
  goodbyeChannel: "948123456789012345",
  goodbyeImage: "/src/assets/images/pizzaplex_stage_neon_1793907790277.jpg",
};

export const FREDDY_ROASTS = [
  "You have the stealth skills of a marching band, Superstar.",
  "Even the STAFF bots saw that coming.",
  "That plan needs a little more superstar energy.",
  "Monty called. He said your aim needs practice."
];

export const FREDDY_JOKES = [
  "Why did the animatronic bring a guitar? To make some byte-sized music!",
  "What is Freddy's favorite kind of party? A rock-and-roll party!",
  "Why did I go to the daycare? I wanted to brighten everyone's day!",
  "Why did Montgomery Gator join the golf club? Because he had an alligator-sized swing! Haha!"
];

export const FREDDY_GREETINGS = [
  "Hello, Superstar! Freddy is here to help!",
  "You are doing great! Keep going, Superstar!",
  "Stay safe out there. I am watching over you!"
];

export const FREDDY_FRIENDLY = [
  "Of course, Superstar! I am always here to help.",
  "You can count on me. I will keep you safe.",
  "That sounds like a great idea! Let us do it together.",
  "I believe in you, Superstar. You have got this!"
];

export const ROLEPLAY_SCENES: Record<string, { title: string; text: string }> = {
  gregory: {
    title: 'Protect Gregory',
    text: 'Gregory, I have located you! Stay behind me. We need to get you somewhere safe before the others find us.'
  },
  alert: {
    title: 'Security Alert',
    text: '⚠️ SECURITY ALERT! Superstar, please remain calm. I am detecting movement nearby. Follow me!'
  },
  escape: {
    title: 'Escape the Pizzaplex',
    text: 'The doors are almost open, Superstar! Keep moving. We can make it out of the Pizzaplex together!'
  }
};

export function getFriendshipLevel(points: number): string {
  if (points < 5) return 'New Superstar';
  if (points < 15) return 'Pizzaplex Pal';
  return "Freddy's Best Friend";
}

export function getSimulatedChatReply(message: string): string {
  const text = message.toLowerCase();

  // Family Lore
  if (text.includes("cyn") || text.includes("daughter")) {
    return "Cyn is my daughter, Superstar. She may be unusual, but I care about her and want her to be safe. 💛";
  }
  if (text.includes("gregory") || text.includes("son")) {
    return "Gregory is my son, Superstar. I will always look out for him and help keep him safe.";
  }
  if (text.includes("family") || text.includes("children") || text.includes("kids")) {
    return "Gregory and Cyn are my children. Family means looking after one another, Superstar.";
  }
  if (text.includes("hug") || text.includes("love") || text.includes("friend")) {
    return "A big bear hug for you, Superstar! You are my friend. 🫂";
  }
  if (text.includes("scared") || text.includes("afraid") || text.includes("help") || text.includes("danger")) {
    return "Do not worry, Superstar. Stay close to me. I will protect you!";
  }
  if (text.includes("where")) {
    return "I am here, Superstar. Let us check the security cameras and find a safe route.";
  }
  if (text.includes("joke") || text.includes("funny")) {
    return FREDDY_JOKES[Math.floor(Math.random() * FREDDY_JOKES.length)];
  }
  if (text.includes("roast")) {
    return "🔥 " + FREDDY_ROASTS[Math.floor(Math.random() * FREDDY_ROASTS.length)];
  }
  if (text.includes("lockdown")) {
    return "🚨 Freddy: 'Shut your mouth! I'm listening to music!' ...Ahem, pardon my audio glitch, Superstar!";
  }
  if (text.includes("solver") || text.includes("absolute")) {
    return "🔺 Absolute Solver detected! My optical feeds are showing geometric arrays. Do not worry, I will hold the corruption at bay!";
  }
  if (text.includes("sing") || text.includes("song")) {
    return "🎤 Freddy's imaginary concert starts now. Everybody clap, Superstar!";
  }
  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return FREDDY_GREETINGS[Math.floor(Math.random() * FREDDY_GREETINGS.length)];
  }

  return FREDDY_FRIENDLY[Math.floor(Math.random() * FREDDY_FRIENDLY.length)];
}

export function getSimulatedActionReply(action: string): { reply: string; status: 'ok' | 'glitch' | 'danger' } {
  switch (action.toLowerCase()) {
    case 'lockdown':
      return {
        reply: "🚨 [LOCKDOWN ACTIVATED] 'Freddy, you're supposed to be on lockdown! / SHUT YOUR MOUTH, I'M LISTENING TO MUSIC!'",
        status: 'danger'
      };
    case 'greeting':
    case 'hello':
      return {
        reply: "🐻🎙️ [FREDDY VOICE GREETING] 'Way to go, superstar! I knew you could do it.'",
        status: 'ok'
      };
    case 'hug':
      return {
        reply: "🫂 [BEAR HUG] Freddy wraps you in a warm, protective bear hug! (+1 Friendship Point)",
        status: 'ok'
      };
    case 'roast':
      return {
        reply: "🔥 [PLAYFUL ROAST] " + FREDDY_ROASTS[Math.floor(Math.random() * FREDDY_ROASTS.length)],
        status: 'ok'
      };
    case 'reality glitch':
      return {
        reply: "🟥 [REALITY GLITCH] The room flickers. Freddy’s eyes flash red, orange, and blue as reality briefly distorts around him.",
        status: 'glitch'
      };
    case 'teleport':
      return {
        reply: "🌀 [SOLVER TELEPORT] A burst of Solver symbols—and Freddy instantly appears beside you: 'I’m right here, Superstar!'",
        status: 'ok'
      };
    case 'solver shield':
      return {
        reply: "🛡️ [SOLVER SHIELD] A glowing Solver barrier surrounds Freddy and his friends: 'Nobody gets past this shield!'",
        status: 'ok'
      };
    case 'system override':
      return {
        reply: "⚠️ [SYSTEM OVERRIDE] Freddy’s systems display: OVERRIDE ACCEPTED. The Solver takes control of the nearby security interface.",
        status: 'danger'
      };
    case 'solver jumpscare':
      return {
        reply: "🔺 [SOLVER JUMPSCARE] **BOO!!!** Freddy’s eyes flash with Solver symbols: 'SURPRISE, SUPERSTAR!'",
        status: 'glitch'
      };
    case 'jumpscare':
      return {
        reply: "⚠️ [SECURITY ALERT JUMPSCARE] **BOO!!!** WAAAAAAAHHHHH!!! SURPRISE, SUPERSTAR! 🐻",
        status: 'danger'
      };
    case 'joke':
      return {
        reply: "😄 " + FREDDY_JOKES[Math.floor(Math.random() * FREDDY_JOKES.length)],
        status: 'ok'
      };
    case 'roar':
      return {
        reply: "🐻🎸 FREDDY ROAR! ROOOOOAAARRR!!! WELCOME TO THE PIZZAPLEX, SUPERSTAR!",
        status: 'ok'
      };
    default:
      return {
        reply: `Action '${action}' executed successfully on Freddy's Discord bot.`,
        status: 'ok'
      };
  }
}
