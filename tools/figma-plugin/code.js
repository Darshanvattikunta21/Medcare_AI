// MediCare AI — 42-Page Mobile UI Figma Plugin (FULLY FIXED)
// Mobile frame: 390 x 844 px (iPhone 14 Pro)

const UI_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff;color:#111;padding:18px;width:320px}
.hdr{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.hdr-icon{width:40px;height:40px;background:#1D9E75;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0}
.hdr-t{font-size:15px;font-weight:700}.hdr-s{font-size:11px;color:#888;margin-top:1px}
.info{background:#F0FDF9;border:1px solid #A7F3D0;border-radius:10px;padding:13px;margin-bottom:14px;font-size:12px;color:#065F46;line-height:1.6}
.info strong{display:block;font-size:13px;margin-bottom:4px}
.groups{margin-bottom:14px;max-height:240px;overflow-y:auto}
.grp{margin-bottom:10px}
.grp-title{font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.grp-pages{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.page-pill{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:5px 8px;font-size:11px;color:#374151;display:flex;align-items:center;gap:4px}
.page-pill span{color:#1D9E75;font-weight:700;min-width:16px}
.btn{width:100%;padding:12px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;margin-bottom:7px}
.btn-p{background:#1D9E75;color:#fff}.btn-p:hover{background:#0F6E56}.btn-p:disabled{background:#9FE1CB;cursor:not-allowed}
.btn-s{background:#fff;color:#888;border:1px solid #E5E7EB}.btn-s:hover{background:#F9FAFB}
.prog{display:none;margin-top:10px;padding:12px;background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB}
.prog.on{display:block}.prog-msg{font-size:12px;color:#6B7280;margin-bottom:6px}
.bar-w{background:#E5E7EB;border-radius:99px;height:5px}.bar{height:5px;background:#1D9E75;border-radius:99px;width:0%;transition:width .3s}
.done{display:none;margin-top:10px;padding:14px;background:#D1FAE5;border-radius:8px;text-align:center}
.done.on{display:block}.done p{font-size:14px;font-weight:700;color:#065F46}.done small{font-size:11px;color:#059669}
.err{display:none;margin-top:8px;padding:10px;background:#FEF2F2;border-radius:8px;font-size:11px;color:#DC2626;word-break:break-all}
.err.on{display:block}
.footer{font-size:10px;color:#C0C0C0;margin-top:10px;line-height:1.5}
</style></head><body>
<div class="hdr"><div class="hdr-icon">M</div><div><div class="hdr-t">MediCare AI</div><div class="hdr-s">42-Page Mobile UI Generator</div></div></div>
<div class="info"><strong>What gets generated</strong>42 mobile screens (390x844px) — complete AI medicine delivery app.</div>
<div class="groups" id="groups"></div>
<button class="btn btn-p" id="btnGen" onclick="generate()">&#9654; Generate All 42 Pages</button>
<button class="btn btn-s" onclick="cancel()">Close plugin</button>
<div class="prog" id="prog"><div class="prog-msg" id="progMsg">Starting...</div><div class="bar-w"><div class="bar" id="bar"></div></div></div>
<div class="done" id="done"><p>&#10003; All 42 pages created!</p><small>Frames arranged in rows on your canvas.</small></div>
<div class="err" id="errBox"></div>
<div class="footer">Frames: 6 rows of 7 &bull; 390x844px &bull; 60px gap</div>
<script>
var GROUPS=[
  {title:"Onboarding",pages:["Splash","Onboarding 1","Onboarding 2","Onboarding 3"]},
  {title:"Auth",pages:["Login","Sign Up","OTP Verify","Forgot Password"]},
  {title:"Home & Dashboard",pages:["Home Dashboard","Notifications","Search Active","Quick Reorder","Health Profile"]},
  {title:"AI Symptom Flow",pages:["Symptom Input","AI Analysing","AI Results","AI Recommendations","Dosage Detail"]},
  {title:"Medicine Catalog",pages:["Browse Medicines","Category View","Medicine Detail","Reviews","Compare"]},
  {title:"Cart & Checkout",pages:["Cart","Delivery Address","Add Address","Payment","Order Confirm"]},
  {title:"Order Management",pages:["Order Success","Live Tracking","Order History","Order Detail","Return Request"]},
  {title:"Prescription",pages:["Upload Rx","Rx Verified","Rx Vault"]},
  {title:"Settings & Profile",pages:["User Profile","Edit Profile","App Settings","Help & Support","About / Terms","Rate & Review"]}
];
var html=''; var n=1;
GROUPS.forEach(function(g){
  html+='<div class="grp"><div class="grp-title">'+g.title+'</div><div class="grp-pages">';
  g.pages.forEach(function(p){html+='<div class="page-pill"><span>'+n+'</span>'+p+'</div>'; n++;});
  html+='</div></div>';
});
document.getElementById("groups").innerHTML=html;
var running=false;
function generate(){
  if(running) return;
  running=true;
  document.getElementById("btnGen").disabled=true;
  document.getElementById("prog").className="prog on";
  document.getElementById("done").className="done";
  document.getElementById("errBox").className="err";
  parent.postMessage({pluginMessage:{type:"generate"}},"*");
}
function cancel(){parent.postMessage({pluginMessage:{type:"cancel"}},"*");}
window.onmessage=function(e){
  var m=e.data.pluginMessage; if(!m)return;
  if(m.type==="progress"){
    document.getElementById("progMsg").textContent=m.msg+" ("+m.n+"/42)";
    document.getElementById("bar").style.width=Math.round((m.n/42)*100)+"%";
  }
  if(m.type==="done"){
    document.getElementById("bar").style.width="100%";
    setTimeout(function(){
      document.getElementById("prog").className="prog";
      document.getElementById("done").className="done on";
      document.getElementById("btnGen").disabled=false;
      running=false;
    },400);
  }
  if(m.type==="error"){
    document.getElementById("prog").className="prog";
    var eb=document.getElementById("errBox"); eb.textContent="Error: "+m.msg; eb.className="err on";
    document.getElementById("btnGen").disabled=false;
    running=false;
  }
};
<\/script></body></html>`;

figma.showUI(UI_HTML, { width: 340, height: 580, title: "MediCare AI — 42 Pages" });

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const W = 390, H = 844;
const NAV_H = 83;
const STATUS_H = 44;
const HEADER_H = 56;
const CONTENT_TOP = STATUS_H + HEADER_H;
const CONTENT_BOT_NAV = H - NAV_H - 8;
const CONTENT_BOT = H - 16;

const GREEN       = "#1D9E75";
const GREEN_DARK  = "#0F6E56";
const GREEN_LIGHT = "#D1FAE5";
const GREEN_MID   = "#5DCAA5";
const GREEN_PAL   = "#F0FDF9";
const WHITE       = "#FFFFFF";
const BLACK       = "#111827";
const GRAY1       = "#374151";
const GRAY2       = "#6B7280";
const GRAY3       = "#9CA3AF";
const GRAY4       = "#D1D5DB";
const GRAY5       = "#F3F4F6";
const GRAY6       = "#F9FAFB";
const RED         = "#EF4444";
const ORANGE      = "#F97316";
const BLUE        = "#3B82F6";
const PURPLE      = "#8B5CF6";

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function rgb(h) {
  return { r: parseInt(h.slice(1,3),16)/255, g: parseInt(h.slice(3,5),16)/255, b: parseInt(h.slice(5,7),16)/255 };
}
function fill(h)     { return [{ type:"SOLID", color: rgb(h) }]; }
function fillA(h, a) { return [{ type:"SOLID", color: rgb(h), opacity: a }]; }

function fr(w, h, hex) {
  const f = figma.createFrame(); f.resize(w, h);
  f.fills = hex ? fill(hex) : [{ type:"SOLID", color:{r:1,g:1,b:1}, opacity:0 }];
  f.clipsContent = true; return f;
}
function rc(w, h, hex, r) {
  const x = figma.createFrame(); x.resize(w, h); x.fills = fill(hex);
  x.clipsContent = false;
  if (r) x.cornerRadius = r; return x;
}
function el(w, h, hex, a) {
  const e = figma.createEllipse(); e.resize(w, h);
  e.fills = (a !== undefined) ? fillA(hex, a) : fill(hex); return e;
}
function pos(n, x, y) { n.x = x; n.y = y; return n; }

async function tx(str, sz, style, col, w, lh) {
  await figma.loadFontAsync({ family:"Inter", style: style||"Regular" });
  const t = figma.createText();
  t.fontName = { family:"Inter", style: style||"Regular" };
  t.characters = String(str); t.fontSize = sz||14;
  t.fills = fill(col||BLACK);
  if (w) { t.textAutoResize = "HEIGHT"; t.resize(w, t.height); }
  if (lh) t.lineHeight = { value: lh, unit:"PIXELS" };
  return t;
}
function ap(parent, ...children) {
  children.forEach(c => { if (c) parent.appendChild(c); }); return parent;
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
async function statusBar(f, dark) {
  const bar = fr(W, 44); bar.fills = []; bar.name = "Status Bar";
  const time = await tx("9:41", 13, "Semi Bold", dark ? WHITE : BLACK);
  pos(time, 16, 14); ap(bar, time);
  const sig = rc(16, 10, dark ? WHITE : GRAY2, 2); pos(sig, W-70, 17); ap(bar, sig);
  const bat = rc(22, 11, dark ? WHITE : GRAY2, 3); pos(bat, W-42, 16); ap(bar, bat);
  ap(f, bar); return bar;
}

async function bottomNav(f, active) {
  const nav = fr(W, NAV_H, WHITE); nav.name = "Bottom Nav"; pos(nav, 0, H - NAV_H);
  const border = rc(W, 1, GRAY4); pos(border, 0, 0); ap(nav, border);
  const items = [
    {icon:"⌂", label:"Home",     id:"home"},
    {icon:"⚕", label:"AI Doctor",id:"ai"},
    {icon:"💊", label:"Medicines",id:"med"},
    {icon:"📦", label:"Orders",   id:"orders"},
    {icon:"👤", label:"Profile",  id:"profile"}
  ];
  for (let i = 0; i < items.length; i++) {
    const it = items[i]; const isActive = it.id === active;
    const dot = fr(62, 56); dot.fills = isActive ? fillA(GREEN, 0.08) : [];
    dot.cornerRadius = 12; pos(dot, 16 + i * 72, 10);
    const ic = await tx(it.icon, 20, "Regular", isActive ? GREEN : GRAY3); pos(ic, 18, 6); ap(dot, ic);
    const lb = await tx(it.label, 10, isActive ? "Semi Bold" : "Regular", isActive ? GREEN : GRAY3);
    pos(lb, Math.max(4, 32 - it.label.length * 3), 30); ap(dot, lb);
    ap(nav, dot);
  }
  ap(f, nav); return nav;
}

async function topHeader(f, title, subtitle, light) {
  const hdr = fr(W, 56); hdr.fills = []; hdr.name = "Top Header";
  const back = await tx("←", 22, "Regular", light ? WHITE : BLACK); pos(back, 16, 16); ap(hdr, back);
  const t = await tx(title, 18, "Semi Bold", light ? WHITE : BLACK, 230); pos(t, 52, 14); ap(hdr, t);
  if (subtitle) { const s = await tx(subtitle, 12, "Regular", light ? GREEN_MID : GRAY2, 200); pos(s, 52, 34); ap(hdr, s); }
  ap(f, hdr); return hdr;
}

async function mkPill(label, bgHex, textHex) {
  const p = fr(label.length * 7 + 20, 26, bgHex); p.cornerRadius = 13;
  const t = await tx(label, 11, "Semi Bold", textHex); pos(t, 10, 6); ap(p, t); return p;
}

function card(w, h, hex, r) {
  const c = fr(w, h, hex || WHITE); c.cornerRadius = r || 14;
  c.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; c.strokeWeight = 1; return c;
}

async function inputField(f, label, placeholder, y, icon) {
  if (y > CONTENT_BOT - 80) return y;
  if (label) { const l = await tx(label, 13, "Semi Bold", GRAY1); pos(l, 24, y); ap(f, l); y += 22; }
  const box = fr(W - 48, 48, GRAY6); box.cornerRadius = 12;
  box.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; box.strokeWeight = 1; pos(box, 24, y);
  const ph = await tx(placeholder, 14, "Regular", GRAY3, W - 96); pos(ph, 16, 14); ap(box, ph);
  if (icon) { const ic = await tx(icon, 16, "Regular", GRAY3); pos(ic, W - 96, 15); ap(box, ic); }
  ap(f, box); return y + 48;
}

async function ctaBtn(f, label, y, outline) {
  if (y > CONTENT_BOT - 52) return y;
  const btn = fr(W - 48, 50, outline ? WHITE : GREEN); btn.cornerRadius = 14;
  if (outline) { btn.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; btn.strokeWeight = 1.5; }
  pos(btn, 24, y);
  const t = await tx(label, 15, "Semi Bold", outline ? GREEN : WHITE, W - 48);
  t.textAlignHorizontal = "CENTER"; pos(t, 0, 14); ap(btn, t); ap(f, btn); return y + 50;
}

async function sectionHead(f, title, action, y) {
  if (y > CONTENT_BOT - 28) return y;
  const t = await tx(title, 15, "Bold", BLACK); pos(t, 24, y); ap(f, t);
  if (action) { const a = await tx(action, 13, "Medium", GREEN); pos(a, W - 80, y + 1); ap(f, a); }
  return y + 28;
}

async function medCard(f, name, brand, price, tag, y, bot) {
  const limit = bot || CONTENT_BOT;
  if (y + 72 > limit) return y;
  const c = card(W - 48, 72, WHITE, 12); pos(c, 24, y);
  const dot = rc(44, 44, GREEN_LIGHT, 10); pos(dot, 10, 14); ap(c, dot);
  const ic = await tx("💊", 20, "Regular", GREEN); pos(ic, 10, 10); ap(dot, ic);
  const nm = await tx(name, 13, "Semi Bold", BLACK, 165); pos(nm, 64, 8); ap(c, nm);
  const br = await tx(brand, 11, "Regular", GRAY2, 165); pos(br, 64, 26); ap(c, br);
  const pr = await tx(price, 13, "Bold", GREEN); pos(pr, 64, 44); ap(c, pr);
  if (tag) { const tg = await mkPill(tag, GREEN_LIGHT, "#065F46"); pos(tg, W - tg.width - 72, 44); ap(c, tg); }
  const addBtn = fr(32, 32, GREEN); addBtn.cornerRadius = 9; pos(addBtn, W - 52, 20); ap(c, addBtn);
  const plus = await tx("+", 20, "Bold", WHITE); pos(plus, 8, 3); ap(addBtn, plus);
  ap(f, c); return y + 80;
}

// ─── PAGE BUILDERS ────────────────────────────────────────────────────────────

async function p01_Splash() {
  const f = fr(W, H, GREEN); f.name = "01 — Splash Screen";
  const c1 = el(340, 340, WHITE, 0.06); pos(c1, -50, 420); ap(f, c1);
  const c2 = el(220, 220, WHITE, 0.05); pos(c2, 210, -40); ap(f, c2);
  const logo = fr(96, 96, WHITE); logo.cornerRadius = 28; pos(logo, W/2 - 48, 290); ap(f, logo);
  const lt = await tx("M", 52, "Bold", GREEN); pos(lt, 26, 16); ap(logo, lt);
  const t1 = await tx("MediCare AI", 28, "Bold", WHITE, W); t1.textAlignHorizontal = "CENTER"; pos(t1, 0, 406); ap(f, t1);
  const t2 = await tx("Smart Health. Fast Delivery.", 15, "Regular", GREEN_LIGHT, W); t2.textAlignHorizontal = "CENTER"; pos(t2, 0, 440); ap(f, t2);
  for (let i = 0; i < 3; i++) { const d = rc(8, 8, WHITE, 4); if (i > 0) d.opacity = 0.4; pos(d, W/2 - 4 + i * 18, 760); ap(f, d); }
  return f;
}

async function p02_Onboard1() {
  const f = fr(W, H, WHITE); f.name = "02 — Onboarding 1";
  const blob = el(340, 280, GREEN_PAL, 1); pos(blob, 25, 70); ap(f, blob);
  const ic = await tx("🤖", 72, "Regular", GREEN); pos(ic, W/2 - 44, 110); ap(f, ic);
  const skip = await tx("Skip", 14, "Medium", GRAY2); pos(skip, W - 56, 52); ap(f, skip);
  const t1 = await tx("Meet Your", 32, "Bold", BLACK, W - 48); pos(t1, 24, 360); ap(f, t1);
  const t2 = await tx("AI Health Assistant", 32, "Bold", GREEN, W - 48); pos(t2, 24, 400); ap(f, t2);
  const sub = await tx("Describe any symptom and our AI instantly identifies the condition and recommends the right medicine.", 14, "Regular", GRAY2, W - 48, 22); pos(sub, 24, 454); ap(f, sub);
  for (let i = 0; i < 3; i++) { const d = rc(i === 0 ? 24 : 8, 8, i === 0 ? GREEN : GRAY4, 4); pos(d, 24 + i * 18, 692); ap(f, d); }
  await ctaBtn(f, "Next →", 718);
  return f;
}

async function p03_Onboard2() {
  const f = fr(W, H, WHITE); f.name = "03 — Onboarding 2";
  const blob = el(340, 280, "#EFF6FF", 1); pos(blob, 25, 70); ap(f, blob);
  const ic = await tx("💊", 72, "Regular", BLUE); pos(ic, W/2 - 44, 110); ap(f, ic);
  const skip = await tx("Skip", 14, "Medium", GRAY2); pos(skip, W - 56, 52); ap(f, skip);
  const t1 = await tx("10,000+", 32, "Bold", BLUE, W - 48); pos(t1, 24, 360); ap(f, t1);
  const t2 = await tx("Medicines In Stock", 28, "Bold", BLACK, W - 48); pos(t2, 24, 400); ap(f, t2);
  const sub = await tx("Browse our full catalog, search by disease, or upload a prescription — all in one place.", 14, "Regular", GRAY2, W - 48, 22); pos(sub, 24, 450); ap(f, sub);
  for (let i = 0; i < 3; i++) { const d = rc(i === 1 ? 24 : 8, 8, i === 1 ? BLUE : GRAY4, 4); pos(d, 24 + i * 18, 692); ap(f, d); }
  await ctaBtn(f, "Next →", 718);
  return f;
}

async function p04_Onboard3() {
  const f = fr(W, H, WHITE); f.name = "04 — Onboarding 3";
  const blob = el(340, 280, "#FFF7ED", 1); pos(blob, 25, 70); ap(f, blob);
  const ic = await tx("🚚", 72, "Regular", ORANGE); pos(ic, W/2 - 44, 110); ap(f, ic);
  const skip = await tx("Skip", 14, "Medium", GRAY2); pos(skip, W - 56, 52); ap(f, skip);
  const t1 = await tx("Delivered In", 32, "Bold", BLACK, W - 48); pos(t1, 24, 360); ap(f, t1);
  const t2 = await tx("2–4 Hours", 32, "Bold", ORANGE, W - 48); pos(t2, 24, 400); ap(f, t2);
  const sub = await tx("Same-day doorstep delivery for all medicines. Track your order live on a map.", 14, "Regular", GRAY2, W - 48, 22); pos(sub, 24, 450); ap(f, sub);
  for (let i = 0; i < 3; i++) { const d = rc(i === 2 ? 24 : 8, 8, i === 2 ? ORANGE : GRAY4, 4); pos(d, 24 + i * 18, 692); ap(f, d); }
  await ctaBtn(f, "Get Started", 718);
  return f;
}

async function p05_Login() {
  const f = fr(W, H, WHITE); f.name = "05 — Login";
  await statusBar(f, false);
  const logo = fr(56, 56, GREEN); logo.cornerRadius = 16; pos(logo, W/2 - 28, 60);
  const lt = await tx("M", 30, "Bold", WHITE); pos(lt, 14, 10); ap(logo, lt); ap(f, logo);
  const t = await tx("Welcome Back", 24, "Bold", BLACK, W - 48); t.textAlignHorizontal = "CENTER"; pos(t, 24, 130); ap(f, t);
  const s = await tx("Sign in to your account", 14, "Regular", GRAY2, W - 48); s.textAlignHorizontal = "CENTER"; pos(s, 24, 160); ap(f, s);
  const gb = fr(W - 48, 48, GRAY6); gb.cornerRadius = 14;
  gb.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; gb.strokeWeight = 1; pos(gb, 24, 196);
  const gt = await tx("G   Continue with Google", 14, "Medium", GRAY1, W - 96); pos(gt, 40, 14); ap(gb, gt); ap(f, gb);
  const dl = rc(100, 1, GRAY4); pos(dl, 24, 262); ap(f, dl);
  const dmt = await tx("or", 12, "Regular", GRAY3); pos(dmt, W/2 - 8, 256); ap(f, dmt);
  const dr = rc(100, 1, GRAY4); pos(dr, W - 124, 262); ap(f, dr);
  let y = 274;
  y = await inputField(f, "Email address", "your@email.com", y, "✉"); y += 10;
  y = await inputField(f, "Password", "Enter password", y, "🔒");
  const fp = await tx("Forgot Password?", 13, "Medium", GREEN); pos(fp, W - 168, y + 8); ap(f, fp); y += 38;
  y = await ctaBtn(f, "Sign In", y + 8);
  const reg = await tx("Don't have an account?  Sign Up", 14, "Regular", GRAY2, W - 48); reg.textAlignHorizontal = "CENTER"; pos(reg, 24, Math.min(y + 12, 800)); ap(f, reg);
  return f;
}

async function p06_SignUp() {
  const f = fr(W, H, WHITE); f.name = "06 — Sign Up";
  await statusBar(f, false);
  const t = await tx("Create Account", 22, "Bold", BLACK, W - 48); pos(t, 24, 54); ap(f, t);
  const s = await tx("Join MediCare AI for free", 13, "Regular", GRAY2, W - 48); pos(s, 24, 82); ap(f, s);
  let y = 114;
  y = await inputField(f, "Full Name", "Ravi Kumar", y, "👤"); y += 10;
  y = await inputField(f, "Email Address", "ravi@email.com", y, "✉"); y += 10;
  y = await inputField(f, "Phone Number", "+91 99999 00000", y, "📱"); y += 10;
  y = await inputField(f, "Password", "Create a strong password", y, "🔒"); y += 10;
  y = await inputField(f, "Date of Birth", "DD / MM / YYYY", y, "📅"); y += 18;
  y = await ctaBtn(f, "Create Account", y);
  const login = await tx("Already have an account?  Sign In", 14, "Regular", GRAY2, W - 48); login.textAlignHorizontal = "CENTER"; pos(login, 24, Math.min(y + 10, 814)); ap(f, login);
  return f;
}

async function p07_OTP() {
  const f = fr(W, H, WHITE); f.name = "07 — OTP Verification";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Verify Phone", "", false); pos(hdr, 0, 44);
  const ic = await tx("📱", 52, "Regular", GREEN); pos(ic, W/2 - 28, 120); ap(f, ic);
  const t = await tx("Enter OTP", 24, "Bold", BLACK, W - 48); t.textAlignHorizontal = "CENTER"; pos(t, 24, 188); ap(f, t);
  const s = await tx("We sent a 6-digit code to +91 98765 43210", 14, "Regular", GRAY2, W - 48, 22); s.textAlignHorizontal = "CENTER"; pos(s, 24, 222); ap(f, s);
  for (let i = 0; i < 6; i++) {
    const bw = 48;
    const b = fr(bw, 58, GRAY6); b.cornerRadius = 14;
    b.strokes = [{ type:"SOLID", color: rgb(i === 0 ? GREEN : GRAY4) }]; b.strokeWeight = i === 0 ? 2 : 1;
    pos(b, 21 + i * (bw + 8), 282);
    if (i === 0) { const d = await tx("4", 22, "Bold", GREEN); pos(d, 16, 16); ap(b, d); }
    ap(f, b);
  }
  const res = await tx("Resend OTP in 00:45", 13, "Regular", GRAY2, W - 48); res.textAlignHorizontal = "CENTER"; pos(res, 24, 360); ap(f, res);
  await ctaBtn(f, "Verify OTP", 402);
  return f;
}

async function p08_ForgotPwd() {
  const f = fr(W, H, WHITE); f.name = "08 — Forgot Password";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Reset Password", "", false); pos(hdr, 0, 44);
  const ic = await tx("🔐", 52, "Regular", ORANGE); pos(ic, W/2 - 28, 118); ap(f, ic);
  const t = await tx("Forgot your password?", 22, "Bold", BLACK, W - 48); t.textAlignHorizontal = "CENTER"; pos(t, 24, 188); ap(f, t);
  const s = await tx("Enter your registered email. We'll send a reset link.", 14, "Regular", GRAY2, W - 48, 22); s.textAlignHorizontal = "CENTER"; pos(s, 24, 220); ap(f, s);
  await inputField(f, "Email Address", "your@email.com", 278, "✉");
  await ctaBtn(f, "Send Reset Link", 352);
  const back = await tx("← Back to Sign In", 14, "Medium", GREEN, W - 48); back.textAlignHorizontal = "CENTER"; pos(back, 24, 420); ap(f, back);
  return f;
}

// ─── PAGE 9: HOME DASHBOARD (FULLY INLINED - NO HELPER CALLS FOR CARDS) ──────
async function p09_Home() {
  const f = fr(W, H, GRAY6); f.name = "09 — Home Dashboard";
  await statusBar(f, false);

  // Hero banner
  const hero = fr(W, 170, GREEN); hero.name = "Hero Banner"; pos(hero, 0, 0);
  const heroCircle = el(180, 180, WHITE, 0.07); pos(heroCircle, 230, 0); ap(hero, heroCircle);
  const greeting = await tx("Good Morning, Ravi 👋", 17, "Bold", WHITE, 250);
  pos(greeting, 18, 44); ap(hero, greeting);
  const heroSub = await tx("How are you feeling today?", 12, "Regular", GREEN_LIGHT, 250);
  pos(heroSub, 18, 68); ap(hero, heroSub);
  const notifBtn = fr(34, 34, WHITE); notifBtn.cornerRadius = 10;
  notifBtn.fills = fillA(WHITE, 0.2); pos(notifBtn, W - 50, 40);
  const notifIc = await tx("🔔", 16, "Regular", WHITE); pos(notifIc, 8, 6); ap(notifBtn, notifIc); ap(hero, notifBtn);
  const searchBar = fr(W - 32, 42, WHITE); searchBar.cornerRadius = 12;
  searchBar.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; searchBar.strokeWeight = 1; pos(searchBar, 16, 118);
  const searchTxt = await tx("🔍  Search medicines or symptoms...", 13, "Regular", GRAY3, 260);
  pos(searchTxt, 12, 12); ap(searchBar, searchTxt); ap(hero, searchBar);
  ap(f, hero);

  // AI symptom card
  const aiCard = fr(W - 32, 82, GREEN); aiCard.cornerRadius = 16; pos(aiCard, 16, 180);
  const aiCircle = el(100, 100, WHITE, 0.08); pos(aiCircle, 250, -10); ap(aiCard, aiCircle);
  const aiTitle = await tx("🤖  AI Symptom Checker", 15, "Bold", WHITE, 210); pos(aiTitle, 14, 14); ap(aiCard, aiTitle);
  const aiSub = await tx("Describe symptoms → get medicine", 12, "Regular", GREEN_LIGHT, 210);
  pos(aiSub, 14, 36); ap(aiCard, aiSub);
  const aiBtn = fr(90, 28, WHITE); aiBtn.cornerRadius = 8; pos(aiBtn, 14, 52);
  const aiBtnTxt = await tx("Try Now →", 11, "Semi Bold", GREEN); pos(aiBtnTxt, 10, 7); ap(aiBtn, aiBtnTxt);
  ap(aiCard, aiBtn); ap(f, aiCard);

  // Categories section header
  const catHeaderY = 278;
  const catLabel = await tx("Categories", 15, "Bold", BLACK); pos(catLabel, 24, catHeaderY); ap(f, catLabel);
  const seeAllCat = await tx("See All", 13, "Medium", GREEN); pos(seeAllCat, W - 64, catHeaderY + 1); ap(f, seeAllCat);

  // Category pills
  const catStartY = catHeaderY + 28;
  const catData = [
    { e: "💊", n: "Tablets" },
    { e: "💉", n: "Injections" },
    { e: "🩺", n: "Devices" },
    { e: "🌿", n: "Ayurveda" },
    { e: "🍼", n: "Baby" }
  ];
  for (let i = 0; i < catData.length; i++) {
    const catBox = fr(58, 68, WHITE); catBox.cornerRadius = 12;
    catBox.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; catBox.strokeWeight = 1;
    pos(catBox, 16 + i * 70, catStartY);
    const catEmoji = await tx(catData[i].e, 22, "Regular", GREEN); pos(catEmoji, 16, 10); ap(catBox, catEmoji);
    const catName = await tx(catData[i].n, 9, "Regular", GRAY2, 50);
    catName.textAlignHorizontal = "CENTER"; pos(catName, 4, 38); ap(catBox, catName);
    ap(f, catBox);
  }

  // Recommended section header
  const recHeaderY = catStartY + 76;
  const recLabel = await tx("Recommended For You", 15, "Bold", BLACK); pos(recLabel, 24, recHeaderY); ap(f, recLabel);
  const seeAllRec = await tx("See All", 13, "Medium", GREEN); pos(seeAllRec, W - 64, recHeaderY + 1); ap(f, seeAllRec);

  const navTop = H - NAV_H; // 761
  let cardY = recHeaderY + 28;

  // Medicine card 1 — fully inlined
  if (cardY + 72 < navTop - 8) {
    const mc1 = fr(W - 48, 72, WHITE); mc1.cornerRadius = 12;
    mc1.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; mc1.strokeWeight = 1;
    pos(mc1, 24, cardY);
    const dot1 = rc(44, 44, GREEN_LIGHT, 10); pos(dot1, 10, 14); ap(mc1, dot1);
    const dotIc1 = await tx("💊", 20, "Regular", GREEN); pos(dotIc1, 10, 10); ap(dot1, dotIc1);
    const mName1 = await tx("Paracetamol 500mg", 13, "Semi Bold", BLACK, 165); pos(mName1, 64, 8); ap(mc1, mName1);
    const mBrand1 = await tx("GSK Pharma", 11, "Regular", GRAY2, 165); pos(mBrand1, 64, 26); ap(mc1, mBrand1);
    const mPrice1 = await tx("₹32", 13, "Bold", GREEN); pos(mPrice1, 64, 44); ap(mc1, mPrice1);
    const mTag1 = fr(80, 22, GREEN_LIGHT); mTag1.cornerRadius = 11; pos(mTag1, W - 124, 49);
    const mTagTxt1 = await tx("Bestseller", 10, "Semi Bold", "#065F46", 80);
    mTagTxt1.textAlignHorizontal = "CENTER"; pos(mTagTxt1, 0, 5); ap(mTag1, mTagTxt1); ap(mc1, mTag1);
    const addBtn1 = fr(32, 32, GREEN); addBtn1.cornerRadius = 9; pos(addBtn1, W - 52, 20);
    const plusTxt1 = await tx("+", 20, "Bold", WHITE); pos(plusTxt1, 8, 3); ap(addBtn1, plusTxt1); ap(mc1, addBtn1);
    ap(f, mc1);
    cardY += 80;
  }

  // Medicine card 2 — fully inlined
  if (cardY + 72 < navTop - 8) {
    const mc2 = fr(W - 48, 72, WHITE); mc2.cornerRadius = 12;
    mc2.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; mc2.strokeWeight = 1;
    pos(mc2, 24, cardY);
    const dot2 = rc(44, 44, GREEN_LIGHT, 10); pos(dot2, 10, 14); ap(mc2, dot2);
    const dotIc2 = await tx("💊", 20, "Regular", GREEN); pos(dotIc2, 10, 10); ap(dot2, dotIc2);
    const mName2 = await tx("Vitamin C 1000mg", 13, "Semi Bold", BLACK, 165); pos(mName2, 64, 8); ap(mc2, mName2);
    const mBrand2 = await tx("HealthVit", 11, "Regular", GRAY2, 165); pos(mBrand2, 64, 26); ap(mc2, mBrand2);
    const mPrice2 = await tx("₹120", 13, "Bold", GREEN); pos(mPrice2, 64, 44); ap(mc2, mPrice2);
    const mTag2 = fr(36, 22, GREEN_LIGHT); mTag2.cornerRadius = 11; pos(mTag2, W - 80, 49);
    const mTagTxt2 = await tx("New", 10, "Semi Bold", "#065F46", 36);
    mTagTxt2.textAlignHorizontal = "CENTER"; pos(mTagTxt2, 0, 5); ap(mTag2, mTagTxt2); ap(mc2, mTag2);
    const addBtn2 = fr(32, 32, GREEN); addBtn2.cornerRadius = 9; pos(addBtn2, W - 52, 20);
    const plusTxt2 = await tx("+", 20, "Bold", WHITE); pos(plusTxt2, 8, 3); ap(addBtn2, plusTxt2); ap(mc2, addBtn2);
    ap(f, mc2);
  }

  await bottomNav(f, "home");
  return f;
}

async function p10_Notifications() {
  const f = fr(W, H, WHITE); f.name = "10 — Notifications";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Notifications", "", false); pos(hdr, 0, 44);
  const notifs = [
    { ic:"📦", t:"Order Shipped!", s:"Your Paracetamol order is on its way.", time:"2 min ago", col:BLUE },
    { ic:"🤖", t:"AI Tip", s:"Remember to take your evening dose of Metformin.", time:"1 hr ago", col:GREEN },
    { ic:"🎉", t:"Offer Unlocked!", s:"20% off on your next order. Code: MEDI20", time:"3 hr ago", col:ORANGE },
    { ic:"⚠️", t:"Low Stock Alert", s:"Amoxicillin 250mg is running low in your area.", time:"Yesterday", col:RED },
    { ic:"✅", t:"Order Delivered", s:"Order #MC-004521 delivered successfully.", time:"2 days ago", col:GREEN },
    { ic:"💊", t:"Refill Reminder", s:"Time to reorder Atorvastatin 10mg.", time:"3 days ago", col:PURPLE },
  ];
  let y = 108;
  for (const n of notifs) {
    if (y + 68 > CONTENT_BOT) break;
    const row = fr(W - 32, 66, WHITE); row.cornerRadius = 12;
    row.strokes = [{ type:"SOLID", color: rgb(GRAY5) }]; row.strokeWeight = 1; pos(row, 16, y);
    const dot = rc(38, 38, n.col, 10); dot.fills = fillA(n.col, 0.12); pos(dot, 10, 14); ap(row, dot);
    const di = await tx(n.ic, 18, "Regular", n.col); pos(di, 8, 8); ap(dot, di);
    const nt = await tx(n.t, 13, "Semi Bold", BLACK, 210); pos(nt, 58, 8); ap(row, nt);
    const ns = await tx(n.s, 11, "Regular", GRAY2, 210, 16); pos(ns, 58, 26); ap(row, ns);
    const tm = await tx(n.time, 10, "Regular", GRAY3); pos(tm, W - 90, 8); ap(row, tm);
    ap(f, row); y += 74;
  }
  return f;
}

async function p11_SearchActive() {
  const f = fr(W, H, WHITE); f.name = "11 — Search Active State";
  await statusBar(f, false);
  const sb = fr(W - 32, 44, GRAY6); sb.cornerRadius = 12;
  sb.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; sb.strokeWeight = 1.5; pos(sb, 16, 52);
  const st = await tx("🔍  fever", 14, "Regular", BLACK, 240); pos(st, 12, 12); ap(sb, st);
  const cl = await tx("✕", 15, "Regular", GRAY2); pos(cl, W - 48, 14); ap(sb, cl); ap(f, sb);
  const rt = await tx("Recent Searches", 12, "Semi Bold", GRAY2); pos(rt, 16, 112); ap(f, rt);
  const recents = ["diabetes", "paracetamol 500mg", "vitamin c", "blood pressure"];
  for (let i = 0; i < recents.length; i++) {
    const r = await tx("🕐  " + recents[i], 13, "Regular", GRAY1); pos(r, 16, 138 + i * 34); ap(f, r);
    const x = await tx("✕", 12, "Regular", GRAY3); pos(x, W - 40, 140 + i * 34); ap(f, x);
  }
  const dt = await tx("Results for \"fever\"", 13, "Bold", BLACK); pos(dt, 16, 282); ap(f, dt);
  let y = 308;
  const items = [
    { n:"Crocin 650mg", br:"GSK", pr:"₹28", tag:"Fever Relief" },
    { n:"Dolo 650mg", br:"Micro Labs", pr:"₹32", tag:"Popular" },
    { n:"Paracetamol IP", br:"Cipla", pr:"₹18", tag:"Generic" },
  ];
  for (const it of items) {
    y = await medCard(f, it.n, it.br, it.pr, it.tag, y, CONTENT_BOT_NAV);
  }
  await bottomNav(f, "home");
  return f;
}

async function p12_QuickReorder() {
  const f = fr(W, H, WHITE); f.name = "12 — Quick Reorder";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Quick Reorder", "Based on past orders", false); pos(hdr, 0, 44);
  const t = await tx("Reorder your regulars in one tap 🔄", 13, "Regular", GRAY2, W - 48); pos(t, 24, 108); ap(f, t);
  const items = [
    { n:"Metformin 500mg", br:"Sun Pharma", pr:"₹85", last:"Ordered 3 days ago" },
    { n:"Atorvastatin 10mg", br:"Cipla", pr:"₹120", last:"Ordered 1 week ago" },
    { n:"Amlodipine 5mg", br:"Pfizer", pr:"₹95", last:"Ordered 2 weeks ago" },
    { n:"Vitamin D3 60K", br:"HealthVit", pr:"₹180", last:"Ordered 1 month ago" },
  ];
  let y = 132;
  for (const it of items) {
    if (y + 84 > CONTENT_BOT - 68) break;
    const c = card(W - 32, 80, WHITE, 14); pos(c, 16, y);
    const ic = fr(46, 46, GREEN_LIGHT); ic.cornerRadius = 10; pos(ic, 10, 17);
    const ie = await tx("💊", 22, "Regular", GREEN); pos(ie, 10, 10); ap(ic, ie); ap(c, ic);
    const cn = await tx(it.n, 13, "Semi Bold", BLACK, 162); pos(cn, 66, 10); ap(c, cn);
    const cb = await tx(it.br, 11, "Regular", GRAY2, 162); pos(cb, 66, 28); ap(c, cb);
    const cp = await tx(it.pr, 13, "Bold", GREEN); pos(cp, 66, 46); ap(c, cp);
    const cl = await tx(it.last, 10, "Regular", GRAY3, 162); pos(cl, 66, 62); ap(c, cl);
    const rb = fr(86, 30, GREEN); rb.cornerRadius = 8; pos(rb, W - 100, 25);
    const rbt = await tx("Reorder", 12, "Semi Bold", WHITE); pos(rbt, 10, 8); ap(rb, rbt); ap(c, rb);
    ap(f, c); y += 88;
  }
  await ctaBtn(f, "Reorder All (4 items)", y + 8);
  return f;
}

async function p13_HealthProfile() {
  const f = fr(W, H, WHITE); f.name = "13 — Health Profile";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Health Profile", "Personal info & conditions", false); pos(hdr, 0, 44);
  const av = el(72, 72, GREEN_LIGHT, 1); pos(av, W/2 - 36, 108); ap(f, av);
  const ai = await tx("RK", 22, "Bold", GREEN); pos(ai, W/2 - 14, 126); ap(f, ai);
  const an = await tx("Ravi Kumar", 17, "Bold", BLACK, W - 48); an.textAlignHorizontal = "CENTER"; pos(an, 24, 192); ap(f, an);
  const ae = await tx("ravi@email.com", 12, "Regular", GRAY2, W - 48); ae.textAlignHorizontal = "CENTER"; pos(ae, 24, 214); ap(f, ae);
  const stats = [{ l:"Age", v:"34" }, { l:"Weight", v:"72 kg" }, { l:"Blood", v:"B+" }];
  const sw = (W - 48 - 24) / 3;
  for (let i = 0; i < 3; i++) {
    const sc = fr(sw, 56, GRAY6); sc.cornerRadius = 10; pos(sc, 24 + i * (sw + 12), 244);
    const sv = await tx(stats[i].v, 17, "Bold", GREEN, sw); sv.textAlignHorizontal = "CENTER"; pos(sv, 0, 8); ap(sc, sv);
    const sl = await tx(stats[i].l, 10, "Regular", GRAY2, sw); sl.textAlignHorizontal = "CENTER"; pos(sl, 0, 30); ap(sc, sl);
    ap(f, sc);
  }
  const ct = await tx("Chronic Conditions", 13, "Bold", BLACK); pos(ct, 24, 314); ap(f, ct);
  const conds = ["Diabetes Type 2", "Hypertension"];
  for (let i = 0; i < conds.length; i++) {
    const cb = fr(W - 48, 38, GREEN_PAL); cb.cornerRadius = 10; pos(cb, 24, 338 + i * 46);
    const ci = await tx("⚕  " + conds[i], 13, "Regular", GREEN_DARK, 250); pos(ci, 12, 10); ap(cb, ci); ap(f, cb);
  }
  const at2 = await tx("Current Medications", 13, "Bold", BLACK); pos(at2, 24, 434); ap(f, at2);
  const meds = ["Metformin 500mg", "Amlodipine 5mg"];
  for (let i = 0; i < meds.length; i++) {
    const mb = fr(W - 48, 38, GREEN_LIGHT); mb.cornerRadius = 10; pos(mb, 24, 458 + i * 46);
    const mi = await tx("💊  " + meds[i], 13, "Regular", GREEN_DARK, 250); pos(mi, 12, 10); ap(mb, mi); ap(f, mb);
  }
  await ctaBtn(f, "Edit Health Profile", 562);
  return f;
}

async function p14_SymptomInput() {
  const f = fr(W, H, WHITE); f.name = "14 — Symptom Input";
  await statusBar(f, false);
  const hdr = await topHeader(f, "AI Symptom Checker", "Tell us how you feel", false); pos(hdr, 0, 44);
  const ic = await tx("🩺", 40, "Regular", GREEN); pos(ic, W/2 - 24, 108); ap(f, ic);
  const t = await tx("What symptoms are you experiencing?", 20, "Bold", BLACK, W - 48, 30); pos(t, 24, 158); ap(f, t);
  const symptoms = ["Fever", "Headache", "Cold", "Cough", "Body Pain", "Fatigue", "Nausea", "Dizziness"];
  let sx = 24, sy = 216;
  for (const s of symptoms) {
    const sw2 = s.length * 9 + 20;
    if (sx + sw2 > W - 24) { sx = 24; sy += 38; }
    const sp = fr(sw2, 30, GRAY6); sp.cornerRadius = 15;
    sp.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; sp.strokeWeight = 1; pos(sp, sx, sy);
    const spt = await tx(s, 12, "Regular", GRAY1, sw2 - 12); spt.textAlignHorizontal = "CENTER"; pos(spt, 6, 7); ap(sp, spt);
    ap(f, sp); sx += sw2 + 8;
  }
  const ta = fr(W - 48, 80, GRAY6); ta.cornerRadius = 14;
  ta.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; ta.strokeWeight = 1.5; pos(ta, 24, sy + 48);
  const taP = await tx("Describe your symptoms in detail...", 12, "Regular", GRAY3, W - 80); pos(taP, 14, 14); ap(ta, taP); ap(f, ta);
  let dy = sy + 138;
  const dtxt = await tx("How long have symptoms lasted?", 12, "Semi Bold", GRAY1, W - 48); pos(dtxt, 24, dy); ap(f, dtxt); dy += 28;
  const durs = ["1 day", "2-3 days", "1 week", "2+ weeks"];
  for (let i = 0; i < 4; i++) {
    const db = fr(78, 32, i === 1 ? GREEN : GRAY6); db.cornerRadius = 10;
    if (i !== 1) { db.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; db.strokeWeight = 1; }
    pos(db, 24 + i * 86, dy);
    const dbt = await tx(durs[i], 11, i === 1 ? "Semi Bold" : "Regular", i === 1 ? WHITE : GRAY1, 78); dbt.textAlignHorizontal = "CENTER"; pos(dbt, 0, 9); ap(db, dbt); ap(f, db);
  }
  dy += 44;
  const stxt = await tx("Pain severity (1-10)", 12, "Semi Bold", GRAY1, W - 48); pos(stxt, 24, dy); ap(f, stxt); dy += 28;
  for (let i = 1; i <= 10; i++) {
    const sb2 = fr(28, 28, i <= 7 ? GREEN_LIGHT : i <= 9 ? "#FEF3C7" : "#FEE2E2"); sb2.cornerRadius = 6;
    const tc = i <= 7 ? GREEN : i <= 9 ? ORANGE : RED; pos(sb2, 14 + i * 30, dy);
    const sbt = await tx(String(i), 11, "Semi Bold", tc, 28); sbt.textAlignHorizontal = "CENTER"; pos(sbt, 0, 7); ap(sb2, sbt); ap(f, sb2);
  }
  await ctaBtn(f, "Analyse Symptoms →", Math.min(dy + 44, CONTENT_BOT - 52));
  return f;
}

async function p15_AIAnalysing() {
  const f = fr(W, H, WHITE); f.name = "15 — AI Analysing";
  await statusBar(f, false);
  const bg = fr(W, H); bg.fills = fillA(GREEN, 0.04); pos(bg, 0, 0); ap(f, bg);
  const c3 = el(280, 280, GREEN, 0.04); pos(c3, W/2 - 140, 200); ap(f, c3);
  const c2 = el(200, 200, GREEN, 0.07); pos(c2, W/2 - 100, 240); ap(f, c2);
  const c1 = el(130, 130, GREEN, 0.12); pos(c1, W/2 - 65, 275); ap(f, c1);
  const logo = fr(76, 76, GREEN); logo.cornerRadius = 22; pos(logo, W/2 - 38, 300);
  const lt = await tx("🤖", 36, "Regular", WHITE); pos(lt, 18, 16); ap(logo, lt); ap(f, logo);
  const t = await tx("Analysing Symptoms...", 22, "Bold", BLACK, W - 48); t.textAlignHorizontal = "CENTER"; pos(t, 24, 398); ap(f, t);
  const steps = [
    { e:"✓", t:"Symptoms recorded", done:true },
    { e:"⟳", t:"Matching disease patterns", done:false },
    { e:"◌", t:"Generating recommendations", done:false },
  ];
  for (let i = 0; i < steps.length; i++) {
    const sc = fr(W - 48, 42, GRAY6); sc.cornerRadius = 12; pos(sc, 24, 448 + i * 52);
    const se = await tx(steps[i].e, 15, "Bold", steps[i].done ? GREEN : GRAY3); pos(se, 12, 12); ap(sc, se);
    const st = await tx(steps[i].t, 13, "Regular", steps[i].done ? BLACK : GRAY3); pos(st, 38, 12); ap(sc, st); ap(f, sc);
  }
  return f;
}

async function p16_AIResults() {
  const f = fr(W, H, WHITE); f.name = "16 — AI Results";
  await statusBar(f, false);
  const hdr = await topHeader(f, "AI Analysis Result", "Based on your symptoms", false); pos(hdr, 0, 44);
  const dc = fr(W - 32, 98, GREEN); dc.cornerRadius = 16; pos(dc, 16, 108);
  const de = el(110, 110, WHITE, 0.07); pos(de, 210, -5); ap(dc, de);
  const di = await tx("🤖 AI Detected", 11, "Semi Bold", GREEN_LIGHT); pos(di, 14, 12); ap(dc, di);
  const dn = await tx("Viral Fever", 24, "Bold", WHITE, 210); pos(dn, 14, 32); ap(dc, dn);
  const dp = await tx("Confidence: 94%", 12, "Regular", GREEN_LIGHT, 200); pos(dp, 14, 64); ap(dc, dp); ap(f, dc);
  const sc = fr(W - 32, 78, GRAY6); sc.cornerRadius = 14; pos(sc, 16, 218);
  const sct = await tx("📋  Symptoms Matched", 12, "Semi Bold", GRAY1); pos(sct, 14, 10); ap(sc, sct);
  const scl = await tx("Fever · Headache · Body pain · Fatigue", 12, "Regular", GRAY2, W - 80); pos(scl, 14, 28); ap(sc, scl);
  const sca = await tx("Duration: 2–3 days  ·  Severity: 7/10", 11, "Regular", GRAY3, W - 80); pos(sca, 14, 48); ap(sc, sca); ap(f, sc);
  const wc = fr(W - 32, 44, RED); wc.cornerRadius = 12; wc.fills = fillA(RED, 0.08);
  wc.strokes = [{ type:"SOLID", color: rgb(RED) }]; wc.strokeWeight = 1; pos(wc, 16, 308);
  const wt = await tx("⚠️  Consult a doctor if fever exceeds 103°F or persists beyond 3 days", 11, "Regular", RED, W - 72); pos(wt, 14, 8); ap(wc, wt); ap(f, wc);
  const mt = await tx("Recommended Medicines", 15, "Bold", BLACK); pos(mt, 16, 366); ap(f, mt);
  let y = 396;
  y = await medCard(f, "Paracetamol 650mg", "GSK Pharma", "₹28", "AI Pick", y);
  y = await medCard(f, "Cetirizine 10mg", "Cipla", "₹22", "Anti-allergy", y);
  await ctaBtn(f, "Add All to Cart", y + 8);
  return f;
}

async function p17_AIMedRec() {
  const f = fr(W, H, WHITE); f.name = "17 — AI Medicine Recommendations";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Medicines For You", "AI recommended", false); pos(hdr, 0, 44);
  const bc = fr(W - 32, 46, GREEN); bc.cornerRadius = 14; pos(bc, 16, 106);
  const bt = await tx("🤖  Based on: Viral Fever (94% match)", 13, "Regular", WHITE, W - 80); pos(bt, 14, 14); ap(bc, bt); ap(f, bc);
  let y = 164;
  const recs = [
    { n:"Paracetamol 650mg", br:"GSK Pharma", pr:"₹28", tag:"Primary" },
    { n:"Ibuprofen 400mg", br:"Cipla", pr:"₹45", tag:"Alt." },
    { n:"Cetirizine 10mg", br:"Sun Pharma", pr:"₹22", tag:"Allergy" },
    { n:"ORS Sachets", br:"Electral", pr:"₹38", tag:"Hydration" },
    { n:"Multivitamin", br:"HealthVit", pr:"₹180", tag:"Recovery" },
  ];
  for (const r of recs) {
    y = await medCard(f, r.n, r.br, r.pr, r.tag, y, CONTENT_BOT - 60);
  }
  await ctaBtn(f, "Add All Recommended to Cart", Math.min(y + 8, CONTENT_BOT - 52));
  return f;
}

async function p18_Dosage() {
  const f = fr(W, H, WHITE); f.name = "18 — Dosage & Instructions";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Dosage Guide", "Paracetamol 650mg", false); pos(hdr, 0, 44);
  const ic = await tx("💊", 40, "Regular", GREEN); pos(ic, W/2 - 24, 108); ap(f, ic);
  const tn = await tx("Paracetamol 650mg", 19, "Bold", BLACK, W - 48); tn.textAlignHorizontal = "CENTER"; pos(tn, 24, 158); ap(f, tn);
  const tb = await tx("Manufactured by GSK Pharma", 12, "Regular", GRAY2, W - 48); tb.textAlignHorizontal = "CENTER"; pos(tb, 24, 182); ap(f, tb);
  const doses = [
    { ic:"🕐", l:"Dosage", v:"1–2 tablets every 6–8 hours" },
    { ic:"🍽️", l:"With Food", v:"Can be taken with or without food" },
    { ic:"⏱️", l:"Duration", v:"3–5 days max without prescription" },
    { ic:"⚠️", l:"Max Daily", v:"Do not exceed 4g (4000mg) per day" },
    { ic:"🚫", l:"Avoid", v:"Alcohol, other paracetamol products" },
  ];
  let y = 212;
  for (const d of doses) {
    if (y + 54 > CONTENT_BOT - 110) break;
    const dc = fr(W - 32, 52, GRAY6); dc.cornerRadius = 10; pos(dc, 16, y);
    const die = await tx(d.ic, 18, "Regular", GREEN); pos(die, 10, 16); ap(dc, die);
    const dl = await tx(d.l, 12, "Semi Bold", GRAY1); pos(dl, 40, 8); ap(dc, dl);
    const dv = await tx(d.v, 11, "Regular", GRAY2, W - 96); pos(dv, 40, 26); ap(dc, dv); ap(f, dc); y += 58;
  }
  const wt = await tx("⚠️ Side Effects", 13, "Bold", RED); pos(wt, 16, y + 6); ap(f, wt);
  const se = await tx("Nausea, dizziness, allergic reaction (rare). Stop use and consult doctor if rash develops.", 12, "Regular", GRAY2, W - 32, 18); pos(se, 16, y + 26); ap(f, se);
  await ctaBtn(f, "Add to Cart — ₹28", Math.min(y + 80, CONTENT_BOT - 52));
  return f;
}

async function p19_BrowseMeds() {
  const f = fr(W, H, GRAY6); f.name = "19 — Browse Medicines";
  await statusBar(f, false);
  const hdr2 = fr(W, 100, WHITE); hdr2.name = "Header"; pos(hdr2, 0, 0);
  const ht = await tx("Browse Medicines", 19, "Bold", BLACK); pos(ht, 18, 46); ap(hdr2, ht);
  const sb2 = fr(W - 32, 40, GRAY6); sb2.cornerRadius = 12;
  sb2.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; sb2.strokeWeight = 1; pos(sb2, 16, 54);
  const sbt = await tx("🔍  Search medicines...", 13, "Regular", GRAY3, 230); pos(sbt, 12, 12); ap(sb2, sbt); ap(hdr2, sb2); ap(f, hdr2);
  const cats2 = [
    { e:"💊", n:"Tablets", c:"1200+" }, { e:"🧴", n:"Syrups", c:"340+" },
    { e:"💉", n:"Injections", c:"180+" }, { e:"🩹", n:"First Aid", c:"220+" },
    { e:"🌿", n:"Ayurvedic", c:"450+" }, { e:"🍼", n:"Baby Care", c:"160+" },
  ];
  let y = 108;
  const cw = (W - 48) / 2;
  for (let i = 0; i < cats2.length; i += 2) {
    if (y + 76 > CONTENT_BOT_NAV - 90) break;
    for (let j = 0; j < 2; j++) {
      if (i + j >= cats2.length) break;
      const ct2 = cats2[i + j];
      const cc2 = fr(cw, 72, WHITE); cc2.cornerRadius = 12;
      cc2.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; cc2.strokeWeight = 1; pos(cc2, 16 + j * (cw + 16), y);
      const ce2 = await tx(ct2.e, 24, "Regular", GREEN); pos(ce2, 12, 20); ap(cc2, ce2);
      const cn2 = await tx(ct2.n, 14, "Semi Bold", BLACK); pos(cn2, 50, 18); ap(cc2, cn2);
      const cc3 = await tx(ct2.c + " items", 11, "Regular", GRAY2); pos(cc3, 50, 36); ap(cc2, cc3); ap(f, cc2);
    }
    y += 82;
  }
  let fy = await sectionHead(f, "Featured Products", "", y + 8);
  fy = await medCard(f, "Dolo 650", "Micro Labs", "₹32", "Popular", fy, CONTENT_BOT_NAV);
  await medCard(f, "Azithromycin 500mg", "Cipla", "₹120", "Antibiotic", fy, CONTENT_BOT_NAV);
  await bottomNav(f, "med");
  return f;
}

async function p20_CategoryView() {
  const f = fr(W, H, WHITE); f.name = "20 — Category View";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Antibiotics", "24 products found", false); pos(hdr, 0, 44);
  const filters = ["All", "Tablet", "Capsule", "Syrup", "Injection"];
  let fx = 16;
  for (let i = 0; i < filters.length; i++) {
    const fw = filters[i].length * 9 + 20;
    const fb = fr(fw, 30, i === 0 ? GREEN : GRAY6); fb.cornerRadius = 15;
    if (i !== 0) { fb.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; fb.strokeWeight = 1; }
    pos(fb, fx, 108);
    const ft = await tx(filters[i], 12, i === 0 ? "Semi Bold" : "Regular", i === 0 ? WHITE : GRAY1, fw - 12); ft.textAlignHorizontal = "CENTER"; pos(ft, 6, 7); ap(fb, ft); ap(f, fb); fx += fw + 8;
  }
  let y = 150;
  const abx = [
    { n:"Amoxicillin 500mg", br:"Cipla", pr:"₹85" },
    { n:"Azithromycin 500mg", br:"Sun Pharma", pr:"₹120" },
    { n:"Doxycycline 100mg", br:"GSK", pr:"₹95" },
    { n:"Cefpodoxime 200mg", br:"Lupin", pr:"₹145" },
    { n:"Metronidazole 400mg", br:"Abbott", pr:"₹38" },
  ];
  for (const a of abx) {
    y = await medCard(f, a.n, a.br, a.pr, "Rx", y);
  }
  return f;
}

async function p21_MedDetail() {
  const f = fr(W, H, WHITE); f.name = "21 — Medicine Detail";
  await statusBar(f, false);
  const hdr = await topHeader(f, "", "", false); pos(hdr, 0, 44);
  const hero = fr(W, 168, GREEN_PAL); hero.name = "Hero"; pos(hero, 0, 44);
  const mic = await tx("💊", 56, "Regular", GREEN); pos(mic, W/2 - 36, 55); ap(hero, mic); ap(f, hero);
  const tn = await tx("Paracetamol 650mg", 20, "Bold", BLACK, W - 48); pos(tn, 24, 222); ap(f, tn);
  const tb = await tx("by GSK Pharma · 15 Tablets", 13, "Regular", GRAY2, W - 48); pos(tb, 24, 248); ap(f, tb);
  const rr = await tx("★★★★☆  4.5  (2,341 reviews)", 13, "Regular", ORANGE, W - 48); pos(rr, 24, 270); ap(f, rr);
  const pr = await tx("₹28", 26, "Bold", GREEN); pos(pr, 24, 296); ap(f, pr);
  const pp = await tx("MRP ₹35 · Save 20%", 12, "Regular", GRAY3); pos(pp, 78, 306); ap(f, pp);
  const tags = ["Fever", "Pain Relief", "OTC"];
  for (let i = 0; i < 3; i++) {
    const tg = fr(tags[i].length * 8 + 18, 26, GREEN_LIGHT); tg.cornerRadius = 13; pos(tg, 24 + i * (tags[i].length * 8 + 26), 332);
    const tt = await tx(tags[i], 10, "Semi Bold", "#065F46", tags[i].length * 8 + 8); tt.textAlignHorizontal = "CENTER"; pos(tt, 9, 7); ap(tg, tt); ap(f, tg);
  }
  const desc = await tx("Paracetamol is used to relieve pain and reduce fever. Safe for most adults when taken as directed.", 12, "Regular", GRAY2, W - 48, 18); pos(desc, 24, 368); ap(f, desc);
  const kft = await tx("Key Facts", 13, "Bold", BLACK); pos(kft, 24, 420); ap(f, kft);
  const facts = ["Manufacturer: GSK Pharma Ltd", "Pack: 15 Tablets", "Shelf life: 24 months", "Storage: Below 25°C"];
  for (let i = 0; i < facts.length; i++) {
    if (440 + i * 22 > CONTENT_BOT - 80) break;
    const ft = await tx("• " + facts[i], 12, "Regular", GRAY2, W - 48); pos(ft, 24, 440 + i * 22); ap(f, ft);
  }
  const qf = fr(W - 32, 56, GRAY6); qf.cornerRadius = 14; pos(qf, 16, 760);
  const qm = fr(34, 34, WHITE); qm.cornerRadius = 9; qm.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; qm.strokeWeight = 1; pos(qm, 10, 11);
  const qmt = await tx("−", 17, "Bold", GRAY1); pos(qmt, 9, 5); ap(qm, qmt); ap(qf, qm);
  const qn = await tx("1", 15, "Bold", BLACK); pos(qn, 56, 16); ap(qf, qn);
  const qp = fr(34, 34, GREEN); qp.cornerRadius = 9; pos(qp, 80, 11);
  const qpt = await tx("+", 17, "Bold", WHITE); pos(qpt, 9, 5); ap(qp, qpt); ap(qf, qp);
  const atc = fr(194, 34, GREEN); atc.cornerRadius = 9; pos(atc, W - 220, 11);
  const atct = await tx("Add to Cart — ₹28", 12, "Semi Bold", WHITE, 194); atct.textAlignHorizontal = "CENTER"; pos(atct, 0, 9); ap(atc, atct); ap(qf, atc); ap(f, qf);
  return f;
}

async function p22_Reviews() {
  const f = fr(W, H, WHITE); f.name = "22 — Medicine Reviews";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Reviews", "Paracetamol 650mg", false); pos(hdr, 0, 44);
  const ov = fr(W - 32, 96, GRAY6); ov.cornerRadius = 14; pos(ov, 16, 108);
  const rt = await tx("4.5", 34, "Bold", BLACK); pos(rt, 18, 16); ap(ov, rt);
  const rs = await tx("★★★★☆", 17, "Regular", ORANGE, 140); pos(rs, 18, 54); ap(ov, rs);
  const rc2 = await tx("2,341 reviews", 11, "Regular", GRAY2, 140); pos(rc2, 18, 74); ap(ov, rc2);

  const bl1 = await tx("5★", 11, "Regular", GRAY2); pos(bl1, 170, 10); ap(ov, bl1);
  const bg1 = fr(120, 5, GRAY4); bg1.cornerRadius = 3; pos(bg1, 200, 13); ap(ov, bg1);
  const bf1 = fr(86, 5, GREEN); bf1.cornerRadius = 3; pos(bf1, 200, 13); ap(ov, bf1);

  const bl2 = await tx("4★", 11, "Regular", GRAY2); pos(bl2, 170, 26); ap(ov, bl2);
  const bg2 = fr(120, 5, GRAY4); bg2.cornerRadius = 3; pos(bg2, 200, 29); ap(ov, bg2);
  const bf2 = fr(22, 5, GREEN); bf2.cornerRadius = 3; pos(bf2, 200, 29); ap(ov, bf2);

  const bl3 = await tx("3★", 11, "Regular", GRAY2); pos(bl3, 170, 42); ap(ov, bl3);
  const bg3 = fr(120, 5, GRAY4); bg3.cornerRadius = 3; pos(bg3, 200, 45); ap(ov, bg3);
  const bf3 = fr(8, 5, GREEN); bf3.cornerRadius = 3; pos(bf3, 200, 45); ap(ov, bf3);

  const bl4 = await tx("2★", 11, "Regular", GRAY2); pos(bl4, 170, 58); ap(ov, bl4);
  const bg4 = fr(120, 5, GRAY4); bg4.cornerRadius = 3; pos(bg4, 200, 61); ap(ov, bg4);
  const bf4 = fr(4, 5, GREEN); bf4.cornerRadius = 3; pos(bf4, 200, 61); ap(ov, bf4);

  const bl5 = await tx("1★", 11, "Regular", GRAY2); pos(bl5, 170, 74); ap(ov, bl5);
  const bg5 = fr(120, 5, GRAY4); bg5.cornerRadius = 3; pos(bg5, 200, 77); ap(ov, bg5);
  const bf5 = fr(4, 5, GREEN); bf5.cornerRadius = 3; pos(bf5, 200, 77); ap(ov, bf5);
  ap(f, ov);

  const review1 = fr(W - 32, 100, WHITE); review1.cornerRadius = 14;
  review1.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; review1.strokeWeight = 1; pos(review1, 16, 216);
  const avatar1 = fr(34, 34, GREEN_LIGHT); avatar1.cornerRadius = 17; pos(avatar1, 12, 14); ap(review1, avatar1);
  const avatar1Text = await tx("P", 15, "Bold", GREEN); pos(avatar1Text, 11, 7); ap(avatar1, avatar1Text);
  const name1 = await tx("Priya S.", 13, "Semi Bold", BLACK); pos(name1, 54, 10); ap(review1, name1);
  const stars1 = await tx("★★★★★", 12, "Regular", ORANGE); pos(stars1, 54, 28); ap(review1, stars1);
  const date1 = await tx("2 days ago", 10, "Regular", GRAY3); pos(date1, W - 90, 10); ap(review1, date1);
  const title1 = await tx("Works fast!", 12, "Semi Bold", BLACK, W - 80); pos(title1, 12, 50); ap(review1, title1);
  const body1 = await tx("Relieved my fever in 2 hours. Highly recommend.", 11, "Regular", GRAY2, W - 80, 17); pos(body1, 12, 68); ap(review1, body1);
  ap(f, review1);

  const review2 = fr(W - 32, 100, WHITE); review2.cornerRadius = 14;
  review2.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; review2.strokeWeight = 1; pos(review2, 16, 324);
  const avatar2 = fr(34, 34, GREEN_LIGHT); avatar2.cornerRadius = 17; pos(avatar2, 12, 14); ap(review2, avatar2);
  const avatar2Text = await tx("A", 15, "Bold", GREEN); pos(avatar2Text, 11, 7); ap(avatar2, avatar2Text);
  const name2 = await tx("Arjun M.", 13, "Semi Bold", BLACK); pos(name2, 54, 10); ap(review2, name2);
  const stars2 = await tx("★★★★☆", 12, "Regular", ORANGE); pos(stars2, 54, 28); ap(review2, stars2);
  const date2 = await tx("1 week ago", 10, "Regular", GRAY3); pos(date2, W - 90, 10); ap(review2, date2);
  const title2 = await tx("Effective", 12, "Semi Bold", BLACK, W - 80); pos(title2, 12, 50); ap(review2, title2);
  const body2 = await tx("Good product. No side effects noticed.", 11, "Regular", GRAY2, W - 80, 17); pos(body2, 12, 68); ap(review2, body2);
  ap(f, review2);

  const review3 = fr(W - 32, 100, WHITE); review3.cornerRadius = 14;
  review3.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; review3.strokeWeight = 1; pos(review3, 16, 432);
  const avatar3 = fr(34, 34, GREEN_LIGHT); avatar3.cornerRadius = 17; pos(avatar3, 12, 14); ap(review3, avatar3);
  const avatar3Text = await tx("K", 15, "Bold", GREEN); pos(avatar3Text, 11, 7); ap(avatar3, avatar3Text);
  const name3 = await tx("Kavita R.", 13, "Semi Bold", BLACK); pos(name3, 54, 10); ap(review3, name3);
  const stars3 = await tx("★★★★★", 12, "Regular", ORANGE); pos(stars3, 54, 28); ap(review3, stars3);
  const date3 = await tx("2 weeks ago", 10, "Regular", GRAY3); pos(date3, W - 90, 10); ap(review3, date3);
  const title3 = await tx("Best brand", 12, "Semi Bold", BLACK, W - 80); pos(title3, 12, 50); ap(review3, title3);
  const body3 = await tx("Been using this for years. Never fails.", 11, "Regular", GRAY2, W - 80, 17); pos(body3, 12, 68); ap(review3, body3);
  ap(f, review3);

  await ctaBtn(f, "Write a Review", 540);
  return f;
}

async function p23_Compare() {
  const f = fr(W, H, WHITE); f.name = "23 — Compare Medicines";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Compare Medicines", "Side by side", false); pos(hdr, 0, 44);
  const meds = [{ n:"Crocin 650mg", pr:"₹28", br:"GSK" }, { n:"Dolo 650mg", pr:"₹32", br:"Micro" }];
  const cw2 = (W - 64) / 2;
  for (let i = 0; i < 2; i++) {
    const cc4 = fr(cw2, 72, i === 0 ? GREEN_PAL : GRAY6); cc4.cornerRadius = 12; pos(cc4, 16 + i * (cw2 + 16), 108);
    const ce4 = await tx("💊", 22, "Regular", GREEN); pos(ce4, cw2 / 2 - 12, 8); ap(cc4, ce4);
    const cn4 = await tx(meds[i].n, 11, "Semi Bold", BLACK, cw2 - 12); cn4.textAlignHorizontal = "CENTER"; pos(cn4, 6, 36); ap(cc4, cn4);
    const cp4 = await tx(meds[i].pr, 13, "Bold", GREEN, cw2); cp4.textAlignHorizontal = "CENTER"; pos(cp4, 0, 54); ap(cc4, cp4); ap(f, cc4);
  }
  const rows = [
    { l:"Price", v1:"₹28", v2:"₹32" }, { l:"Salt", v1:"Paracetamol", v2:"Paracetamol" },
    { l:"Strength", v1:"650mg", v2:"650mg" }, { l:"Pack", v1:"15 tabs", v2:"15 tabs" },
    { l:"Manufacturer", v1:"GSK Pharma", v2:"Micro Labs" }, { l:"OTC/Rx", v1:"OTC", v2:"OTC" },
    { l:"Rating", v1:"4.5 ★", v2:"4.3 ★" }, { l:"Stock", v1:"✓ In Stock", v2:"✓ In Stock" },
  ];
  let y = 192;
  for (let i = 0; i < rows.length; i++) {
    if (y + 36 > CONTENT_BOT - 60) break;
    const bg = rc(W - 32, 34, i % 2 === 0 ? GRAY6 : WHITE); bg.cornerRadius = 8; pos(bg, 16, y); ap(f, bg);
    const rl = await tx(rows[i].l, 12, "Regular", GRAY2, 90); pos(rl, 24, y + 10); ap(f, rl);
    const rv1 = await tx(rows[i].v1, 12, "Semi Bold", GREEN, cw2 - 16); rv1.textAlignHorizontal = "CENTER"; pos(rv1, 116, y + 10); ap(f, rv1);
    const rv2 = await tx(rows[i].v2, 12, "Semi Bold", BLACK, cw2 - 16); rv2.textAlignHorizontal = "CENTER"; pos(rv2, 116 + cw2, y + 10); ap(f, rv2);
    y += 36;
  }
  await ctaBtn(f, "Add Crocin to Cart", Math.min(y + 12, CONTENT_BOT - 52));
  return f;
}

async function p24_Cart() {
  const f = fr(W, H, WHITE); f.name = "24 — Cart";
  await statusBar(f, false);
  const hdr = await topHeader(f, "My Cart", "3 items", false); pos(hdr, 0, 44);
  const items = [
    { n:"Paracetamol 650mg", br:"GSK · 15 Tabs", pr:"₹28", q:2 },
    { n:"Cetirizine 10mg", br:"Cipla · 10 Tabs", pr:"₹22", q:1 },
    { n:"ORS Sachets", br:"Electral · 10 packs", pr:"₹38", q:1 },
  ];
  let y = 108;
  for (const it of items) {
    if (y + 84 > 570) break;
    const ic2 = card(W - 32, 80, WHITE, 12); pos(ic2, 16, y);
    const ib = rc(44, 44, GREEN_LIGHT, 10); pos(ib, 10, 18); ap(ic2, ib);
    const ie = await tx("💊", 20, "Regular", GREEN); pos(ie, 10, 10); ap(ib, ie);
    const in2 = await tx(it.n, 13, "Semi Bold", BLACK, 160); pos(in2, 64, 10); ap(ic2, in2);
    const ibr = await tx(it.br, 11, "Regular", GRAY2, 160); pos(ibr, 64, 28); ap(ic2, ibr);
    const ip = await tx(it.pr, 13, "Bold", GREEN); pos(ip, 64, 48); ap(ic2, ip);
    const qb = fr(86, 28, GRAY6); qb.cornerRadius = 8; pos(qb, W - 100, 42);
    const qbm = await tx("−", 15, "Bold", GRAY1); pos(qbm, 7, 4); ap(qb, qbm);
    const qbn = await tx(String(it.q), 13, "Bold", BLACK); pos(qbn, 32, 6); ap(qb, qbn);
    const qbp = await tx("+", 15, "Bold", GREEN); pos(qbp, 60, 4); ap(qb, qbp); ap(ic2, qb);
    const del = await tx("🗑", 14, "Regular", RED); pos(del, W - 38, 10); ap(ic2, del);
    ap(f, ic2); y += 86;
  }
  const sc2 = fr(W - 32, 120, GRAY6); sc2.cornerRadius = 14; pos(sc2, 16, y + 4);
  const sumRows = [["Subtotal", "₹110"], ["Delivery", "Free"], ["Discount", "− ₹10"], ["Total", "₹100"]];
  for (let i = 0; i < sumRows.length; i++) {
    const rl = await tx(sumRows[i][0], 13, i === 3 ? "Bold" : "Regular", i === 3 ? BLACK : GRAY2); pos(rl, 14, 8 + i * 26); ap(sc2, rl);
    const rv = await tx(sumRows[i][1], 13, i === 3 ? "Bold" : "Regular", i === 3 ? GREEN : GRAY1); pos(rv, W - 90, 8 + i * 26); ap(sc2, rv);
  }
  ap(f, sc2); y += 132;
  await ctaBtn(f, "Proceed to Checkout — ₹100", y + 6);
  await bottomNav(f, "orders");
  return f;
}

async function p25_DeliveryAddr() {
  const f = fr(W, H, WHITE); f.name = "25 — Delivery Address";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Delivery Address", "Where should we deliver?", false); pos(hdr, 0, 44);
  const saved = await tx("Saved Addresses", 13, "Bold", BLACK); pos(saved, 16, 108); ap(f, saved);
  const addrs = [
    { type:"Home", addr:"12, Gandhi Nagar, Velachery, Chennai - 600042", ic:"🏠" },
    { type:"Office", addr:"Block B, Tidel Park, Taramani, Chennai - 600113", ic:"🏢" },
  ];
  let y = 132;
  for (let i = 0; i < addrs.length; i++) {
    const ac = card(W - 32, 78, WHITE, 14); pos(ac, 16, y);
    if (i === 0) { ac.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; ac.strokeWeight = 2; }
    const ai = await tx(addrs[i].ic, 20, "Regular", GREEN); pos(ai, 12, 26); ap(ac, ai);
    const at = await tx(addrs[i].type, 12, "Semi Bold", BLACK); pos(at, 46, 12); ap(ac, at);
    const aa = await tx(addrs[i].addr, 11, "Regular", GRAY2, W - 110, 16); pos(aa, 46, 28); ap(ac, aa);
    if (i === 0) { const sel = await tx("✓", 17, "Bold", GREEN); pos(sel, W - 44, 28); ap(ac, sel); }
    ap(f, ac); y += 86;
  }
  const newA = fr(W - 32, 46, GRAY6); newA.cornerRadius = 12;
  newA.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; newA.strokeWeight = 1; pos(newA, 16, y + 4);
  const nAt = await tx("+ Add New Address", 14, "Medium", GREEN, W - 32); nAt.textAlignHorizontal = "CENTER"; pos(nAt, 0, 14); ap(newA, nAt); ap(f, newA);
  const dst = await tx("Select Delivery Slot", 13, "Bold", BLACK); pos(dst, 16, y + 62); ap(f, dst);
  const slots = ["Express 2hr", "Today Eve", "Tomorrow AM", "Tomorrow PM"];
  const slotW = (W - 56) / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const idx = i * 2 + j;
      const sb3 = fr(slotW, 44, idx === 0 ? GREEN : GRAY6); sb3.cornerRadius = 10;
      if (idx !== 0) { sb3.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; sb3.strokeWeight = 1; }
      pos(sb3, 16 + j * (slotW + 16), y + 90 + i * 52);
      const sbt = await tx(slots[idx], 12, idx === 0 ? "Semi Bold" : "Regular", idx === 0 ? WHITE : GRAY1, slotW); sbt.textAlignHorizontal = "CENTER"; pos(sbt, 0, 14); ap(sb3, sbt); ap(f, sb3);
    }
  }
  await ctaBtn(f, "Deliver to Home Address", Math.min(y + 206, CONTENT_BOT - 52));
  return f;
}

async function p26_AddAddress() {
  const f = fr(W, H, WHITE); f.name = "26 — Add New Address";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Add Address", "New delivery location", false); pos(hdr, 0, 44);
  let y = 108;
  y = await inputField(f, "Address Type", "Home / Office / Other", y); y += 10;
  y = await inputField(f, "Flat / House No.", "12, Gandhi Nagar", y); y += 10;
  y = await inputField(f, "Street / Area", "Velachery", y); y += 10;
  y = await inputField(f, "City", "Chennai", y); y += 10;
  y = await inputField(f, "State", "Tamil Nadu", y); y += 10;
  y = await inputField(f, "PIN Code", "600042", y); y += 10;
  y = await inputField(f, "Landmark (Optional)", "Near Apollo Hospital", y); y += 14;
  const del2 = fr(W - 32, 42, GREEN_PAL); del2.cornerRadius = 12;
  del2.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; del2.strokeWeight = 1; pos(del2, 16, y);
  const dt2 = await tx("📍  Use Current Location", 13, "Medium", GREEN, W - 32); dt2.textAlignHorizontal = "CENTER"; pos(dt2, 0, 12); ap(del2, dt2); ap(f, del2); y += 54;
  await ctaBtn(f, "Save Address", Math.min(y, CONTENT_BOT - 52));
  return f;
}

async function p27_Payment() {
  const f = fr(W, H, WHITE); f.name = "27 — Payment Methods";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Payment", "Choose payment method", false); pos(hdr, 0, 44);
  const methods = [
    { ic:"💳", t:"Credit / Debit Card", s:"Visa, Mastercard, RuPay", sel:true },
    { ic:"📱", t:"UPI", s:"GPay, PhonePe, Paytm, BHIM", sel:false },
    { ic:"🏦", t:"Net Banking", s:"All major banks supported", sel:false },
    { ic:"💰", t:"Cash on Delivery", s:"Pay when delivered", sel:false },
  ];
  let y = 108;
  for (const m of methods) {
    if (y + 60 > CONTENT_BOT - 200) break;
    const mc = card(W - 32, 58, WHITE, 14); pos(mc, 16, y);
    if (m.sel) { mc.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; mc.strokeWeight = 2; }
    const radio = rc(18, 18, m.sel ? GREEN : GRAY6, 9); radio.strokes = [{ type:"SOLID", color: rgb(m.sel ? GREEN : GRAY4) }]; radio.strokeWeight = 2; pos(radio, 14, 20); ap(mc, radio);
    const mi = await tx(m.ic, 20, "Regular", GREEN); pos(mi, 42, 18); ap(mc, mi);
    const mtt = await tx(m.t, 13, "Semi Bold", BLACK); pos(mtt, 72, 10); ap(mc, mtt);
    const ms = await tx(m.s, 11, "Regular", GRAY2, W - 130); pos(ms, 72, 28); ap(mc, ms);
    ap(f, mc); y += 64;
  }
  const ci = card(W - 32, 128, WHITE, 14); pos(ci, 16, y + 4);
  ci.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; ci.strokeWeight = 1;
  const ct = await tx("Card Details", 12, "Semi Bold", GRAY1); pos(ct, 14, 12); ap(ci, ct);
  const cn = fr(W - 80, 38, GRAY6); cn.cornerRadius = 9; pos(cn, 14, 34);
  const cnt = await tx("4532 •••• •••• 1234", 13, "Regular", GRAY1, W - 108); pos(cnt, 12, 11); ap(cn, cnt); ap(ci, cn);
  const ed = fr(126, 38, GRAY6); ed.cornerRadius = 9; pos(ed, 14, 80);
  const edt = await tx("MM/YY", 13, "Regular", GRAY3); pos(edt, 12, 11); ap(ed, edt); ap(ci, ed);
  const cv = fr(126, 38, GRAY6); cv.cornerRadius = 9; pos(cv, 148, 80);
  const cvt = await tx("CVV", 13, "Regular", GRAY3); pos(cvt, 12, 11); ap(cv, cvt); ap(ci, cv);
  ap(f, ci); y += 140;
  await ctaBtn(f, "Pay ₹100 Securely", Math.min(y + 10, CONTENT_BOT - 52));
  const sec = await tx("🔒  256-bit SSL encrypted payment", 11, "Regular", GRAY3, W - 48); sec.textAlignHorizontal = "CENTER"; pos(sec, 24, Math.min(y + 70, CONTENT_BOT - 20)); ap(f, sec);
  return f;
}

async function p28_OrderSummary() {
  const f = fr(W, H, WHITE); f.name = "28 — Order Summary";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Order Summary", "Review before payment", false); pos(hdr, 0, 44);
  const sc3 = card(W - 32, 148, WHITE, 14); pos(sc3, 16, 108);
  const sct = await tx("📦  Order Items (3)", 13, "Semi Bold", BLACK); pos(sct, 14, 12); ap(sc3, sct);
  const its = ["Paracetamol 650mg ×2 — ₹56", "Cetirizine 10mg ×1 — ₹22", "ORS Sachets ×1 — ₹38"];
  for (let i = 0; i < its.length; i++) { const it = await tx("• " + its[i], 12, "Regular", GRAY2, W - 80); pos(it, 14, 34 + i * 26); ap(sc3, it); }
  ap(f, sc3);
  const dc3 = card(W - 32, 56, WHITE, 14); pos(dc3, 16, 268);
  const dct = await tx("📍  Delivery Address", 12, "Semi Bold", BLACK); pos(dct, 14, 10); ap(dc3, dct);
  const dca = await tx("12, Gandhi Nagar, Velachery, Chennai - 600042", 11, "Regular", GRAY2, W - 80, 16); pos(dca, 14, 28); ap(dc3, dca); ap(f, dc3);
  const pc2 = card(W - 32, 54, WHITE, 14); pos(pc2, 16, 334);
  const pct = await tx("💳  Payment Method", 12, "Semi Bold", BLACK); pos(pct, 14, 10); ap(pc2, pct);
  const pcp = await tx("Credit Card ending in 1234", 12, "Regular", GRAY2, W - 80); pos(pcp, 14, 30); ap(pc2, pcp); ap(f, pc2);
  const oc = fr(W - 32, 114, GRAY6); oc.cornerRadius = 14; pos(oc, 16, 400);
  const sumRows = [["Subtotal", "₹116"], ["Delivery", "Free"], ["Promo (MEDI20)", "−₹23"], ["Tax (GST)", "₹7"], ["Total", "₹100"]];
  for (let i = 0; i < sumRows.length; i++) {
    const rl = await tx(sumRows[i][0], 12, i === 4 ? "Bold" : "Regular", i === 4 ? BLACK : GRAY2); pos(rl, 14, 6 + i * 20); ap(oc, rl);
    const rv = await tx(sumRows[i][1], 12, i === 4 ? "Bold" : "Regular", i === 4 ? GREEN : GRAY1); pos(rv, W - 90, 6 + i * 20); ap(oc, rv);
  }
  ap(f, oc);
  const ds = fr(W - 32, 40, GREEN_PAL); ds.cornerRadius = 12; pos(ds, 16, 524);
  ds.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; ds.strokeWeight = 1;
  const dst = await tx("🚚  Express delivery — Arrives in 2 hours", 12, "Regular", GREEN, W - 64); pos(dst, 14, 11); ap(ds, dst); ap(f, ds);
  await ctaBtn(f, "Confirm & Pay ₹100", 578);
  return f;
}

async function p29_OrderSuccess() {
  const f = fr(W, H, WHITE); f.name = "29 — Order Placed Success";
  await statusBar(f, false);
  const bg2 = el(200, 200, GREEN, 0.08); pos(bg2, W/2 - 100, 96); ap(f, bg2);
  const bg3 = el(144, 144, GREEN, 0.12); pos(bg3, W/2 - 72, 124); ap(f, bg3);
  const check = fr(90, 90, GREEN); check.cornerRadius = 45; pos(check, W/2 - 45, 152);
  const ct = await tx("✓", 48, "Bold", WHITE); pos(ct, 22, 16); ap(check, ct); ap(f, check);
  const t1 = await tx("Order Placed!", 26, "Bold", BLACK, W - 48); t1.textAlignHorizontal = "CENTER"; pos(t1, 24, 258); ap(f, t1);
  const t2 = await tx("Your medicines are being prepared\nand will be delivered in 2 hours.", 14, "Regular", GRAY2, W - 48, 22); t2.textAlignHorizontal = "CENTER"; pos(t2, 24, 292); ap(f, t2);
  const oid = fr(W - 48, 48, GREEN_PAL); oid.cornerRadius = 12; pos(oid, 24, 348);
  oid.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; oid.strokeWeight = 1;
  const ot = await tx("Order ID: #MC-2025-04521", 14, "Semi Bold", GREEN, W - 48); ot.textAlignHorizontal = "CENTER"; pos(ot, 0, 13); ap(oid, ot); ap(f, oid);
  const et = await tx("📍  Estimated Delivery: Today, 4:30 PM", 13, "Regular", GRAY1, W - 48); et.textAlignHorizontal = "CENTER"; pos(et, 24, 412); ap(f, et);
  const steps = ["Confirmed ✓", "Packing", "Delivering", "Delivered"];
  const stepW = (W - 48 - 36) / 3;
  for (let i = 0; i < 4; i++) {
    const sx = 24 + i * (stepW + 12);
    const dot = rc(18, 18, i === 0 ? GREEN : GRAY4, 9); pos(dot, sx, 450); ap(f, dot);
    if (i < 3) { const line = rc(stepW - 8, 2, i === 0 ? GREEN : GRAY4); pos(line, sx + 18, 458); ap(f, line); }
    const sl = await tx(steps[i], 8, "Regular", i === 0 ? GREEN : GRAY3, stepW); sl.textAlignHorizontal = "CENTER"; pos(sl, sx - 8, 472); ap(f, sl);
  }
  await ctaBtn(f, "Track Order", 500);
  await ctaBtn(f, "Continue Shopping", 558, true);
  return f;
}

async function p30_Tracking() {
  const f = fr(W, H, WHITE); f.name = "30 — Order Tracking";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Track Order", "#MC-2025-04521", false); pos(hdr, 0, 44);
  const mp = fr(W, 238, GRAY5); mp.name = "Map Placeholder"; pos(mp, 0, 100);
  const mg = rc(W, 238, "#C8E6C9"); pos(mg, 0, 0); ap(mp, mg);
  const r1 = rc(150, 4, WHITE, 2); pos(r1, 60, 118); ap(mp, r1);
  const r2 = rc(4, 100, WHITE, 2); pos(r2, 188, 58); ap(mp, r2);
  const dm = fr(38, 48, GREEN); dm.cornerRadius = 18; pos(dm, 170, 68);
  const die = await tx("🚚", 18, "Regular", WHITE); pos(die, 8, 8); ap(dm, die); ap(mp, dm);
  const hm = fr(22, 22, RED); hm.cornerRadius = 11; pos(hm, 268, 168); ap(mp, hm);
  const hi = await tx("🏠", 13, "Regular", WHITE); pos(hi, 3, 3); ap(hm, hi); ap(mp, hm); ap(f, mp);
  const sc4 = fr(W - 32, 72, GREEN); sc4.cornerRadius = 16; pos(sc4, 16, 348);
  const sct = await tx("🚚  Out for Delivery", 15, "Bold", WHITE); pos(sct, 14, 12); ap(sc4, sct);
  const sca = await tx("Rajan (Delivery Partner) · ★4.8", 12, "Regular", GREEN_LIGHT, 200); pos(sca, 14, 36); ap(sc4, sca);
  const scc = await tx("📞  Call", 12, "Semi Bold", WHITE); pos(scc, W - 80, 28); ap(sc4, scc); ap(f, sc4);
  const prg = fr(W - 32, 72, GRAY6); prg.cornerRadius = 14; pos(prg, 16, 430);
  const steps = ["Confirmed", "Packed", "On the way", "Delivered"];
  const sw = (W - 64) / 3;
  for (let i = 0; i < 4; i++) {
    const col = i < 3 ? GREEN : GRAY4;
    const sdot = rc(14, 14, col, 7); pos(sdot, 14 + i * sw, 28); ap(prg, sdot);
    if (i < 3) { const sl = rc(sw - 14, 2, col); pos(sl, 28 + i * sw, 34); ap(prg, sl); }
    const slt = await tx(steps[i], 9, "Regular", i < 3 ? GREEN : GRAY3, sw); slt.textAlignHorizontal = "CENTER"; pos(slt, i * sw, 50); ap(prg, slt);
  }
  ap(f, prg);
  const et = await tx("⏱  Arriving in approximately 45 minutes", 13, "Regular", GRAY1, W - 48); pos(et, 24, 516); ap(f, et);
  await ctaBtn(f, "Cancel Order", 554, true);
  return f;
}

async function p31_OrderHistory() {
  const f = fr(W, H, WHITE); f.name = "31 — Order History";
  await statusBar(f, false);
  const hdr = await topHeader(f, "My Orders", "", false); pos(hdr, 0, 44);
  const tabs = ["All", "Active", "Delivered", "Cancelled"];
  let tx2 = 16;
  for (let i = 0; i < tabs.length; i++) {
    const tw = tabs[i].length * 9 + 18;
    const tb = fr(tw, 30, i === 0 ? GREEN : GRAY6); tb.cornerRadius = 15;
    if (i !== 0) { tb.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; tb.strokeWeight = 1; }
    pos(tb, tx2, 106);
    const tbt = await tx(tabs[i], 12, i === 0 ? "Semi Bold" : "Regular", i === 0 ? WHITE : GRAY1, tw - 8); tbt.textAlignHorizontal = "CENTER"; pos(tbt, 4, 7); ap(tb, tbt); ap(f, tb); tx2 += tw + 8;
  }
  const orders = [
    { id:"#MC-04521", date:"Today · 2:30 PM", items:"Paracetamol, Cetirizine", total:"₹100", status:"Delivered", col:GREEN },
    { id:"#MC-04498", date:"Yesterday · 11 AM", items:"Metformin 500mg, Amlodipine", total:"₹205", status:"Delivered", col:GREEN },
    { id:"#MC-04412", date:"3 days ago", items:"Vitamin D3, Omega-3", total:"₹380", status:"Delivered", col:GREEN },
    { id:"#MC-04301", date:"1 week ago", items:"Azithromycin 500mg", total:"₹120", status:"Cancelled", col:RED },
  ];
  let y = 146;
  for (const o of orders) {
    if (y + 90 > CONTENT_BOT_NAV) break;
    const oc2 = card(W - 32, 86, WHITE, 14); pos(oc2, 16, y);
    const ot = await tx(o.id, 13, "Semi Bold", BLACK); pos(ot, 14, 10); ap(oc2, ot);
    const od = await tx(o.date, 11, "Regular", GRAY3); pos(od, 14, 28); ap(oc2, od);
    const oi = await tx("💊  " + o.items, 11, "Regular", GRAY2, W - 120); pos(oi, 14, 46); ap(oc2, oi);
    const opr = await tx(o.total, 13, "Bold", GREEN); pos(opr, 14, 64); ap(oc2, opr);
    const os2 = await mkPill(o.status, o.col === GREEN ? GREEN_LIGHT : "#FEE2E2", o.col === GREEN ? "#065F46" : RED);
    pos(os2, W - os2.width - 48, 10); ap(oc2, os2);
    const rb = fr(76, 26, GREEN_PAL); rb.cornerRadius = 8; pos(rb, W - 90, 56);
    const rbt = await tx("Reorder", 11, "Medium", GREEN, 76); rbt.textAlignHorizontal = "CENTER"; pos(rbt, 0, 7); ap(rb, rbt); ap(oc2, rb);
    ap(f, oc2); y += 92;
  }
  await bottomNav(f, "orders");
  return f;
}

async function p32_OrderDetail() {
  const f = fr(W, H, WHITE); f.name = "32 — Order Detail";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Order #MC-04521", "Delivered", false); pos(hdr, 0, 44);
  const sc6 = card(W - 32, 80, WHITE, 14); pos(sc6, 16, 108);
  const dRows = [["Status", "✓ Delivered"], ["Date", "Today, 4:30 PM"], ["Payment", "Credit Card ····1234"]];
  for (let i = 0; i < dRows.length; i++) {
    const rl = await tx(dRows[i][0], 12, "Regular", GRAY2); pos(rl, 14, 10 + i * 22); ap(sc6, rl);
    const rv = await tx(dRows[i][1], 12, "Semi Bold", i === 0 ? GREEN : BLACK); pos(rv, 150, 10 + i * 22); ap(sc6, rv);
  }
  ap(f, sc6);
  const it3 = await tx("Items Ordered", 13, "Bold", BLACK); pos(it3, 16, 200); ap(f, it3);
  let y = 224;
  const oi = [{ n:"Paracetamol 650mg", q:"×2", pr:"₹56" }, { n:"Cetirizine 10mg", q:"×1", pr:"₹22" }, { n:"ORS Sachets", q:"×1", pr:"₹38" }];
  for (const o2 of oi) {
    if (y + 46 > CONTENT_BOT - 220) break;
    const oc3 = fr(W - 32, 44, GRAY6); oc3.cornerRadius = 10; pos(oc3, 16, y);
    const ie2 = await tx("💊", 18, "Regular", GREEN); pos(ie2, 12, 12); ap(oc3, ie2);
    const in3 = await tx(o2.n, 12, "Semi Bold", BLACK, 190); pos(in3, 40, 6); ap(oc3, in3);
    const iq = await tx(o2.q, 11, "Regular", GRAY2); pos(iq, 40, 24); ap(oc3, iq);
    const ip2 = await tx(o2.pr, 12, "Bold", GREEN); pos(ip2, W - 80, 14); ap(oc3, ip2);
    ap(f, oc3); y += 50;
  }
  const dc4 = fr(W - 32, 72, GRAY6); dc4.cornerRadius = 14; pos(dc4, 16, y + 8);
  const totRows = [["Subtotal", "₹116"], ["Discount", "−₹23"], ["Total Paid", "₹100"]];
  for (let i = 0; i < totRows.length; i++) {
    const rl = await tx(totRows[i][0], 12, i === 2 ? "Bold" : "Regular", i === 2 ? BLACK : GRAY2); pos(rl, 14, 8 + i * 20); ap(dc4, rl);
    const rv = await tx(totRows[i][1], 12, i === 2 ? "Bold" : "Regular", i === 2 ? GREEN : GRAY1); pos(rv, W - 90, 8 + i * 20); ap(dc4, rv);
  }
  ap(f, dc4); y += 90;
  await ctaBtn(f, "Reorder", y + 10);
  await ctaBtn(f, "Download Invoice", Math.min(y + 68, CONTENT_BOT - 52), true);
  return f;
}

async function p33_Return() {
  const f = fr(W, H, WHITE); f.name = "33 — Return / Refund";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Return Request", "Order #MC-04521", false); pos(hdr, 0, 44);
  const ic = await tx("↩️", 38, "Regular", ORANGE); pos(ic, W/2 - 22, 108); ap(f, ic);
  const t = await tx("Why are you returning?", 19, "Bold", BLACK, W - 48); t.textAlignHorizontal = "CENTER"; pos(t, 24, 156); ap(f, t);
  const reasons = ["Wrong medicine delivered", "Damaged / broken packaging", "Medicine expired", "Did not order this", "Quality issue", "Other reason"];
  let y = 196;
  for (let i = 0; i < reasons.length; i++) {
    if (y + 40 > CONTENT_BOT - 130) break;
    const rb = fr(W - 32, 40, i === 0 ? GREEN_PAL : GRAY6); rb.cornerRadius = 10;
    if (i === 0) { rb.strokes = [{ type:"SOLID", color: rgb(GREEN) }]; rb.strokeWeight = 1.5; }
    pos(rb, 16, y);
    const radio = rc(18, 18, i === 0 ? GREEN : GRAY6, 9); radio.strokes = [{ type:"SOLID", color: rgb(i === 0 ? GREEN : GRAY4) }]; radio.strokeWeight = 2; pos(radio, 12, 11); ap(rb, radio);
    const rt2 = await tx(reasons[i], 13, "Regular", i === 0 ? GREEN : GRAY1, W - 76); pos(rt2, 40, 11); ap(rb, rt2); ap(f, rb); y += 46;
  }
  const nt = fr(W - 32, 62, GRAY6); nt.cornerRadius = 12;
  nt.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; nt.strokeWeight = 1; pos(nt, 16, y + 6);
  const ntt = await tx("Additional notes (optional)...", 12, "Regular", GRAY3, W - 80); pos(ntt, 14, 14); ap(nt, ntt); ap(f, nt);
  await ctaBtn(f, "Submit Return Request", Math.min(y + 80, CONTENT_BOT - 52));
  return f;
}

async function p34_UploadRx() {
  const f = fr(W, H, WHITE); f.name = "34 — Upload Prescription";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Upload Prescription", "Order Rx medicines", false); pos(hdr, 0, 44);
  const ic = await tx("📋", 40, "Regular", BLUE); pos(ic, W/2 - 24, 108); ap(f, ic);
  const t = await tx("Upload your doctor's prescription", 22, "Bold", BLACK, W - 48, 30); t.textAlignHorizontal = "CENTER"; pos(t, 24, 158); ap(f, t);
  const s = await tx("We verify all prescriptions within 30 minutes. Your data is 100% secure.", 13, "Regular", GRAY2, W - 48, 20); s.textAlignHorizontal = "CENTER"; pos(s, 24, 208); ap(f, s);
  const uz = fr(W - 32, 148, GRAY6); uz.cornerRadius = 18;
  uz.strokes = [{ type:"SOLID", color: rgb(BLUE) }]; uz.strokeWeight = 1.5; pos(uz, 16, 256);
  const ue = await tx("📤", 30, "Regular", BLUE); pos(ue, W/2 - 18 - 16, 24); ap(uz, ue);
  const ut = await tx("Tap to upload image", 14, "Semi Bold", BLUE, W - 32); ut.textAlignHorizontal = "CENTER"; pos(ut, 0, 68); ap(uz, ut);
  const us = await tx("JPG, PNG or PDF · Max 10MB", 11, "Regular", GRAY3, W - 32); us.textAlignHorizontal = "CENTER"; pos(us, 0, 90); ap(uz, us); ap(f, uz);
  const or = await tx("or", 12, "Regular", GRAY3, W - 48); or.textAlignHorizontal = "CENTER"; pos(or, 24, 416); ap(f, or);
  await ctaBtn(f, "📷  Take a Photo", 436, true);
  const info = fr(W - 32, 58, GREEN_PAL); info.cornerRadius = 12; pos(info, 16, 502);
  const it4 = await tx("ℹ️  What's a valid prescription?", 12, "Semi Bold", GREEN); pos(it4, 14, 10); ap(info, it4);
  const is = await tx("Must include doctor's name, date, patient name, medicine & dosage.", 11, "Regular", GRAY2, W - 80, 17); pos(is, 14, 28); ap(info, is); ap(f, info);
  await ctaBtn(f, "Submit for Verification", 574);
  return f;
}

async function p35_RxVerified() {
  const f = fr(W, H, WHITE); f.name = "35 — Prescription Verified";
  await statusBar(f, false);
  const hb = fr(W, 158, BLUE); hb.name = "Header Blue"; pos(hb, 0, 0);
  const hc2 = el(180, 180, WHITE, 0.07); pos(hc2, 220, -20); ap(hb, hc2);
  const hi = await tx("✓", 48, "Bold", WHITE); pos(hi, W/2 - 18, 46); ap(hb, hi);
  const ht2 = await tx("Prescription Verified!", 18, "Bold", WHITE, W - 48); ht2.textAlignHorizontal = "CENTER"; pos(ht2, 24, 108); ap(hb, ht2); ap(f, hb);
  const pc3 = card(W - 32, 108, WHITE, 14); pos(pc3, 16, 170);
  const rxRows = [["Verified By", "Dr. Priya Ramesh, MBBS"], ["Date", "30 April 2025"], ["Patient", "Ravi Kumar"], ["Valid Until", "30 May 2025"]];
  for (let i = 0; i < rxRows.length; i++) {
    const rl = await tx(rxRows[i][0], 11, "Regular", GRAY2); pos(rl, 14, 10 + i * 22); ap(pc3, rl);
    const rv = await tx(rxRows[i][1], 11, "Semi Bold", BLACK, 200); pos(rv, 130, 10 + i * 22); ap(pc3, rv);
  }
  ap(f, pc3);
  const mt2 = await tx("Prescribed Medicines", 14, "Bold", BLACK); pos(mt2, 16, 290); ap(f, mt2);
  let y = 318;
  const rxm = [{ n:"Amoxicillin 500mg", d:"1 tab × 3 daily × 7 days" }, { n:"Metformin 500mg", d:"1 tab × 2 daily × 30 days" }];
  for (const m2 of rxm) {
    if (y + 58 > CONTENT_BOT - 60) break;
    const mc2 = card(W - 32, 56, WHITE, 12); pos(mc2, 16, y);
    mc2.strokes = [{ type:"SOLID", color: rgb(BLUE) }]; mc2.strokeWeight = 1;
    const mi2 = await tx("💊", 18, "Regular", BLUE); pos(mi2, 12, 17); ap(mc2, mi2);
    const mn = await tx(m2.n, 13, "Semi Bold", BLACK, 190); pos(mn, 40, 8); ap(mc2, mn);
    const md = await tx(m2.d, 11, "Regular", GRAY2, 190); pos(md, 40, 28); ap(mc2, md);
    const ma = fr(68, 26, BLUE); ma.cornerRadius = 8; pos(ma, W - 82, 16);
    const mat = await tx("Add ✓", 11, "Semi Bold", WHITE, 68); mat.textAlignHorizontal = "CENTER"; pos(mat, 0, 7); ap(ma, mat); ap(mc2, ma);
    ap(f, mc2); y += 62;
  }
  await ctaBtn(f, "Order Prescribed Medicines", Math.min(y + 14, CONTENT_BOT - 52));
  return f;
}

async function p36_RxVault() {
  const f = fr(W, H, WHITE); f.name = "36 — Prescription Vault";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Prescription Vault", "All your prescriptions", false); pos(hdr, 0, 44);
  const rxs = [
    { doc:"Dr. Priya Ramesh", date:"30 Apr 2025", med:"Amoxicillin, Metformin", status:"Active" },
    { doc:"Dr. Anand Kumar", date:"10 Mar 2025", med:"Amlodipine 5mg", status:"Active" },
    { doc:"Dr. Suresh Iyer", date:"15 Jan 2025", med:"Paracetamol, Cetirizine", status:"Expired" },
  ];
  let y = 108;
  for (const rx2 of rxs) {
    if (y + 90 > CONTENT_BOT - 60) break;
    const rc4 = card(W - 32, 88, WHITE, 14); pos(rc4, 16, y);
    const ri = await tx("📋", 22, "Regular", BLUE); pos(ri, 12, 30); ap(rc4, ri);
    const rd = await tx(rx2.doc, 13, "Semi Bold", BLACK, 190); pos(rd, 48, 10); ap(rc4, rd);
    const rdt = await tx(rx2.date, 11, "Regular", GRAY3, 190); pos(rdt, 48, 28); ap(rc4, rdt);
    const rm = await tx("💊  " + rx2.med, 11, "Regular", GRAY2, 190); pos(rm, 48, 46); ap(rc4, rm);
    const rs2 = await mkPill(rx2.status, rx2.status === "Active" ? GREEN_LIGHT : GRAY5, rx2.status === "Active" ? "#065F46" : GRAY2);
    pos(rs2, 48, 66); ap(rc4, rs2);
    const rv = fr(66, 26, BLUE); rv.cornerRadius = 8; pos(rv, W - 82, 32);
    const rvt = await tx("View", 12, "Semi Bold", WHITE, 66); rvt.textAlignHorizontal = "CENTER"; pos(rvt, 0, 8); ap(rv, rvt); ap(rc4, rv);
    ap(f, rc4); y += 96;
  }
  await ctaBtn(f, "+ Upload New Prescription", Math.min(y + 8, CONTENT_BOT - 52), true);
  return f;
}

async function p37_Profile() {
  const f = fr(W, H, WHITE); f.name = "37 — User Profile";
  await statusBar(f, false);
  const hd = fr(W, 168, GREEN); hd.name = "Profile Header"; pos(hd, 0, 0);
  const hc3 = el(160, 160, WHITE, 0.07); pos(hc3, 230, 20); ap(hd, hc3);
  const av2 = el(72, 72, WHITE, 1); pos(av2, W/2 - 36, 36); ap(hd, av2);
  const ai2 = await tx("RK", 24, "Bold", GREEN); pos(ai2, W/2 - 16, 54); ap(hd, ai2);
  const an2 = await tx("Ravi Kumar", 17, "Bold", WHITE, W - 48); an2.textAlignHorizontal = "CENTER"; pos(an2, 24, 120); ap(hd, an2);
  const ae = await tx("ravi@email.com", 12, "Regular", GREEN_LIGHT, W - 48); ae.textAlignHorizontal = "CENTER"; pos(ae, 24, 142); ap(hd, ae); ap(f, hd);
  const stats2 = [{ l:"Orders", v:"28" }, { l:"Reviews", v:"12" }, { l:"Points", v:"840" }];
  const sw4 = (W - 48 - 32) / 3;
  const srow = fr(W - 32, 56, GRAY6); srow.cornerRadius = 12; pos(srow, 16, 178);
  for (let i = 0; i < 3; i++) {
    const sv = await tx(stats2[i].v, 17, "Bold", GREEN, sw4); sv.textAlignHorizontal = "CENTER"; pos(sv, i * (sw4 + 16), 6); ap(srow, sv);
    const sl = await tx(stats2[i].l, 10, "Regular", GRAY2, sw4); sl.textAlignHorizontal = "CENTER"; pos(sl, i * (sw4 + 16), 28); ap(srow, sl);
  }
  ap(f, srow);
  const menu = [
    { ic:"📋", t:"My Orders", s:"Track & manage orders" },
    { ic:"💊", t:"Saved Medicines", s:"Your medicine wishlist" },
    { ic:"📍", t:"Addresses", s:"Manage delivery addresses" },
    { ic:"💳", t:"Payment Methods", s:"Cards & UPI accounts" },
    { ic:"🔔", t:"Notifications", s:"Manage alerts" },
    { ic:"🛡️", t:"Privacy & Security", s:"Password, data settings" },
  ];
  let y = 246;
  for (const m3 of menu) {
    if (y + 48 > CONTENT_BOT_NAV) break;
    const mc3 = fr(W - 32, 46, WHITE); mc3.name = m3.t;
    mc3.strokes = [{ type:"SOLID", color: rgb(GRAY5) }]; mc3.strokeWeight = 1; mc3.cornerRadius = 10; pos(mc3, 16, y);
    const mi3 = await tx(m3.ic, 18, "Regular", GREEN); pos(mi3, 12, 13); ap(mc3, mi3);
    const mtt = await tx(m3.t, 13, "Semi Bold", BLACK); pos(mtt, 42, 8); ap(mc3, mtt);
    const ms3 = await tx(m3.s, 11, "Regular", GRAY3, W - 110); pos(ms3, 42, 24); ap(mc3, ms3);
    const arr = await tx("›", 17, "Regular", GRAY3); pos(arr, W - 46, 13); ap(mc3, arr);
    ap(f, mc3); y += 52;
  }
  await bottomNav(f, "profile");
  return f;
}

async function p38_EditProfile() {
  const f = fr(W, H, WHITE); f.name = "38 — Edit Profile";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Edit Profile", "Update your info", false); pos(hdr, 0, 44);
  const av3 = el(72, 72, GREEN_LIGHT, 1); pos(av3, W/2 - 36, 108); ap(f, av3);
  const ai3 = await tx("RK", 24, "Bold", GREEN); pos(ai3, W/2 - 14, 126); ap(f, ai3);
  const ae2 = fr(26, 26, GREEN); ae2.cornerRadius = 13; pos(ae2, W/2 + 22, 148);
  const aet = await tx("✎", 13, "Bold", WHITE); pos(aet, 7, 4); ap(ae2, aet); ap(f, ae2);
  let y = 192;
  y = await inputField(f, "Full Name", "Ravi Kumar", y); y += 10;
  y = await inputField(f, "Email Address", "ravi@email.com", y); y += 10;
  y = await inputField(f, "Phone Number", "+91 99999 00000", y); y += 10;
  y = await inputField(f, "Date of Birth", "15 / 06 / 1990", y); y += 10;
  y = await inputField(f, "Blood Group", "B+", y); y += 10;
  y = await inputField(f, "Known Allergies", "None", y); y += 18;
  await ctaBtn(f, "Save Changes", Math.min(y, CONTENT_BOT - 52));
  return f;
}

async function p39_Settings() {
  const f = fr(W, H, WHITE); f.name = "39 — App Settings";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Settings", "App preferences", false); pos(hdr, 0, 44);
  const sections = [
    { title:"Notifications", items:[{ t:"Order Updates", s:"Get delivery status alerts", on:true }, { t:"Promotions & Offers", s:"Deals and discount alerts", on:false }, { t:"Medicine Reminders", s:"Daily dose reminders", on:true }] },
    { title:"Privacy", items:[{ t:"Share Health Data", s:"Help improve AI recommendations", on:false }, { t:"Analytics", s:"Usage data for improvements", on:true }] },
    { title:"App", items:[{ t:"Dark Mode", s:"Switch to dark theme", on:false }, { t:"Biometric Login", s:"Face ID / Fingerprint", on:true }] },
  ];
  let y = 106;
  for (const sec of sections) {
    if (y + 22 > CONTENT_BOT - 60) break;
    const st5 = await tx(sec.title, 12, "Semi Bold", GRAY3); pos(st5, 20, y); ap(f, st5); y += 24;
    for (const item of sec.items) {
      if (y + 50 > CONTENT_BOT - 60) break;
      const ir = fr(W - 32, 48, WHITE); ir.cornerRadius = 10;
      ir.strokes = [{ type:"SOLID", color: rgb(GRAY5) }]; ir.strokeWeight = 1; pos(ir, 16, y);
      const it5 = await tx(item.t, 13, "Semi Bold", BLACK); pos(it5, 14, 8); ap(ir, it5);
      const is2 = await tx(item.s, 11, "Regular", GRAY3, 190); pos(is2, 14, 26); ap(ir, is2);
      const tg = fr(44, 24, item.on ? GREEN : GRAY4); tg.cornerRadius = 12; pos(tg, W - 68, 12);
      const tb2 = el(18, 18, WHITE, 1); pos(tb2, item.on ? 24 : 2, 3); ap(tg, tb2); ap(ir, tg);
      ap(f, ir); y += 54;
    }
    y += 8;
  }
  if (y + 46 <= CONTENT_BOT) {
    const logout = fr(W - 32, 44, RED); logout.cornerRadius = 10; logout.fills = fillA(RED, 0.08);
    logout.strokes = [{ type:"SOLID", color: rgb(RED) }]; logout.strokeWeight = 1; pos(logout, 16, y + 4);
    const lt2 = await tx("Sign Out", 14, "Semi Bold", RED, W - 32); lt2.textAlignHorizontal = "CENTER"; pos(lt2, 0, 13); ap(logout, lt2); ap(f, logout);
  }
  return f;
}

async function p40_Help() {
  const f = fr(W, H, WHITE); f.name = "40 — Help & Support";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Help & Support", "We're here for you", false); pos(hdr, 0, 44);
  const sb3 = fr(W - 32, 42, GRAY6); sb3.cornerRadius = 10;
  sb3.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; sb3.strokeWeight = 1; pos(sb3, 16, 108);
  const sbt = await tx("🔍  Search help topics...", 13, "Regular", GRAY3, 230); pos(sbt, 12, 12); ap(sb3, sbt); ap(f, sb3);
  const faqs = [
    { q:"How does the AI symptom checker work?", a:"Our AI uses a medical database of 10,000+ conditions to match your symptoms." },
    { q:"How long does delivery take?", a:"Express delivery takes 2–4 hours. Standard next-day delivery is also available." },
    { q:"Can I return a medicine?", a:"Yes, unused sealed medicines can be returned within 7 days of delivery." },
    { q:"Is my prescription data safe?", a:"Yes, all data is encrypted and stored securely per healthcare data laws." },
  ];
  const fqt = await tx("Frequently Asked Questions", 13, "Bold", BLACK); pos(fqt, 16, 162); ap(f, fqt);
  let y = 188;
  for (const faq of faqs) {
    if (y + 68 > CONTENT_BOT - 190) break;
    const fc = card(W - 32, 64, WHITE, 10); pos(fc, 16, y);
    const fq = await tx(faq.q, 12, "Semi Bold", BLACK, W - 80); pos(fq, 14, 8); ap(fc, fq);
    const fa = await tx(faq.a, 11, "Regular", GRAY2, W - 80, 16); pos(fa, 14, 30); ap(fc, fa);
    ap(f, fc); y += 70;
  }
  const ct = await tx("Contact Us", 13, "Bold", BLACK); pos(ct, 16, y + 6); ap(f, ct); y += 32;
  const contacts = [
    { ic:"💬", t:"Live Chat", s:"Avg response: 2 min" },
    { ic:"📞", t:"Call Us", s:"1800-MC-CARE (free)" },
    { ic:"✉️", t:"Email Support", s:"support@medicare.ai" },
  ];
  for (const c2 of contacts) {
    if (y + 50 > CONTENT_BOT) break;
    const cc5 = card(W - 32, 48, WHITE, 10); pos(cc5, 16, y);
    const ci2 = await tx(c2.ic, 20, "Regular", GREEN); pos(ci2, 12, 13); ap(cc5, ci2);
    const ct2 = await tx(c2.t, 13, "Semi Bold", BLACK); pos(ct2, 44, 8); ap(cc5, ct2);
    const cs = await tx(c2.s, 11, "Regular", GRAY2, 190); pos(cs, 44, 26); ap(cc5, cs);
    const arr = await tx("›", 17, "Regular", GRAY3); pos(arr, W - 46, 14); ap(cc5, arr);
    ap(f, cc5); y += 54;
  }
  return f;
}

async function p41_About() {
  const f = fr(W, H, WHITE); f.name = "41 — About / Terms";
  await statusBar(f, false);
  const hdr = await topHeader(f, "About MediCare AI", "", false); pos(hdr, 0, 44);
  const logo2 = fr(72, 72, GREEN); logo2.cornerRadius = 22; pos(logo2, W/2 - 36, 108);
  const lt3 = await tx("M", 38, "Bold", WHITE); pos(lt3, 20, 14); ap(logo2, lt3); ap(f, logo2);
  const tn = await tx("MediCare AI", 20, "Bold", BLACK, W - 48); tn.textAlignHorizontal = "CENTER"; pos(tn, 24, 192); ap(f, tn);
  const tv = await tx("Version 2.5.1 · Build 2025.04", 12, "Regular", GRAY3, W - 48); tv.textAlignHorizontal = "CENTER"; pos(tv, 24, 218); ap(f, tv);
  const td = await tx("MediCare AI is an AI-powered medicine delivery platform that makes healthcare accessible, affordable and convenient for everyone.", 13, "Regular", GRAY2, W - 48, 20); pos(td, 24, 248); ap(f, td);
  const links = [
    { t:"Terms of Service", ic:"📄" }, { t:"Privacy Policy", ic:"🔒" },
    { t:"Licenses", ic:"📜" }, { t:"Data Usage Policy", ic:"🗃️" },
    { t:"Accessibility Statement", ic:"♿" },
  ];
  let y = 306;
  for (const l of links) {
    if (y + 44 > CONTENT_BOT - 40) break;
    const lc = fr(W - 32, 42, WHITE); lc.cornerRadius = 10;
    lc.strokes = [{ type:"SOLID", color: rgb(GRAY5) }]; lc.strokeWeight = 1; pos(lc, 16, y);
    const li = await tx(l.ic, 16, "Regular", GREEN); pos(li, 14, 12); ap(lc, li);
    const lt4 = await tx(l.t, 13, "Regular", GRAY1); pos(lt4, 42, 12); ap(lc, lt4);
    const arr = await tx("›", 17, "Regular", GRAY3); pos(arr, W - 46, 12); ap(lc, arr);
    ap(f, lc); y += 48;
  }
  const copy = await tx("© 2025 MediCare AI Technologies Pvt. Ltd.\nAll rights reserved.", 11, "Regular", GRAY3, W - 48, 17); copy.textAlignHorizontal = "CENTER"; pos(copy, 24, Math.min(y + 8, CONTENT_BOT - 40)); ap(f, copy);
  return f;
}

async function p42_Rate() {
  const f = fr(W, H, WHITE); f.name = "42 — Rate & Review";
  await statusBar(f, false);
  const hdr = await topHeader(f, "Rate & Review", "Your feedback matters", false); pos(hdr, 0, 44);
  const ic = await tx("🌟", 40, "Regular", "#F59E0B"); pos(ic, W/2 - 24, 106); ap(f, ic);
  const t = await tx("How was your experience?", 20, "Bold", BLACK, W - 48); t.textAlignHorizontal = "CENTER"; pos(t, 24, 158); ap(f, t);
  const s = await tx("Your review helps us improve MediCare AI for everyone.", 13, "Regular", GRAY2, W - 48, 20); s.textAlignHorizontal = "CENTER"; pos(s, 24, 188); ap(f, s);
  for (let i = 0; i < 5; i++) {
    const sb4 = fr(48, 46, i < 4 ? "#FEF3C7" : GRAY6); sb4.cornerRadius = 10; pos(sb4, 20 + i * (48 + 9), 224);
    const sbt = await tx(i < 4 ? "★" : "☆", 26, "Regular", i < 4 ? ORANGE : GRAY4, 48); sbt.textAlignHorizontal = "CENTER"; pos(sbt, 0, 9); ap(sb4, sbt); ap(f, sb4);
  }
  const rt2 = await tx("4 out of 5 stars", 13, "Regular", ORANGE, W - 48); rt2.textAlignHorizontal = "CENTER"; pos(rt2, 24, 282); ap(f, rt2);
  const aspects = [
    { l:"Delivery Speed", v:5 }, { l:"Medicine Quality", v:4 },
    { l:"AI Accuracy", v:5 }, { l:"App Experience", v:4 },
  ];
  let y = 314;
  for (const a of aspects) {
    if (y + 34 > CONTENT_BOT - 140) break;
    const al = await tx(a.l, 12, "Semi Bold", GRAY1, 130); pos(al, 16, y + 7); ap(f, al);
    for (let i = 0; i < 5; i++) {
      const ss = await tx(i < a.v ? "★" : "☆", 15, "Regular", i < a.v ? ORANGE : GRAY4); pos(ss, 158 + i * 28, y + 4); ap(f, ss);
    }
    y += 36;
  }
  const ta = fr(W - 32, 72, GRAY6); ta.cornerRadius = 12;
  ta.strokes = [{ type:"SOLID", color: rgb(GRAY4) }]; ta.strokeWeight = 1; pos(ta, 16, y + 4);
  const tah = await tx("Share your experience in detail...", 12, "Regular", GRAY3, W - 80); pos(tah, 14, 14); ap(ta, tah); ap(f, ta); y += 84;
  await ctaBtn(f, "Submit Review", Math.min(y + 8, CONTENT_BOT - 52));
  const skip2 = await tx("Maybe later", 13, "Regular", GRAY3, W - 48); skip2.textAlignHorizontal = "CENTER"; pos(skip2, 24, Math.min(y + 68, CONTENT_BOT - 20)); ap(f, skip2);
  return f;
}

// ─── MAIN CONTROLLER ─────────────────────────────────────────────────────────
const BUILDERS = [
  p01_Splash, p02_Onboard1, p03_Onboard2, p04_Onboard3,
  p05_Login, p06_SignUp, p07_OTP, p08_ForgotPwd,
  p09_Home, p10_Notifications, p11_SearchActive, p12_QuickReorder, p13_HealthProfile,
  p14_SymptomInput, p15_AIAnalysing, p16_AIResults, p17_AIMedRec, p18_Dosage,
  p19_BrowseMeds, p20_CategoryView, p21_MedDetail, p22_Reviews, p23_Compare,
  p24_Cart, p25_DeliveryAddr, p26_AddAddress, p27_Payment, p28_OrderSummary,
  p29_OrderSuccess, p30_Tracking, p31_OrderHistory, p32_OrderDetail, p33_Return,
  p34_UploadRx, p35_RxVerified, p36_RxVault,
  p37_Profile, p38_EditProfile, p39_Settings, p40_Help, p41_About, p42_Rate
];

const COLS = 7;
const GAP  = 60;

let isGenerating = false;

figma.ui.onmessage = async (msg) => {
  if (msg.type === "cancel") { figma.closePlugin(); return; }
  if (msg.type === "generate") {
    if (isGenerating) return;
    isGenerating = true;
    try {
      const frames = [];
      for (let i = 0; i < BUILDERS.length; i++) {
        const builder = BUILDERS[i];
        if (typeof builder !== "function") {
          throw new TypeError(`Builder ${i + 1} is not a function`);
        }
        figma.ui.postMessage({ type:"progress", msg:`Building page ${i + 1} (${builder.name})...`, n: i + 1 });
        let frame;
        try {
          frame = await builder();
        } catch (err) {
          const detail = err && err.message ? err.message : String(err);
          throw new Error(`Page ${i + 1} failed in ${builder.name}: ${detail}`);
        }
        frame.x = (i % COLS) * (W + GAP);
        frame.y = Math.floor(i / COLS) * (H + GAP);
        figma.currentPage.appendChild(frame);
        frames.push(frame);
      }
      figma.currentPage.selection = frames;
      figma.viewport.scrollAndZoomIntoView(frames);
      figma.ui.postMessage({ type:"done" });
    } catch (err) {
      const detail = err && err.message ? err.message : String(err);
      figma.ui.postMessage({ type:"error", msg: detail });
    } finally {
      isGenerating = false;
    }
  }
};
