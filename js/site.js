/* Novelty Ola – public website
 * Shows the built-in content (defaults.js) immediately, then loads the
 * latest content from Supabase and redraws. Enquiries are saved to
 * Supabase and also sent to the Google Sheet script if one is set.
 */
(function () {
  "use strict";

  const CFG = window.NOVELTY_CONFIG || {};
  const D = window.NOVELTY_DEFAULTS;
  const ICONS = window.NOVELTY_ICONS || {};
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const digits = (t) => String(t || "").replace(/\D/g, "");
  const fmtPhone = (t) => { const d = digits(t).slice(-10); return d.length === 10 ? d.slice(0, 5) + " " + d.slice(5) : t; };
  const telHref = (t) => { const d = digits(t); return "tel:+" + (d.length === 10 ? "91" + d : d); };

  let sb = null;
  if (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase) {
    try { sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, { auth: { persistSession: false } }); } catch (e) { console.warn(e); }
  }

  /* ---------- content state ---------- */
  const C = JSON.parse(JSON.stringify(D));
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), C.settings);

  /* ---------- render ---------- */
  function renderText() {
    document.querySelectorAll("[data-t]").forEach((el) => {
      const v = get(el.dataset.t);
      if (v != null && v !== "") el.textContent = v;
    });
    const seo = C.settings.seo || {};
    if (seo.title) document.title = seo.title;
    if (seo.description) { const m = document.querySelector('meta[name="description"]'); if (m) m.setAttribute("content", seo.description); }
    const h = C.settings.hero;
    $("trust").innerHTML = (h.trust || []).filter(Boolean).map((t) => `<li>${esc(t)}</li>`).join("");
    $("trust").hidden = !(h.trust || []).filter(Boolean).length;
  }

  function renderContact() {
    const b = C.settings.business;
    $("addr").textContent = b.address || "";
    $("tel").innerHTML = b.phone_display ? `<a href="${telHref(b.phone || b.phone_display)}">${esc(b.phone_display)}</a>` : "";
    $("ftel").textContent = b.phone_display || "";
    $("onums").innerHTML = String(b.outlet_numbers || "").split("\n").filter(Boolean).map((line) => {
      const m = line.match(/^(.*?:\s*)?([\d\s+]{10,})\s*$/);
      return m ? `${esc(m[1] || "")}<a href="${telHref(m[2])}">${esc(m[2].trim())}</a>` : esc(line);
    }).join("<br>");
    $("onums").parentElement.hidden = !b.outlet_numbers;
  }

  const modelArt = (m) => m.image_url
    ? `<img src="${esc(m.image_url)}" alt="Ola ${esc(m.name)}" loading="lazy">`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">${ICONS.testride}</svg>`;

  let mfilter = "all";
  function renderModels() {
    const list = C.models.filter((m) => mfilter === "all" || m.type === mfilter);
    $("mgrid").innerHTML = list.map((m) => `
      <article class="mc">
        <div class="pic">${modelArt(m)}</div>
        <div class="bd">
          <h3>Ola <b>${esc(m.name)}</b>${m.is_gen3 ? "<em>3<sup>rd</sup> Gen</em>" : ""}</h3>
          <p class="tag">${esc(m.tagline)}</p>
          <div class="pr">
            ${m.price ? `<p class="k">Starting at</p>
            ${m.emi ? `<p class="amt">₹${esc(m.emi)}<small>/month</small></p><p class="or">OR <b>₹${esc(m.price)}</b></p>` : `<p class="amt">₹${esc(m.price)}</p><p class="or">Ex-showroom</p>`}`
            : `<p class="k">Price</p><p class="amt">On request</p><p class="or">Ask us for today's price</p>`}
          </div>
          <div class="acts">
            <button class="btn btn-ola" type="button" data-book="${esc(m.name)}">Book Now</button>
            <button class="tr" type="button" data-tr="${esc(m.name)}">Book a test ride →</button>
          </div>
        </div>
      </article>`).join("") || `<p class="fine">No models in this category right now.</p>`;
    $("statModels").textContent = C.models.length;
    const opts = C.models.map((m) => `<option>${esc(m.name)}</option>`).join("");
    const keepModel = $("model").value;
    $("model").innerHTML = opts + "<option>Not sure yet</option>";
    if (keepModel && [...$("model").options].some((o) => o.value === keepModel)) $("model").value = keepModel;
  }

  function renderOutlets() {
    const cities = C.outlets.map((o) => o.city);
    const ul = () => `<ul>${cities.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`;
    $("ribbon").innerHTML = ul() + ul().replace("<ul>", '<ul aria-hidden="true">');
    $("ogrid").innerHTML = C.outlets.map((o) => `
      <article class="oc${o.is_flagship ? " flag" : ""}">
        <h3>${esc(o.city)}</h3>
        <p>${esc(o.area || (o.is_flagship ? "Flagship showroom" : "Sales & test rides"))}</p>
        ${o.address ? `<p>${esc(o.address)}</p>` : ""}
        ${o.phone ? `<a class="otel" href="${telHref(o.phone)}">Call ${esc(fmtPhone(o.phone))}</a>` : ""}
        <button type="button" data-o="${esc(o.city)}">Enquire here →</button>
      </article>`).join("");
    $("fout").innerHTML = C.outlets.slice(0, 6).map((o) => `<li>${esc(o.city)}</li>`).join("") + '<li><a href="#outlets">All outlets →</a></li>';
    const uniq = [...new Set(cities)];
    const keep = $("outlet").value;
    $("outlet").innerHTML = uniq.map((c) => `<option>${esc(c)}</option>`).join("");
    if (keep && uniq.includes(keep)) $("outlet").value = keep;
  }

  function renderServices() {
    $("svc").innerHTML = C.services.map((s) => `
      <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${ICONS[s.icon] || ICONS.service}</svg>
      <h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></div>`).join("");
  }

  function renderFaqs() {
    $("qa").innerHTML = C.faqs.map((f) => `<details><summary>${esc(f.question)}<span>+</span></summary><p>${esc(f.answer)}</p></details>`).join("");
    $("faq").hidden = !C.faqs.length;
  }

  /* hero photo switcher */
  let heroList = [], heroIdx = 0, heroTimer = null;
  function renderHero() {
    heroList = C.models.filter((m) => m.show_in_hero && m.image_url);
    if (!heroList.length) heroList = C.models.filter((m) => m.image_url).slice(0, 1);
    heroIdx = 0;
    const first = heroList[0];
    $("heroArt").innerHTML = first ? `<img class="photo" id="heroImg" src="${esc(first.image_url)}" alt="Ola ${esc(first.name)}" fetchpriority="high">` : "";
    $("thumbs").innerHTML = heroList.length > 1 ? heroList.map((m, i) => `<button type="button" data-h="${i}" aria-pressed="${i === 0}" aria-label="Show Ola ${esc(m.name)}"><img src="${esc(m.image_url)}" alt=""></button>`).join("") : "";
    setNowShow(first);
    heroAuto();
  }
  function setNowShow(m) {
    $("nowshow").innerHTML = m ? `<b>Ola ${esc(m.name)}</b> · starting at ₹${esc(m.emi ? m.emi + "/month" : m.price || "on request")}` : "";
  }
  function heroShow(i) {
    const m = heroList[i], img = $("heroImg");
    if (!m || !img) return;
    heroIdx = i;
    img.style.opacity = 0;
    setTimeout(() => { img.src = m.image_url; img.alt = "Ola " + m.name; img.style.opacity = 1; }, 200);
    $("thumbs").querySelectorAll("button").forEach((b, k) => b.setAttribute("aria-pressed", k === i));
    setNowShow(m);
  }
  function heroAuto() {
    clearInterval(heroTimer);
    if (heroList.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      heroTimer = setInterval(() => heroShow((heroIdx + 1) % heroList.length), 4000);
  }

  function renderPopupText() {
    const h = C.settings.hero;
    if ($("enqForm")) {
      $("enqTitle").textContent = h.popup_title || "Get the best offer on your new Ola";
      if ($("enqSub")) $("enqSub").textContent = h.popup_sub || "";
      const keepM = $("eModel").value, keepO = $("eOutlet").value;
      $("eModel").innerHTML = '<option value="">Product interested in</option>' + C.models.map((m) => `<option>Ola ${esc(m.name)}</option>`).join("") + "<option>Not sure yet</option>";
      $("eOutlet").innerHTML = '<option value="">Nearest outlet</option>' + [...new Set(C.outlets.map((o) => o.city))].map((c) => `<option>${esc(c)}</option>`).join("");
      if (keepM) $("eModel").value = keepM;
      if (keepO) $("eOutlet").value = keepO;
    }
  }

  function renderAll() {
    renderText(); renderContact(); renderModels(); renderOutlets(); renderServices(); renderFaqs(); renderHero(); renderPopupText(); startCountdown();
  }

  /* ---------- countdown ---------- */
  let cdTimer = null;
  function startCountdown() {
    clearTimeout(cdTimer);
    const h = C.settings.hero, cd = $("cd");
    const target = Date.parse(h.countdown_target || "");
    if (!h.countdown_on || isNaN(target)) { cd.hidden = true; return; }
    cd.hidden = false;
    const pad = (n) => String(n).padStart(2, "0");
    const boxes = cd.querySelectorAll("div");
    (function tick() {
      let d = target - Date.now();
      if (d <= 0) { $("cdLabel").textContent = h.countdown_done || ""; boxes.forEach((x) => (x.hidden = true)); if (!h.countdown_done) cd.hidden = true; return; }
      boxes.forEach((x) => (x.hidden = false));
      $("cdLabel").textContent = h.countdown_label || "";
      $("cdD").textContent = pad(Math.floor(d / 864e5)); d %= 864e5;
      $("cdH").textContent = pad(Math.floor(d / 36e5)); d %= 36e5;
      $("cdM").textContent = pad(Math.floor(d / 6e4)); d %= 6e4;
      $("cdS").textContent = pad(Math.floor(d / 1e3));
      cdTimer = setTimeout(tick, 1000);
    })();
  }

  /* ---------- load from Supabase ---------- */
  async function loadRemote() {
    if (!sb) return false;
    try {
      const q = (t) => sb.from(t).select("*").eq("is_active", true).order("sort_order", { ascending: true });
      const [st, md, ou, fq, sv] = await Promise.all([sb.from("settings").select("key,value"), q("models"), q("outlets"), q("faqs"), q("services")]);
      if (st.error || md.error || ou.error || fq.error || sv.error) throw (st.error || md.error || ou.error || fq.error || sv.error);
      (st.data || []).forEach((r) => { if (r && r.key && r.value && typeof r.value === "object") C.settings[r.key] = Object.assign({}, D.settings[r.key] || {}, r.value); });
      C.models = md.data; C.outlets = ou.data; C.faqs = fq.data; C.services = sv.data;
      return true;
    } catch (e) {
      console.warn("Using built-in content:", e && e.message ? e.message : e);
      return false;
    }
  }

  /* ---------- enquiries ---------- */
  async function sendEnquiry(form, source) {
    const fd = new FormData(form);
    if (fd.get("bot-field")) return true;
    const row = {
      source,
      name: String(fd.get("name") || "").trim().slice(0, 100),
      phone: digits(fd.get("phone")).slice(-10),
      pincode: digits(fd.get("pincode")).slice(0, 6),
      product: String(fd.get("product") || fd.get("model") || ""),
      interest: String(fd.get("interest") || ""),
      outlet: String(fd.get("outlet") || ""),
      preferred_date: String(fd.get("date") || ""),
      message: String(fd.get("message") || "").slice(0, 1000),
      page: location.href.slice(0, 300)
    };
    const jobs = [];
    if (sb) jobs.push(sb.from("enquiries").insert(row).then((r) => { if (r.error) throw r.error; }));
    const gs = (C.settings.integrations || {}).google_script_url;
    if (gs) {
      const data = new URLSearchParams(fd); data.set("page", row.page);
      jobs.push(fetch(gs, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: data.toString() }));
    }
    if (!jobs.length) throw new Error("No enquiry destination set");
    const results = await Promise.allSettled(jobs);
    if (!results.some((r) => r.status === "fulfilled")) throw results[0].reason;
    return true;
  }
  const waLink = (text) => "https://wa.me/" + digits(C.settings.business.whatsapp) + "?text=" + encodeURIComponent(text);

  /* ---------- static wiring (runs once) ---------- */
  function wire() {
    $("mtabs").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-f]"); if (!b) return;
      mfilter = b.dataset.f;
      $("mtabs").querySelectorAll("button").forEach((x) => x.setAttribute("aria-selected", x === b));
      renderModels();
    });
    $("mgrid").addEventListener("click", (e) => {
      const bk = e.target.closest("[data-book]"); if (bk) { openEnquiry(bk.dataset.book); return; }
      const tr = e.target.closest("[data-tr]"); if (tr) enquire({ interest: "Book a test ride", model: tr.dataset.tr });
    });
    $("ogrid").addEventListener("click", (e) => { const b = e.target.closest("button[data-o]"); if (b) enquire({ outlet: b.dataset.o }); });
    $("thumbs").addEventListener("click", (e) => { const b = e.target.closest("button[data-h]"); if (b) { heroShow(+b.dataset.h); heroAuto(); } });
    $("nyOffer").addEventListener("click", () => openEnquiry());
    document.querySelectorAll("a[data-interest]").forEach((a) => a.addEventListener("click", () => { $("interest").value = a.dataset.interest; }));

    $("burger").addEventListener("click", () => { const open = $("mnav").hidden; $("mnav").hidden = !open; $("burger").setAttribute("aria-expanded", open); });
    $("mnav").addEventListener("click", (e) => { if (e.target.tagName === "A") { $("mnav").hidden = true; $("burger").setAttribute("aria-expanded", "false"); } });

    /* savings */
    const inr = (n) => "₹" + Math.max(0, Math.round(n)).toLocaleString("en-IN");
    function calc() {
      const km = +$("km").value, p = +$("petrol").value, mi = +$("mileage").value, u = +$("unit").value;
      $("kmOut").textContent = km + " km"; $("petrolOut").textContent = "₹" + p + " / litre";
      $("mileageOut").textContent = mi + " km/l"; $("unitOut").textContent = "₹" + u + " / unit";
      const month = km * 30, pet = (month / mi) * p, ev = month * 0.035 * u, save = pet - ev;
      $("save").textContent = inr(save); $("year").textContent = inr(save * 12); $("five").textContent = inr(save * 60);
      $("petAmt").textContent = inr(pet); $("evAmt").textContent = inr(ev);
    }
    ["km", "petrol", "mileage", "unit"].forEach((id) => $(id).addEventListener("input", calc)); calc();

    $("yr").textContent = new Date().getFullYear();
    try { $("date").min = new Date().toISOString().slice(0, 10); } catch (e) {}

    /* contact form */
    $("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target, name = $("name").value.trim(), phone = digits($("phone").value);
      $("nameErr").textContent = name ? "" : "Enter your name.";
      $("phoneErr").textContent = /^[6-9]\d{9}$/.test(phone) ? "" : "Enter a 10-digit mobile number starting with 6–9.";
      if (!name || $("phoneErr").textContent) return;
      const btn = $("cSend"), ok = $("ok"); btn.disabled = true; btn.textContent = "Sending…";
      const text = `Enquiry – Novelty Ola\nName: ${name}\nMobile: ${phone}\nOutlet: ${$("outlet").value}\nInterest: ${$("interest").value}\nModel: ${$("model").value}\nDate: ${$("date").value || "Any"}\n${$("msg").value.trim()}`;
      try {
        await sendEnquiry(form, "Contact form");
        ok.innerHTML = `Thank you, ${esc(name)}. We've received your enquiry and the Novelty Ola team at ${esc($("outlet").value)} will call you shortly.`;
        form.reset(); renderModels(); renderOutlets();
      } catch (err) {
        ok.innerHTML = `We couldn't send your enquiry just now. Please <a href="${waLink(text)}" target="_blank" rel="noopener">send it on WhatsApp</a> or call ${esc(C.settings.business.phone_display)}.`;
      }
      ok.hidden = false; btn.disabled = false; btn.textContent = "Send enquiry";
    });
  }

  function enquire({ outlet, interest, model }) {
    if (outlet) $("outlet").value = outlet;
    if (interest) $("interest").value = interest;
    if (model) $("model").value = model;
    $("contact").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => $("name").focus({ preventScroll: true }), 500);
  }

  /* ---------- popup ---------- */
  const modal = $("enq"), body = $("enqBody"), formHTML = body.innerHTML;
  let lastFocus = null;
  function bindPopupForm() { $("enqForm").addEventListener("submit", sendPopup); renderPopupText(); }
  function openEnquiry(model) {
    if (typeof model !== "string") model = "";
    if (!$("enqForm")) { body.innerHTML = formHTML; bindPopupForm(); }
    const h = C.settings.hero;
    $("enqTitle").textContent = model ? `Book your Ola ${model}` : (h.popup_title || "Get the best offer on your new Ola");
    if (model) $("eModel").value = "Ola " + model;
    if (!modal.hidden) return;
    lastFocus = document.activeElement; modal.hidden = false; document.body.classList.add("lock");
    try { sessionStorage.setItem("nolaPopup", "1"); } catch (e) {}
    setTimeout(() => { const f = $("eName"); (f || $("enqClose")).focus(); }, 60);
  }
  function closeEnquiry() {
    modal.hidden = true; document.body.classList.remove("lock");
    if (!$("enqForm")) { body.innerHTML = formHTML; bindPopupForm(); }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  async function sendPopup(e) {
    e.preventDefault();
    const name = $("eName").value.trim(), phone = digits($("ePhone").value), pin = digits($("ePin").value), model = $("eModel").value, outlet = $("eOutlet").value;
    let err = "";
    if (!name) err = "Enter your name.";
    else if (!/^[6-9]\d{9}$/.test(phone)) err = "Enter a 10-digit mobile number starting with 6–9.";
    else if (!/^[1-9]\d{5}$/.test(pin)) err = "Enter your 6-digit pincode.";
    else if (!model) err = "Choose the product you're interested in.";
    $("eErr").textContent = err; if (err) return;
    const wa = waLink(`Enquiry – Novelty Ola website\nName: ${name}\nMobile: ${phone}\nPincode: ${pin}\nInterested in: ${model}\nNearest outlet: ${outlet || "Not selected"}`);
    const btn = e.target.querySelector(".go"); btn.disabled = true; btn.textContent = "Sending…";
    try {
      await sendEnquiry(e.target, "Popup");
      body.innerHTML = `<div class="done"><div class="tick">✓</div><h2 id="enqTitle">Thank you, ${esc(name)}</h2><p class="sub">We've received your enquiry. The Novelty Ola team will call you shortly on ${esc(phone)}.</p><a class="btn btn-ghost go" href="${wa}" target="_blank" rel="noopener">Chat with us on WhatsApp</a></div>`;
    } catch (er) {
      btn.disabled = false; btn.textContent = "I am Interested";
      $("eErr").innerHTML = `Couldn't send right now. <a href="${wa}" target="_blank" rel="noopener">Send on WhatsApp</a> or call ${esc(C.settings.business.phone_display)}.`;
    }
  }
  bindPopupForm();
  window.openEnquiry = openEnquiry;
  $("helpBtn").addEventListener("click", () => openEnquiry());
  $("enqClose").addEventListener("click", closeEnquiry);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeEnquiry(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeEnquiry(); });

  /* ---------- confetti + fireworks ---------- */
  function fireworks() {
    const cv = $("fw"), ctx = cv.getContext("2d"), hero = cv.parentElement;
    const COLORS = ["#FFFFFF", "#FFF1B5", "#FFD25E", "#6FF0E0", "#7A1E5C", "#FFE0EC"];
    let W = 0, H = 0, parts = [], conf = [], running = true, next = 0;
    const mk = (y) => ({ x: Math.random() * W, y, w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, vy: 0.6 + Math.random() * 1.1, vx: (Math.random() - 0.5) * 0.6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.12, c: COLORS[(Math.random() * COLORS.length) | 0] });
    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1); W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      conf = Array.from({ length: Math.min(110, Math.round((W * H) / 11000)) }, () => mk(Math.random() * H));
    }
    function burst(x, y) { const c = COLORS[(Math.random() * COLORS.length) | 0], n = 50 + ((Math.random() * 30) | 0); for (let i = 0; i < n; i++) { const a = (Math.PI * 2 * i) / n, v = 1.6 + Math.random() * 2.6; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c }); } }
    function drawConf(move) {
      for (const p of conf) {
        if (move) { p.y += p.vy; p.x += p.vx + Math.sin(p.y / 40) * 0.3; p.r += p.vr; if (p.y > H + 10) Object.assign(p, mk(-10)); }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = 0.9; ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
    }
    function frame(t) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H); drawConf(true);
      if (t > next) { burst(W * (0.5 + Math.random() * 0.45), H * (0.08 + Math.random() * 0.3)); next = t + 1100 + Math.random() * 1000; }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.vx *= 0.985; p.vy *= 0.985; p.life -= 0.013;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1; requestAnimationFrame(frame);
    }
    size(); addEventListener("resize", size);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { drawConf(false); return; }
    new IntersectionObserver((es) => { const vis = es[0].isIntersecting; if (vis && !running) { running = true; requestAnimationFrame(frame); } else if (!vis) running = false; }).observe(hero);
    document.addEventListener("visibilitychange", () => { if (document.hidden) running = false; else if (!running) { running = true; requestAnimationFrame(frame); } });
    requestAnimationFrame(frame);
  }

  /* ---------- start ---------- */
  wire();
  renderAll();
  fireworks();
  let seen = false; try { seen = sessionStorage.getItem("nolaPopup") === "1"; } catch (e) {}
  const started = Date.now();
  loadRemote().then((ok) => {
    if (ok) renderAll();
    const h = C.settings.hero;
    if (seen || h.popup_auto_open === false) return;
    const wait = Math.max(0, (Number(h.popup_delay_seconds) || 2.5) * 1000 - (Date.now() - started));
    setTimeout(() => {
      if (!(document.activeElement && document.activeElement.closest("#form"))) openEnquiry();
    }, wait);
  });
})();
