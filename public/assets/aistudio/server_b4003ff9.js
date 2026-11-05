require("dotenv").config();
const express = require("express");
const session = require("express-session");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const required = ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DISCORD_REDIRECT_URI", "SESSION_SECRET", "FREDDY_BOT_API_URL", "FREDDY_WEB_API_SECRET", "OWNER_DISCORD_ID"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error("Missing environment variables:", missing.join(", "));
  process.exit(1);
}
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, crypto.randomBytes(18).toString("hex") + path.extname(file.originalname).toLowerCase())
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ["image/png","image/jpeg","image/gif","image/webp"].includes(file.mimetype))
});
app.use("/uploads", express.static(uploadDir));
app.set("trust proxy", 1);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: "freddy.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
function page(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} | Glamrock Freddy</title><link rel="stylesheet" href="/style.css"></head><body><header class="top"><a class="brand" href="/">★ GLAMROCK <span>FREDDY</span></a><nav><a href="/">Home</a>${content.includes("dashboard") ? '<a href="/dashboard">Dashboard</a>' : ""}</nav></header><main>${content}</main><footer>Fan-made Glamrock Freddy website · Not affiliated with Discord or the FNAF rights holders.</footer><script src="/app.js"></script></body></html>`;
}
function loginButton() { return '<a class="button discord" href="/auth/discord">Log in with Discord ↗</a>'; }
function isOwner(req) { return Boolean(req.session.user && req.session.user.id === String(process.env.OWNER_DISCORD_ID)); }
function requireLogin(req,res,next) { if(!req.session.user) return res.status(401).json({error:"Please log in with Discord first."}); if(!isOwner(req)) return res.status(403).json({error:"This dashboard is restricted to the bot owner."}); next(); }
function loggedPage(req,res,next) { if(!req.session.user) return res.redirect("/"); if(!isOwner(req)) return res.status(403).send(page("Owner access only",`<section class="panel"><h1>Owner access only</h1><p>This Glamrock Freddy dashboard is restricted to the configured owner Discord account.</p><form method="post" action="/logout"><button class="outline" type="submit">Log out</button></form></section>`)); next(); }

app.get("/style.css",(req,res)=>{res.type("text/css").send(`:root{color-scheme:dark;--bg:#090d16;--card:#121c2c;--cyan:#53e7ff;--orange:#ff9b45;--text:#f5f7fb;--muted:#aab6c9}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at top,#182a43 0,#090d16 58%);color:var(--text);font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;min-height:100vh;display:flex;flex-direction:column}.top{display:flex;justify-content:space-between;align-items:center;padding:20px clamp(18px,5vw,70px);border-bottom:1px solid #ffffff15}.brand{font-weight:900;letter-spacing:.12em;color:white;text-decoration:none}.brand span{color:var(--orange)}nav a{color:var(--muted);text-decoration:none;margin-left:18px}main{width:min(100% - 32px,1000px);margin:auto;flex:1;padding:36px 0}.hero,.panel{background:linear-gradient(145deg,#14243aee,#0c1422f2);border:1px solid #53e7ff35;border-radius:24px;padding:clamp(22px,5vw,48px);box-shadow:0 24px 90px #0006}.tag{color:var(--cyan);font-size:.8rem;letter-spacing:.2em;font-weight:800}.hero h1{font-size:clamp(2.5rem,8vw,5rem);line-height:1.02;margin:18px 0}.hero h1 span{color:var(--orange)}p{color:var(--muted);max-width:720px}.button,button{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 17px;border-radius:12px;text-decoration:none;font-weight:800;border:0;cursor:pointer;margin:4px}.discord{background:#5865f2;color:white}.outline{border:1px solid #53e7ff65;color:var(--cyan);background:transparent}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:22px}.mini{background:#ffffff08;border:1px solid #ffffff12;padding:16px;border-radius:14px}.mini b{display:block;color:var(--orange);margin-bottom:5px}.muted{color:var(--muted)}.profile{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.avatar{width:70px;height:70px;border-radius:50%;border:3px solid var(--cyan)}.dashboard{display:grid;grid-template-columns:1fr;gap:16px}.chatlog{height:250px;overflow:auto;background:#080e18;border:1px solid #ffffff16;border-radius:12px;padding:14px;margin:12px 0}.msg{padding:8px 10px;margin:6px 0;border-radius:10px;background:#ffffff09;overflow-wrap:anywhere}.msg.freddy{border-left:3px solid var(--orange)}.msg.user{border-left:3px solid var(--cyan)}.row{display:flex;gap:8px;flex-wrap:wrap}.row input{flex:1;min-width:150px}.input, input, select{width:100%;padding:12px;border-radius:10px;background:#0a1220;border:1px solid #ffffff24;color:white}.actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}.actions button{width:100%;margin:0}.section-title{margin:0 0 6px;color:var(--cyan)}.small{font-size:.85rem}footer{text-align:center;padding:22px;color:#77849a;font-size:.8rem}`);
});

