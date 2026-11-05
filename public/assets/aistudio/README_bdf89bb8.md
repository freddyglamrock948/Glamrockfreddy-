# Glamrock Freddy Website + Discord Bot Bridge

This package contains a Discord OAuth2 website and the updated Glamrock Freddy bot with a secure website API bridge.

## Included features
- Discord OAuth2 login (`identify` scope only)
- Logged-in dashboard and profile display
- Freddy character chat
- Absolute Solver roleplay actions and jumpscares
- Music/voice controls
- Server status and bot command info
- Bot-side API validates shared secret and requires the logged-in Discord user to be a member of the configured server

## Important
The website and bot are two separate services. Deploy `website/` as a Node.js service and `freddy_ultimate/` as the Python bot. The website cannot control the bot unless both are deployed and the bridge environment variables are configured.

## Discord OAuth2 setup
In Discord Developer Portal -> your OAuth2 application:
- Add redirect URL exactly: `https://YOUR-WEBSITE-DOMAIN/auth/discord/callback`
- Use the OAuth2 Client ID and Client Secret as website variables.
- The website only requests `identify`; it does not request passwords, guild access, or bot permissions.

## Website environment variables
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `SESSION_SECRET` (long random secret)
- `FREDDY_BOT_API_URL` (public HTTPS base URL for bot API service; example `https://your-bot-api-domain`)
- `FREDDY_WEB_API_SECRET` (same random secret configured on bot)
- `PORT` (hosting platform usually sets this)
- `NODE_ENV=production`

## Bot environment variables
- `DISCORD_BOT_TOKEN`
- `FREDDY_ADMIN_CODE`
- `DISCORD_OWNER_IDS=1411436991005851832,1552785126033858650`
- `FREDDY_WEB_API_SECRET` (must match website)
- `FREDDY_WEB_API_PORT` (default 8081)
- `FREDDY_WEBSITE_GUILD_ID` (Discord server ID where bot is installed)
- `FREDDY_WEBSITE_CHANNEL_ID` (optional channel where website actions/chat are posted)
- `FREDDY_WEBSITE_VOICE_CHANNEL_ID` (voice channel Freddy should join from website controls)

## Deploy order
1. Deploy the bot package as a Python service and set its variables. Expose the bot API port `8081` as an HTTPS service using your host's networking/proxy feature. Set `FREDDY_BOT_API_URL` to that public HTTPS base URL.
2. Deploy the website package as a Node.js service and set the website variables.
3. Add the website callback URL to the Discord OAuth2 settings.
4. Invite the bot to the target server with the needed permissions and enable the Message Content Intent if you want mention-chat behavior.
5. Configure the website's guild, optional text channel, and voice channel IDs on the bot service.

## iPhone deployment
You can upload this ZIP to GitHub from the Files app or GitHub app, then connect each folder as its own service in your host. A single service root cannot run both Node.js and Python entry points at once unless you configure a multi-service deployment.

## Safety
- Never put Discord bot tokens or OAuth client secrets in frontend JavaScript or commit them to GitHub.
- Use HTTPS.
- Do not set the shared API secret to your Discord bot token.
- This bridge does not request Discord OAuth guild permissions. The bot verifies membership in its configured server before accepting controls.
- Chat responses use built-in character responses (not a hosted AI model).


## Welcome and goodbye dashboard settings

The dashboard includes editable welcome/goodbye text, Discord channel IDs, image URLs, image upload (PNG/JPG/GIF/WEBP, max 5 MB), and previews. All signed-in Discord users who are members of the configured server can save these settings. The bot uses them for `on_member_join` and `on_member_remove`.

Set `PUBLIC_BASE_URL` to the deployed website's public HTTPS URL for uploaded images to be accessible to Discord. Uploaded files are stored in `website/uploads`; some hosts use ephemeral storage, so use stable external image URLs or persistent storage if uploads must survive redeployments. The bot's configured guild and channel IDs must be set as documented in the bot `.env.example`.


## Owner-only website login

Set `OWNER_DISCORD_ID` to the Discord user ID of the bot owner. The owner signs in using the owner’s own Discord account via OAuth2. Other Discord accounts will be denied access to the dashboard and its API controls. Never use or share the bot token as a website login credential.