app.get("/",(req,res)=>{
 const content=`<section class="hero"><div class="tag">WELCOME TO THE PIZZAPLEX</div><h1>Meet<br><span>Glamrock Freddy.</span></h1><p>Sign in with Discord to chat with Freddy, trigger Solver roleplay actions, and control music and voice features in your connected Discord server.</p>${req.session.user?'<a class="button outline" href="/dashboard">Open dashboard →</a>':loginButton()}<div class="cards"><div class="mini"><b>Discord Login</b><span class="muted">OAuth2 identity sign-in</span></div><div class="mini"><b>Freddy Chat</b><span class="muted">Talk with your superstar protector</span></div><div class="mini"><b>Bot Controls</b><span class="muted">Solver, scares, music, voice</span></div></div></section>`;
 res.send(page("Home",content));
});

app.get("/auth/discord",(req,res)=>{
 const state=crypto.randomBytes(24).toString("hex");req.session.oauthState=state;
 const params=new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID,redirect_uri:process.env.DISCORD_REDIRECT_URI,response_type:"code",scope:"identify",state});
 res.redirect("https://discord.com/oauth2/authorize?"+params.toString());
});
app.get("/auth/discord/callback",async(req,res)=>{
 const {code,state,error}=req.query;
 if(error)return res.status(400).send(page("Login cancelled",`<section class="panel"><h1>Discord login cancelled</h1><a class="button outline" href="/">Return home</a></section>`));
 if(!code||!state||state!==req.session.oauthState)return res.status(400).send(page("Login error",`<section class="panel"><h1>Login could not be verified</h1><a class="button outline" href="/">Try again</a></section>`));
 delete req.session.oauthState;
 try{
  const tr=await fetch("https://discord.com/api/oauth2/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID,client_secret:process.env.DISCORD_CLIENT_SECRET,grant_type:"authorization_code",code,redirect_uri:process.env.DISCORD_REDIRECT_URI})});
  const token=await tr.json();if(!tr.ok||!token.access_token)throw new Error("Token exchange failed");
  const ur=await fetch("https://discord.com/api/users/@me",{headers:{Authorization:`Bearer ${token.access_token}`}});
  const u=await ur.json();if(!ur.ok||!u.id)throw new Error("Profile lookup failed");
  req.session.user={id:u.id,username:u.username,global_name:u.global_name||u.username,avatar:u.avatar};
  if(!isOwner(req)){ req.session.destroy(()=>{}); return res.status(403).send(page("Owner access only",`<section class="panel"><h1>Owner access only</h1><p>This website is configured for the bot owner’s Discord account. Sign in with the owner account.</p><a class="button outline" href="/">Return home</a></section>`)); }
  res.redirect("/dashboard");
 }catch(e){console.error("Discord OAuth:",e.message);res.status(502).send(page("Login error",`<section class="panel"><h1>Discord login failed</h1><p>Check OAuth2 settings and try again.</p><a class="button outline" href="/">Return home</a></section>`));}
});

app.get("/dashboard",loggedPage,(req,res)=>{
 const u=req.session.user;
 const avatar=u.avatar?`https://cdn.discordapp.com/avatars/${encodeURIComponent(u.id)}/${encodeURIComponent(u.avatar)}.png?size=128`:"https://cdn.discordapp.com/embed/avatars/0.png";
 const content=`<section class="dashboard" id="dashboard">
 <div class="panel"><div class="profile"><img class="avatar" src="${esc(avatar)}" alt="Discord avatar"><div><div class="tag">SIGNED IN WITH DISCORD</div><h1>Welcome, ${esc(u.global_name)}!</h1><span class="muted">${esc(u.username)} · ${esc(u.id)}</span></div></div><p class="small">Your account is logged in. Bot controls also require that you are a member of the Discord server configured for Freddy.</p><form method="post" action="/logout"><button class="outline" type="submit">Log out</button></form></div>
 <div class="panel" id="welcome-settings"><h2 class="section-title">👋 Welcome & Goodbye Settings</h2><p class="small">Anyone signed in and belonging to Freddy’s configured Discord server can edit these settings.</p>
 <form id="settingsform">
 <label class="small">Welcome message <textarea class="input" id="welcomeMessage" maxlength="1800" rows="3">🐻🎸 Welcome to the Pizzaplex, {user}! I’m Glamrock Freddy. Stay safe, Superstar!</textarea></label>
 <label class="small">Welcome channel ID (optional; blank uses Discord’s system channel) <input id="welcomeChannel" inputmode="numeric" placeholder="123456789012345678"></label>
 <label class="small">Welcome picture URL (optional) <input id="welcomeImage" type="url" placeholder="https://example.com/welcome.png"></label>
 <label class="small">Or upload a welcome picture (PNG, JPG, GIF, WEBP; max 5 MB) <input id="welcomeUpload" type="file" accept="image/png,image/jpeg,image/gif,image/webp"><button class="outline" type="button" data-upload="welcomeUpload">Upload welcome picture</button></label>
 <hr>
 <label class="small">Goodbye message <textarea class="input" id="goodbyeMessage" maxlength="1800" rows="3">Goodbye, {user}! We hope to see you again at the Pizzaplex.</textarea></label>
 <label class="small">Goodbye channel ID (optional; blank uses the welcome channel/system channel) <input id="goodbyeChannel" inputmode="numeric" placeholder="123456789012345678"></label>
 <label class="small">Goodbye picture URL (optional) <input id="goodbyeImage" type="url" placeholder="https://example.com/goodbye.png"></label>
 <label class="small">Or upload a goodbye picture (PNG, JPG, GIF, WEBP; max 5 MB) <input id="goodbyeUpload" type="file" accept="image/png,image/jpeg,image/gif,image/webp"><button class="outline" type="button" data-upload="goodbyeUpload">Upload goodbye picture</button></label>
 <div class="row"><button class="discord" type="submit">Save settings</button><button class="outline" type="button" id="previewWelcome">Preview welcome</button><button class="outline" type="button" id="previewGoodbye">Preview goodbye</button></div>
 </form><div id="settingsresult" class="msg freddy" aria-live="polite">Loading settings…</div><div id="settingspreview" class="msg" style="display:none"></div></div>
 <div class="panel"><h2 class="section-title">💬 Chat with Freddy</h2><div id="chatlog" class="chatlog" aria-live="polite"><div class="msg freddy">Freddy: Hello, Superstar! I am here to help. 🎸</div></div><div id="chatstatus" class="small muted" aria-live="polite"></div><form id="chatform" class="row"><input id="chatinput" maxlength="500" placeholder="Say something to Freddy…" autocomplete="off" required><button class="discord" type="submit">Send</button></form></div>
 <div class="panel"><h2 class="section-title">🔺 Absolute Solver & Scares</h2><div class="actions"><button class="outline" data-action="reality glitch">Reality Glitch</button><button class="outline" data-action="teleport">Teleport</button><button class="outline" data-action="solver shield">Solver Shield</button><button class="outline" data-action="system override">System Override</button><button class="outline" data-action="solver jumpscare">Solver Jumpscare</button><button class="outline" data-action="jumpscare">Jumpscare</button><button class="outline" data-action="joke">Tell me a joke</button><button class="outline" data-action="roar">Freddy Roar</button></div><div id="actionresult" class="msg freddy" aria-live="polite">Choose an action, Superstar.</div></div>
 <div class="panel"><h2 class="section-title">🎵 Music & Voice Controls</h2><p class="small">Freddy can use the configured Discord voice channel. Add soundtrack files to the bot package to enable playback.</p><div class="actions"><button class="discord" data-music="join">Join voice</button><button class="outline" data-music="play rockstar">Play Rockstar Row</button><button class="outline" data-music="play happy">Play Happy (True) Ending</button><button class="outline" data-music="pause">Pause</button><button class="outline" data-music="resume">Resume</button><button class="outline" data-music="skip">Skip</button><button class="outline" data-music="stop">Stop music</button><button class="outline" data-music="leave">Leave voice</button></div><div id="musicresult" class="msg freddy" aria-live="polite">Ready to control Freddy's voice features.</div></div>
 <div class="panel"><h2 class="section-title">🎮 Discord Server</h2><div class="actions"><button class="outline" data-server="status">Check Freddy status</button><button class="outline" data-server="commands">Show command list</button></div><div id="serverresult" class="msg freddy" aria-live="polite">Connected bot controls appear here.</div></div>
 </section>`;
 res.send(page("Dashboard",content));
});

async function forward(req,res,route){
 if(!req.session.user)return res.status(401).json({error:"Please log in with Discord first."});
 try{
  const base=process.env.FREDDY_BOT_API_URL.replace(/\/+$/,"");
  const r=await fetch(base+route,{method:"POST",headers:{"Content-Type":"application/json","X-Freddy-API-Key":process.env.FREDDY_WEB_API_SECRET},body:JSON.stringify({...req.body,user_id:req.session.user.id})});
  const data=await r.json().catch(()=>({error:"Bot API returned an invalid response."}));
  res.status(r.status).json(data);
 }catch(e){console.error("Bot bridge error:",e.message);res.status(502).json({error:"Could not reach Glamrock Freddy bot. Check that the bot API is deployed and online."});}
}
app.post("/api/chat",requireLogin,(req,res)=>forward(req,res,"/api/chat"));
app.post("/api/action",requireLogin,(req,res)=>forward(req,res,"/api/action"));
app.post("/api/music",requireLogin,(req,res)=>forward(req,res,"/api/music"));
app.post("/api/server",requireLogin,(req,res)=>forward(req,res,"/api/server"));
app.post("/api/settings",requireLogin,(req,res)=>forward(req,res,"/api/settings"));
app.post("/api/upload-image",requireLogin,upload.single("image"),(req,res)=>{
 if(!req.file)return res.status(400).json({error:"Choose a supported image file (PNG, JPG, GIF, WEBP), up to 5 MB."});
 const base=(process.env.PUBLIC_BASE_URL||"").replace(/\/+$/,"");
 if(!base)return res.status(500).json({error:"Set PUBLIC_BASE_URL to your deployed website HTTPS URL before uploading images."});
 res.json({url:base+"/uploads/"+encodeURIComponent(req.file.filename)});
});

app.get("/app.js",(req,res)=>{res.type("application/javascript").send(`const $=id=>document.getElementById(id);function addMsg(text,who="freddy"){const d=document.createElement("div");d.className="msg "+who;d.textContent=(who==="user"?"You: ":"Freddy: ")+text;$("chatlog").appendChild(d);$("chatlog").scrollTop=$("chatlog").scrollHeight;}async function send(route,body,resultId){const el=$(resultId);el.textContent="Freddy is responding…";try{const r=await fetch(route,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Request failed");el.textContent=d.reply||d.message||"Done!";return d;}catch(e){el.textContent=e.message;}}const f=$("chatform");if(f)f.addEventListener("submit",async e=>{e.preventDefault();const input=$("chatinput"),text=input.value.trim();if(!text)return;addMsg(text,"user");input.value="";const d=await send("/api/chat",{message:text},"chatstatus");if(d&&d.reply)addMsg(d.reply);});document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>send("/api/action",{action:b.dataset.action},"actionresult")));document.querySelectorAll("[data-music]").forEach(b=>b.addEventListener("click",()=>send("/api/music",{action:b.dataset.music},"musicresult")));document.querySelectorAll("[data-server]").forEach(b=>b.addEventListener("click",()=>send("/api/server",{action:b.dataset.server},"serverresult")));`);});
// Welcome/goodbye dashboard settings
const settingsForm=$("settingsform");
if(settingsForm){
 const fields=["welcomeMessage","welcomeChannel","welcomeImage","goodbyeMessage","goodbyeChannel","goodbyeImage"];
 const values=()=>Object.fromEntries(fields.map(k=>[k,$(k).value.trim()]));
 const showPreview=(kind)=>{const v=values(),message=v[kind+"Message"].replaceAll("{user}","Superstar").replaceAll("{server}","The Pizzaplex");const img=v[kind+"Image"];const box=$("settingspreview");box.style.display="block";box.innerHTML="<strong>"+(kind==="welcome"?"Welcome preview":"Goodbye preview")+"</strong><p></p>"+(img&&/^https?:\/\//i.test(img)?"<img alt=\"Preview picture\" style=\"max-width:100%;max-height:220px;border-radius:12px\" src=\""+img.replace(/&/g,"&amp;").replace(/"/g,"&quot;")+"\">":"");box.querySelector("p").textContent=message;};
 fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"get"})}).then(r=>r.json()).then(d=>{if(d.settings)fields.forEach(k=>{if(d.settings[k]!==undefined)$(k).value=d.settings[k];});$("settingsresult").textContent=d.message||"Settings loaded.";}).catch(()=>{$("settingsresult").textContent="Could not load settings.";});
 settingsForm.addEventListener("submit",async e=>{e.preventDefault();$("settingsresult").textContent="Saving…";try{const r=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save",settings:values()})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Save failed");$("settingsresult").textContent=d.message||"Settings saved."; }catch(err){$("settingsresult").textContent=err.message;}});
 $("previewWelcome").addEventListener("click",()=>showPreview("welcome"));$("previewGoodbye").addEventListener("click",()=>showPreview("goodbye"));
 document.querySelectorAll("[data-upload]").forEach(button=>button.addEventListener("click",async()=>{
  const input=$(button.dataset.upload),file=input.files&&input.files[0];if(!file){$("settingsresult").textContent="Choose an image first.";return;}
  const form=new FormData();form.append("image",file);$("settingsresult").textContent="Uploading image…";
  try{const r=await fetch("/api/upload-image",{method:"POST",body:form});const d=await r.json();if(!r.ok)throw new Error(d.error||"Upload failed");const field=button.dataset.upload==="welcomeUpload"?"welcomeImage":"goodbyeImage";$(field).value=d.url;$("settingsresult").textContent="Image uploaded. Save settings to apply it to Freddy.";showPreview(field==="welcomeImage"?"welcome":"goodbye");}catch(err){$("settingsresult").textContent=err.message;}
 }));

}
app.get("/dashboard.js",(req,res)=>res.redirect("/app.js"));
app.get("/dashboard",(req,res,next)=>next()); // route kept for static compatibility
app.get("/health",(req,res)=>res.json({ok:true}));
app.post("/logout",(req,res)=>req.session.destroy(()=>res.redirect("/")));
app.listen(PORT,()=>console.log("Glamrock Freddy website listening on port "+PORT));
