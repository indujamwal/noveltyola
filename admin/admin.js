/* Novelty Ola Admin
 * Edits the website content stored in Supabase and lists enquiries.
 * Access is limited to emails in the public.admins table (see supabase/schema.sql).
 */
(function () {
  "use strict";

  const CFG = window.NOVELTY_CONFIG || {};
  const D = window.NOVELTY_DEFAULTS || { settings: {} };
  const ICONS = window.NOVELTY_ICONS || {};
  const BUCKET = CFG.IMAGE_BUCKET || "site-images";
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ------------------------------------------------------------------ */
  /* Content definitions                                                 */
  /* ------------------------------------------------------------------ */

  const LISTS = {
    models: {
      table: "models", title: "Models & prices", one: "model",
      intro: "Each model shows as a card in the Models section. Tick “Show in cover photos” to include it in the rotating photos at the top of the page.",
      columns: [
        { label: "", render: (r) => r.image_url ? `<img class="thumb" src="${esc(r.image_url)}" alt="">` : `<span class="thumb"></span>` },
        { label: "Model", render: (r) => `<b>Ola ${esc(r.name)}</b>${r.is_gen3 ? ' <span class="tag">3rd Gen</span>' : ""}<span class="sub">${esc(r.tagline)}</span>` },
        { label: "Type", render: (r) => r.type === "bike" ? "Motorcycle" : "Scooter" },
        { label: "Price", cls: "num", render: (r) => r.price ? "₹" + esc(r.price) : "On request" },
        { label: "EMI", cls: "num", render: (r) => r.emi ? "₹" + esc(r.emi) + "/mo" : "—" },
        { label: "Status", render: (r) => r.is_active ? '<span class="tag on">Live</span>' : '<span class="tag off">Hidden</span>' }
      ],
      fields: [
        { name: "name", label: "Model name", type: "text", required: true, help: "Shown as “Ola …”, e.g. S1 X+" },
        { name: "type", label: "Type", type: "select", options: [["scooter", "Scooter"], ["bike", "Motorcycle"]] },
        { name: "tagline", label: "Tagline", type: "text", full: true },
        { name: "price", label: "Starting price (₹)", type: "text", help: "e.g. 80,999 — leave empty for “On request”" },
        { name: "emi", label: "EMI per month (₹)", type: "text", help: "e.g. 1,584 — leave empty to hide" },
        { name: "image_url", label: "Photo", type: "image", full: true, folder: "models" },
        { name: "is_gen3", label: "Show “3rd Gen” label", type: "check" },
        { name: "show_in_hero", label: "Show in cover photos", type: "check" },
        { name: "is_active", label: "Live on website", type: "check" },
        { name: "sort_order", label: "Position", type: "number", help: "Lower numbers show first" }
      ],
      blank: { name: "", type: "scooter", tagline: "", price: "", emi: "", image_url: "", is_gen3: false, show_in_hero: true, is_active: true }
    },
    outlets: {
      table: "outlets", title: "Outlets", one: "outlet",
      intro: "Each outlet shows as a card, and its city appears in the running line and the enquiry forms.",
      columns: [
        { label: "City", render: (r) => `<b>${esc(r.city)}</b>${r.is_flagship ? ' <span class="tag on">Flagship</span>' : ""}<span class="sub">${esc(r.area)}</span>` },
        { label: "Phone", cls: "num", render: (r) => esc(r.phone) || "—" },
        { label: "Status", render: (r) => r.is_active ? '<span class="tag on">Live</span>' : '<span class="tag off">Hidden</span>' }
      ],
      fields: [
        { name: "city", label: "City", type: "text", required: true },
        { name: "phone", label: "Phone", type: "tel", help: "10-digit mobile, e.g. 7665004458" },
        { name: "area", label: "Area / short line", type: "text", full: true, help: "e.g. Ferozepur Road. Leave empty to show “Sales & test rides”." },
        { name: "address", label: "Full address", type: "textarea", full: true },
        { name: "is_flagship", label: "Flagship (highlighted in green)", type: "check" },
        { name: "is_active", label: "Live on website", type: "check" },
        { name: "sort_order", label: "Position", type: "number" }
      ],
      blank: { city: "", phone: "", area: "", address: "", is_flagship: false, is_active: true }
    },
    services: {
      table: "services", title: "Services", one: "service",
      intro: "Shown in the “Everything under one roof” section.",
      columns: [
        { label: "", render: (r) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${ICONS[r.icon] || ICONS.service}</svg>` },
        { label: "Service", render: (r) => `<b>${esc(r.title)}</b><span class="sub">${esc(r.description)}</span>` },
        { label: "Status", render: (r) => r.is_active ? '<span class="tag on">Live</span>' : '<span class="tag off">Hidden</span>' }
      ],
      fields: [
        { name: "title", label: "Title", type: "text", required: true, full: true },
        { name: "description", label: "Description", type: "textarea", full: true },
        { name: "icon", label: "Icon", type: "select", options: [["testride", "Scooter / test ride"], ["finance", "Card / finance"], ["exchange", "Exchange arrows"], ["insurance", "Shield / insurance"], ["service", "Spanner / service"], ["charging", "Lightning / charging"], ["offer", "Price tag / offer"], ["star", "Star"]] },
        { name: "is_active", label: "Live on website", type: "check" },
        { name: "sort_order", label: "Position", type: "number" }
      ],
      blank: { title: "", description: "", icon: "service", is_active: true }
    },
    faqs: {
      table: "faqs", title: "FAQs", one: "question",
      intro: "Questions and answers in the FAQ section.",
      columns: [
        { label: "Question", render: (r) => `<b>${esc(r.question)}</b><span class="sub">${esc(String(r.answer).slice(0, 120))}${String(r.answer).length > 120 ? "…" : ""}</span>` },
        { label: "Status", render: (r) => r.is_active ? '<span class="tag on">Live</span>' : '<span class="tag off">Hidden</span>' }
      ],
      fields: [
        { name: "question", label: "Question", type: "text", required: true, full: true },
        { name: "answer", label: "Answer", type: "textarea", full: true },
        { name: "is_active", label: "Live on website", type: "check" },
        { name: "sort_order", label: "Position", type: "number" }
      ],
      blank: { question: "", answer: "", is_active: true }
    }
  };

  const SETTINGS = {
    cover: {
      title: "Cover & offers",
      intro: "The first screen visitors see, plus the enquiry popup. Change these for each festival or offer.",
      groups: [
        { key: "hero", title: "Headline", fields: [
          { name: "badge", label: "Badge text", type: "text", help: "Small label at the top, e.g. New Year 2027 Celebrations" },
          { name: "pre_title", label: "Line above the name", type: "text", help: "e.g. Ride into 2027 with" },
          { name: "brand_1", label: "Name – first word (white)", type: "text" },
          { name: "brand_2", label: "Name – second word (dark)", type: "text" },
          { name: "sub_line", label: "Line under the name", type: "text", full: true },
          { name: "lead", label: "Main paragraph", type: "textarea", full: true },
          { name: "trust", label: "Tick badges (one per line)", type: "lines", full: true },
          { name: "cta_primary", label: "Main button text", type: "text", help: "Opens the enquiry popup" },
          { name: "cta_secondary", label: "Second button text", type: "text", help: "Jumps to the outlets section" }
        ] },
        { key: "hero", title: "Photo card", fields: [
          { name: "big_text", label: "Big text over the photo", type: "text", help: "e.g. 2027. Leave empty to hide." },
          { name: "tag_title", label: "White card – title", type: "text" },
          { name: "tag_sub", label: "White card – small line", type: "text" }
        ] },
        { key: "hero", title: "Countdown", fields: [
          { name: "countdown_on", label: "Show countdown", type: "check", full: true },
          { name: "countdown_label", label: "Label", type: "text" },
          { name: "countdown_target", label: "Count down to (India time)", type: "datetime" },
          { name: "countdown_done", label: "Text when it reaches zero", type: "text", full: true, help: "Leave empty to hide the countdown once it ends." }
        ] },
        { key: "hero", title: "Enquiry popup", fields: [
          { name: "popup_title", label: "Popup heading", type: "text", full: true },
          { name: "popup_sub", label: "Popup text", type: "textarea", full: true },
          { name: "popup_auto_open", label: "Open the popup automatically for new visitors", type: "check", full: true },
          { name: "popup_delay_seconds", label: "Seconds before it opens", type: "number" }
        ] }
      ]
    },
    business: {
      title: "Business details",
      intro: "Contact details, outlet counts and the About section.",
      groups: [
        { key: "business", title: "Contact", fields: [
          { name: "phone_display", label: "Main phone (as shown)", type: "text", help: "e.g. +91 70873 00431" },
          { name: "phone", label: "Main phone (for calling)", type: "tel", help: "Digits only, e.g. 917087300431" },
          { name: "whatsapp", label: "WhatsApp number", type: "tel", help: "With country code, digits only, e.g. 917087300431" },
          { name: "hours", label: "Showroom hours", type: "text" },
          { name: "address", label: "Flagship showroom address", type: "textarea", full: true },
          { name: "outlet_numbers", label: "Outlet numbers (one per line)", type: "textarea", full: true, help: "Format: Jalandhar: 76650 04436" }
        ] },
        { key: "business", title: "Numbers shown on the site", fields: [
          { name: "outlets_count", label: "Number of outlets", type: "text" },
          { name: "cities_count", label: "Number of cities", type: "text" }
        ] },
        { key: "business", title: "About section", fields: [
          { name: "about_title", label: "Heading", type: "text", full: true },
          { name: "about_p1", label: "First paragraph", type: "textarea", full: true },
          { name: "about_p2", label: "Second paragraph", type: "textarea", full: true },
          { name: "models_note", label: "Small print under the models", type: "textarea", full: true }
        ] }
      ]
    },
    settings: {
      title: "Site settings",
      intro: "Search engine text and where enquiries are sent.",
      groups: [
        { key: "seo", title: "Google search", fields: [
          { name: "title", label: "Page title", type: "text", full: true, help: "Shown in the browser tab and Google results" },
          { name: "description", label: "Description", type: "textarea", full: true, help: "About 150 characters shown under the title in Google" }
        ] },
        { key: "integrations", title: "Enquiries", fields: [
          { name: "google_script_url", label: "Google Sheet script link", type: "url", full: true, help: "Enquiries are always saved here in the admin panel. If this link is set, they are also added to your Google Sheet and emailed. Leave empty to stop that." }
        ] }
      ]
    }
  };

  const VIEWS = {
    dashboard: { title: "Dashboard", render: viewDashboard },
    enquiries: { title: "Enquiries", render: viewEnquiries },
    cover: { title: SETTINGS.cover.title, render: () => viewSettings("cover") },
    models: { title: LISTS.models.title, render: () => viewList("models") },
    outlets: { title: LISTS.outlets.title, render: () => viewList("outlets") },
    services: { title: LISTS.services.title, render: () => viewList("services") },
    faqs: { title: LISTS.faqs.title, render: () => viewList("faqs") },
    business: { title: SETTINGS.business.title, render: () => viewSettings("business") },
    settings: { title: SETTINGS.settings.title, render: () => viewSettings("settings") },
    admins: { title: "Admin users", render: viewAdmins }
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  function toast(msg, err) {
    const t = document.createElement("div");
    t.className = "toast" + (err ? " err" : "");
    t.textContent = msg;
    $("toasts").appendChild(t);
    setTimeout(() => t.remove(), err ? 6000 : 3000);
  }
  const fail = (e, what) => { console.error(e); toast((what || "Couldn't save") + ": " + (e && e.message ? e.message : "please try again"), true); };

  function confirmBox(text, yes) {
    return new Promise((res) => {
      $("confirmText").textContent = text;
      $("confirmYes").textContent = yes || "Delete";
      $("confirmBg").hidden = false; $("confirmYes").focus();
      const done = (v) => { $("confirmBg").hidden = true; $("confirmYes").onclick = $("confirmNo").onclick = null; res(v); };
      $("confirmYes").onclick = () => done(true);
      $("confirmNo").onclick = () => done(false);
    });
  }

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  // ISO with offset <-> value for <input type=datetime-local> shown in India time
  const isoToLocalIST = (iso) => { const d = new Date(iso); if (isNaN(d)) return ""; return new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 16); };
  const localISTtoIso = (v) => v ? v + ":00+05:30" : "";

  /* ------------------------------------------------------------------ */
  /* Form fields                                                         */
  /* ------------------------------------------------------------------ */

  let fieldSeq = 0;
  function fieldHTML(f, value) {
    const id = "f" + (++fieldSeq) + "_" + f.name;
    const cls = "fld" + (f.full || f.type === "image" ? " full" : "");
    const help = f.help ? `<span class="help">${esc(f.help)}</span>` : "";
    const v = value == null ? "" : value;
    switch (f.type) {
      case "check":
        return `<div class="${cls}"><label class="check" for="${id}"><input type="checkbox" id="${id}" name="${f.name}" ${value ? "checked" : ""}> ${esc(f.label)}</label>${help}</div>`;
      case "textarea":
        return `<div class="${cls}"><label for="${id}">${esc(f.label)}</label><textarea id="${id}" name="${f.name}" rows="4">${esc(v)}</textarea>${help}</div>`;
      case "lines":
        return `<div class="${cls}"><label for="${id}">${esc(f.label)}</label><textarea id="${id}" name="${f.name}" rows="4">${esc((value || []).join("\n"))}</textarea>${help}</div>`;
      case "select":
        return `<div class="${cls}"><label for="${id}">${esc(f.label)}</label><select id="${id}" name="${f.name}">${f.options.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>${help}</div>`;
      case "datetime":
        return `<div class="${cls}"><label for="${id}">${esc(f.label)}</label><input type="datetime-local" id="${id}" name="${f.name}" value="${esc(isoToLocalIST(v))}">${help}</div>`;
      case "image":
        return `<div class="${cls}"><span class="lbl">${esc(f.label)}</span>
          <div class="imgfld" data-img="${f.name}" data-folder="${esc(f.folder || "images")}">
            <img class="prev" src="${esc(v)}" alt="" ${v ? "" : 'style="visibility:hidden"'}>
            <div class="ctrls">
              <span class="btn ghost upl">Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload photo"></span>
              <label for="${id}" class="help" style="margin:0">or paste an image link</label>
              <input type="url" id="${id}" name="${f.name}" value="${esc(v)}" placeholder="https://…" style="font:14px var(--font);padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)">
              <span class="help">JPG, PNG or WebP, up to 5 MB. A wide photo (about 8:7) looks best.</span>
            </div>
          </div></div>`;
      default: {
        const type = f.type === "number" ? "number" : f.type === "tel" ? "tel" : f.type === "url" ? "url" : "text";
        return `<div class="${cls}"><label for="${id}">${esc(f.label)}</label><input type="${type}" id="${id}" name="${f.name}" value="${esc(v)}" ${f.required ? "required" : ""} ${type === "number" ? 'step="any"' : ""}>${help}</div>`;
      }
    }
  }

  function readFields(fields, root) {
    const out = {};
    fields.forEach((f) => {
      const el = root.querySelector(`[name="${f.name}"]`);
      if (!el) return;
      if (f.type === "check") out[f.name] = el.checked;
      else if (f.type === "number") out[f.name] = el.value === "" ? 0 : Number(el.value);
      else if (f.type === "lines") out[f.name] = el.value.split("\n").map((s) => s.trim()).filter(Boolean);
      else if (f.type === "datetime") out[f.name] = localISTtoIso(el.value);
      else out[f.name] = el.value.trim();
    });
    return out;
  }

  function validate(fields, data) {
    for (const f of fields) {
      if (f.required && !String(data[f.name] || "").trim()) return `${f.label} is required.`;
      if (f.type === "url" && data[f.name] && !/^https?:\/\//i.test(data[f.name])) return `${f.label} must start with https://`;
    }
    return "";
  }

  // Image upload: wires every .imgfld inside root
  function wireImages(root) {
    root.querySelectorAll(".imgfld").forEach((box) => {
      const file = box.querySelector('input[type="file"]'), url = box.querySelector('input[type="url"]'), prev = box.querySelector(".prev"), btn = box.querySelector(".upl");
      const show = (u) => { prev.src = u || ""; prev.style.visibility = u ? "visible" : "hidden"; };
      url.addEventListener("input", () => show(url.value.trim()));
      file.addEventListener("change", async () => {
        const f = file.files && file.files[0]; if (!f) return;
        if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast("Please choose a JPG, PNG or WebP image.", true); file.value = ""; return; }
        if (f.size > 5 * 1024 * 1024) { toast("That image is over 5 MB. Please choose a smaller one.", true); file.value = ""; return; }
        const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
        const path = `${box.dataset.folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        btn.firstChild.textContent = "Uploading…"; btn.classList.add("busy");
        try {
          const { error } = await sb.storage.from(BUCKET).upload(path, f, { contentType: f.type, cacheControl: "31536000", upsert: false });
          if (error) throw error;
          const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
          url.value = data.publicUrl; show(data.publicUrl);
          toast("Photo uploaded. Click Save to use it.");
        } catch (e) { fail(e, "Upload failed"); }
        btn.firstChild.textContent = "Upload photo"; btn.classList.remove("busy"); file.value = "";
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Drawer editor                                                       */
  /* ------------------------------------------------------------------ */

  let drawerReturn = null;
  function openDrawer(title, html, onSave, extraButtons) {
    drawerReturn = document.activeElement;
    $("drawerTitle").textContent = title;
    const form = $("drawerForm");
    form.innerHTML = `<div class="fgrid">${html}</div><p class="form-err" id="drawerErr" role="alert"></p>
      <div class="save-bar">${extraButtons || ""}<span style="flex:1"></span><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Save</button></div>`;
    wireImages(form);
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = "Saving…";
      try { const ok = await onSave(form); if (ok !== false) closeDrawer(); }
      catch (er) { fail(er); }
      btn.disabled = false; btn.textContent = "Save";
    };
    form.querySelector("[data-close]").onclick = closeDrawer;
    $("drawer").hidden = false; $("drawerBg").hidden = false;
    setTimeout(() => { const f = form.querySelector("input:not([type=hidden]):not([type=file]),textarea,select"); if (f) f.focus(); }, 30);
  }
  function closeDrawer() {
    $("drawer").hidden = true; $("drawerBg").hidden = true; $("drawerForm").innerHTML = "";
    if (drawerReturn && drawerReturn.focus) drawerReturn.focus();
  }

  /* ------------------------------------------------------------------ */
  /* Views                                                               */
  /* ------------------------------------------------------------------ */

  const view = () => $("view");
  const setActions = (html) => { $("topActions").innerHTML = html || ""; };

  async function viewDashboard() {
    setActions('<a class="btn primary" href="#enquiries">View enquiries</a>');
    view().innerHTML = '<p class="loading">Loading…</p>';
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const [enq, models, outlets] = await Promise.all([
      sb.from("enquiries").select("id,created_at,name,phone,product,outlet,status,source").gte("created_at", since).order("created_at", { ascending: false }).limit(1000),
      sb.from("models").select("id,is_active"),
      sb.from("outlets").select("id,is_active")
    ]);
    if (enq.error) throw enq.error;
    const rows = enq.data || [];
    const todayIST = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
    const isToday = (r) => new Date(new Date(r.created_at).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10) === todayIST;
    const week = Date.now() - 7 * 864e5;
    const n = { today: rows.filter(isToday).length, week: rows.filter((r) => new Date(r.created_at) >= week).length, month: rows.length, fresh: rows.filter((r) => r.status === "new").length };
    const byOutlet = {}; rows.forEach((r) => { const k = r.outlet || "Not chosen"; byOutlet[k] = (byOutlet[k] || 0) + 1; });
    const top = Object.entries(byOutlet).sort((a, b) => b[1] - a[1]).slice(0, 6);
    view().innerHTML = `
      <div class="stats">
        <div class="stat hl"><p class="k">New, not yet contacted</p><p class="v">${n.fresh}</p></div>
        <div class="stat"><p class="k">Enquiries today</p><p class="v">${n.today}</p></div>
        <div class="stat"><p class="k">Last 7 days</p><p class="v">${n.week}</p></div>
        <div class="stat"><p class="k">Last 30 days</p><p class="v">${n.month}</p></div>
      </div>
      <div class="grid2">
        <div class="card"><h2>Latest enquiries</h2>
          <div class="list-mini">${rows.slice(0, 6).map((r) => `<div class="it"><div><b>${esc(r.name)}</b> · ${esc(r.phone)}<br><span>${esc(r.product || "—")} · ${esc(r.outlet || "No outlet")}</span></div><span>${esc(fmtDate(r.created_at))}</span></div>`).join("") || '<p class="muted">No enquiries in the last 30 days yet.</p>'}</div>
        </div>
        <div class="card"><h2>Enquiries by outlet (30 days)</h2>
          <div class="list-mini">${top.map(([k, v]) => `<div class="it"><div>${esc(k)}</div><b>${v}</b></div>`).join("") || '<p class="muted">Nothing yet.</p>'}</div>
        </div>
      </div>
      <div class="card"><h2>Website content</h2>
        <p class="muted">${(models.data || []).filter((m) => m.is_active).length} models live · ${(outlets.data || []).filter((o) => o.is_active).length} outlets live. Changes you save appear on the website the next time a visitor opens it.</p>
      </div>`;
  }

  /* enquiries */
  let enqRows = [];
  const STATUSES = [["new", "New"], ["contacted", "Contacted"], ["booked", "Booked"], ["closed", "Closed"]];
  async function viewEnquiries() {
    setActions('<button class="btn ghost" type="button" id="csvBtn">Download CSV</button>');
    view().innerHTML = `
      <div class="toolbar">
        <input type="search" id="eqSearch" placeholder="Search name, phone, model, outlet…" aria-label="Search enquiries">
        <select id="eqStatus" aria-label="Filter by status"><option value="">All statuses</option>${STATUSES.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
        <select id="eqRange" aria-label="Filter by date"><option value="7">Last 7 days</option><option value="30" selected>Last 30 days</option><option value="90">Last 90 days</option><option value="0">All time</option></select>
      </div>
      <div class="tbl-wrap"><table><thead><tr><th>Received</th><th>Customer</th><th>Interested in</th><th>Outlet</th><th>Source</th><th>Status</th><th></th></tr></thead><tbody id="eqBody"><tr><td colspan="7" class="loading">Loading…</td></tr></tbody></table></div>
      <p class="muted" id="eqCount"></p>`;
    const load = async () => {
      const days = +$("eqRange").value;
      let q = sb.from("enquiries").select("*").order("created_at", { ascending: false }).limit(2000);
      if (days) q = q.gte("created_at", new Date(Date.now() - days * 864e5).toISOString());
      const { data, error } = await q;
      if (error) { fail(error, "Couldn't load enquiries"); return; }
      enqRows = data || []; draw();
    };
    const filtered = () => {
      const s = $("eqSearch").value.trim().toLowerCase(), st = $("eqStatus").value;
      return enqRows.filter((r) => (!st || r.status === st) && (!s || [r.name, r.phone, r.product, r.outlet, r.pincode, r.message, r.interest].join(" ").toLowerCase().includes(s)));
    };
    const draw = () => {
      const rows = filtered();
      $("eqBody").innerHTML = rows.map((r) => `
        <tr data-id="${r.id}">
          <td class="num">${esc(fmtDate(r.created_at))}</td>
          <td><b>${esc(r.name)}</b><span class="sub"><a href="tel:+91${esc(r.phone)}">${esc(r.phone)}</a> · <a href="https://wa.me/91${esc(r.phone)}" target="_blank" rel="noopener">WhatsApp</a>${r.pincode ? " · " + esc(r.pincode) : ""}</span></td>
          <td>${esc(r.product || "—")}${r.interest ? `<span class="sub">${esc(r.interest)}</span>` : ""}</td>
          <td>${esc(r.outlet || "—")}</td>
          <td><span class="tag">${esc(r.source)}</span></td>
          <td><select class="status st-${esc(r.status)}" data-status aria-label="Status">${STATUSES.map(([k, l]) => `<option value="${k}" ${k === r.status ? "selected" : ""}>${l}</option>`).join("")}</select></td>
          <td class="actions"><button class="icon-btn" type="button" data-open title="Details and notes" aria-label="Details">✎</button><button class="icon-btn" type="button" data-del title="Delete" aria-label="Delete">🗑</button></td>
        </tr>`).join("") || `<tr><td colspan="7" class="empty">No enquiries match.</td></tr>`;
      $("eqCount").textContent = `${rows.length} of ${enqRows.length} enquiries shown.`;
    };
    $("eqSearch").addEventListener("input", draw);
    $("eqStatus").addEventListener("change", draw);
    $("eqRange").addEventListener("change", load);
    $("eqBody").addEventListener("change", async (e) => {
      const sel = e.target.closest("[data-status]"); if (!sel) return;
      const id = +sel.closest("tr").dataset.id, r = enqRows.find((x) => x.id === id);
      const { error } = await sb.from("enquiries").update({ status: sel.value }).eq("id", id);
      if (error) { fail(error); sel.value = r.status; return; }
      r.status = sel.value; sel.className = "status st-" + sel.value; toast("Status updated"); refreshNewCount();
    });
    $("eqBody").addEventListener("click", async (e) => {
      const tr = e.target.closest("tr[data-id]"); if (!tr) return;
      const id = +tr.dataset.id, r = enqRows.find((x) => x.id === id);
      if (e.target.closest("[data-del]")) {
        if (!(await confirmBox(`Delete the enquiry from ${r.name}? This can't be undone.`))) return;
        const { error } = await sb.from("enquiries").delete().eq("id", id);
        if (error) return fail(error, "Couldn't delete");
        enqRows = enqRows.filter((x) => x.id !== id); draw(); toast("Enquiry deleted"); refreshNewCount();
      } else if (e.target.closest("[data-open]")) {
        const info = [["Received", fmtDate(r.created_at)], ["Phone", r.phone], ["Pincode", r.pincode], ["Interested in", r.product], ["Interest", r.interest], ["Outlet", r.outlet], ["Preferred date", r.preferred_date], ["Message", r.message], ["Source", r.source], ["Page", r.page]].filter(([, v]) => v);
        const html = `<div class="fld full"><div class="list-mini">${info.map(([k, v]) => `<div class="it"><span>${esc(k)}</span><div style="text-align:right">${esc(v)}</div></div>`).join("")}</div></div>` +
          fieldHTML({ name: "status", label: "Status", type: "select", options: STATUSES }, r.status) +
          fieldHTML({ name: "notes", label: "Notes (only admins see these)", type: "textarea", full: true }, r.notes);
        openDrawer(r.name, html, async (form) => {
          const upd = { status: form.querySelector('[name="status"]').value, notes: form.querySelector('[name="notes"]').value.trim() };
          const { error } = await sb.from("enquiries").update(upd).eq("id", id);
          if (error) throw error;
          Object.assign(r, upd); draw(); toast("Saved"); refreshNewCount();
        });
      }
    });
    $("csvBtn").addEventListener("click", () => {
      const rows = filtered();
      const cols = ["created_at", "name", "phone", "pincode", "product", "interest", "outlet", "preferred_date", "message", "source", "status", "notes"];
      const cell = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
      const csv = [cols.join(",")].concat(rows.map((r) => cols.map((c) => cell(c === "created_at" ? fmtDate(r[c]) : r[c])).join(","))).join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
      a.download = `novelty-ola-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
    });
    await load();
  }

  /* generic list (models, outlets, services, faqs) */
  async function viewList(key) {
    const L = LISTS[key];
    setActions(`<button class="btn primary" type="button" id="addBtn">Add ${L.one}</button>`);
    view().innerHTML = `<p class="muted">${esc(L.intro)}</p><div class="tbl-wrap"><table><thead><tr><th style="width:84px">Order</th>${L.columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}<th></th></tr></thead><tbody id="lsBody"><tr><td colspan="9" class="loading">Loading…</td></tr></tbody></table></div>`;
    let rows = [];
    const load = async () => {
      const { data, error } = await sb.from(L.table).select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
      if (error) return fail(error, "Couldn't load");
      rows = data || []; draw();
    };
    const draw = () => {
      $("lsBody").innerHTML = rows.map((r, i) => `
        <tr data-id="${esc(r.id)}">
          <td><button class="icon-btn" type="button" data-up aria-label="Move up" ${i === 0 ? "disabled" : ""}>↑</button> <button class="icon-btn" type="button" data-down aria-label="Move down" ${i === rows.length - 1 ? "disabled" : ""}>↓</button></td>
          ${L.columns.map((c) => `<td class="${c.cls || ""}">${c.render(r)}</td>`).join("")}
          <td class="actions"><button class="btn ghost sm" type="button" data-edit>Edit</button><button class="icon-btn" type="button" data-del aria-label="Delete">🗑</button></td>
        </tr>`).join("") || `<tr><td colspan="9" class="empty">Nothing here yet. Use “Add ${L.one}”.</td></tr>`;
    };
    const edit = (r) => {
      const isNew = !r;
      const data = r || Object.assign({}, L.blank, { sort_order: rows.length ? Math.max(...rows.map((x) => x.sort_order || 0)) + 10 : 10 });
      openDrawer(isNew ? `Add ${L.one}` : `Edit ${L.one}`, L.fields.map((f) => fieldHTML(f, data[f.name])).join(""), async (form) => {
        const vals = readFields(L.fields, form);
        const msg = validate(L.fields, vals);
        if (msg) { $("drawerErr").textContent = msg; return false; }
        const res = isNew ? await sb.from(L.table).insert(vals).select().single() : await sb.from(L.table).update(vals).eq("id", r.id).select().single();
        if (res.error) throw res.error;
        toast(isNew ? "Added" : "Saved");
        await load();
      });
    };
    const move = async (i, dir) => {
      const j = i + dir; if (j < 0 || j >= rows.length) return;
      [rows[i], rows[j]] = [rows[j], rows[i]];
      const changes = rows.map((r, k) => ({ r, order: (k + 1) * 10 })).filter((x) => x.r.sort_order !== x.order);
      draw();
      try {
        for (const c of changes) { const { error } = await sb.from(L.table).update({ sort_order: c.order }).eq("id", c.r.id); if (error) throw error; c.r.sort_order = c.order; }
      } catch (e) { fail(e, "Couldn't reorder"); await load(); }
    };
    $("addBtn").onclick = () => edit(null);
    $("lsBody").addEventListener("click", async (e) => {
      const tr = e.target.closest("tr[data-id]"); if (!tr) return;
      const i = rows.findIndex((x) => String(x.id) === tr.dataset.id), r = rows[i];
      if (e.target.closest("[data-edit]")) edit(r);
      else if (e.target.closest("[data-up]")) move(i, -1);
      else if (e.target.closest("[data-down]")) move(i, 1);
      else if (e.target.closest("[data-del]")) {
        const label = r.name || r.city || r.title || r.question;
        if (!(await confirmBox(`Delete “${label}”? To remove it from the website for now, you can untick “Live on website” instead.`))) return;
        const { error } = await sb.from(L.table).delete().eq("id", r.id);
        if (error) return fail(error, "Couldn't delete");
        toast("Deleted"); await load();
      }
    });
    await load();
  }

  /* settings forms */
  async function viewSettings(key) {
    const S = SETTINGS[key];
    setActions("");
    const keys = [...new Set(S.groups.map((g) => g.key))];
    const { data, error } = await sb.from("settings").select("key,value").in("key", keys);
    if (error) throw error;
    const vals = {};
    keys.forEach((k) => { const row = (data || []).find((r) => r.key === k); vals[k] = Object.assign({}, D.settings[k] || {}, row ? row.value : {}); });
    view().innerHTML = `<p class="muted">${esc(S.intro)}</p><form id="setForm" novalidate>${S.groups.map((g) => `<div class="card" style="margin-bottom:20px"><h2>${esc(g.title)}</h2><div class="fgrid">${g.fields.map((f) => fieldHTML(f, vals[g.key][f.name])).join("")}</div></div>`).join("")}
      <p class="form-err" id="setErr" role="alert"></p>
      <div class="save-bar"><a class="btn ghost" href="/" target="_blank" rel="noopener">View website ↗</a><button class="btn primary" type="submit">Save changes</button></div></form>`;
    const form = $("setForm");
    wireImages(form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const out = {};
      keys.forEach((k) => (out[k] = Object.assign({}, vals[k])));
      let msg = "";
      S.groups.forEach((g) => { const part = readFields(g.fields, form); msg = msg || validate(g.fields, part); Object.assign(out[g.key], part); });
      $("setErr").textContent = msg; if (msg) return;
      btn.disabled = true; btn.textContent = "Saving…";
      try {
        const { error } = await sb.from("settings").upsert(keys.map((k) => ({ key: k, value: out[k] })), { onConflict: "key" });
        if (error) throw error;
        keys.forEach((k) => (vals[k] = out[k]));
        toast("Saved. The website shows the change on its next load.");
      } catch (er) { fail(er); }
      btn.disabled = false; btn.textContent = "Save changes";
    });
  }

  /* admin users */
  async function viewAdmins() {
    setActions("");
    const { data, error } = await sb.from("admins").select("*").order("created_at");
    if (error) throw error;
    const me = (session && session.user.email || "").toLowerCase();
    view().innerHTML = `
      <div class="card"><h2>Who can sign in here</h2>
        <p class="hint">To add someone: first create their login in Supabase → Authentication → Users → Add user (email + password). Then add the same email below.</p>
        <div class="list-mini" id="adList">${(data || []).map((a) => `<div class="it"><div><b>${esc(a.email)}</b>${a.email.toLowerCase() === me ? ' <span class="tag on">You</span>' : ""}</div>${a.email.toLowerCase() === me ? "" : `<button class="btn ghost sm" type="button" data-rm="${esc(a.email)}">Remove</button>`}</div>`).join("")}</div>
      </div>
      <form class="card" id="adForm" novalidate><h2>Add an admin</h2>
        <div class="fgrid"><div class="fld full"><label for="adEmail">Email</label><input type="email" id="adEmail" required placeholder="name@noveltyola.com"></div></div>
        <p class="form-err" id="adErr" role="alert"></p>
        <div class="save-bar"><button class="btn primary" type="submit">Add admin</button></div>
      </form>`;
    $("adForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("adEmail").value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $("adErr").textContent = "Enter a valid email address."; return; }
      const { error } = await sb.from("admins").insert({ email });
      if (error) return fail(error, "Couldn't add");
      toast("Admin added"); viewAdmins();
    });
    $("adList").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-rm]"); if (!b) return;
      if (!(await confirmBox(`Remove ${b.dataset.rm}? They will no longer be able to use the admin panel.`, "Remove"))) return;
      const { error } = await sb.from("admins").delete().eq("email", b.dataset.rm);
      if (error) return fail(error, "Couldn't remove");
      toast("Removed"); viewAdmins();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Routing & auth                                                      */
  /* ------------------------------------------------------------------ */

  let sb = null, session = null, current = "";
  async function route() {
    if (!session) return;
    let v = (location.hash || "").replace("#", "");
    if (!VIEWS[v]) v = "dashboard";
    current = v;
    $("viewTitle").textContent = VIEWS[v].title;
    document.title = VIEWS[v].title + " · Novelty Ola Admin";
    document.querySelectorAll("#nav a").forEach((a) => { if (a.dataset.v === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    $("side").classList.remove("open"); $("menuBtn").setAttribute("aria-expanded", "false");
    closeDrawer();
    try { await VIEWS[v].render(); }
    catch (e) { view().innerHTML = `<div class="card"><h2>Couldn't load this page</h2><p class="muted">${esc(e && e.message ? e.message : e)}</p></div>`; }
    if (current === v) view().focus({ preventScroll: true });
  }

  async function refreshNewCount() {
    const { count } = await sb.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new");
    $("newCount").textContent = count || ""; $("newCount").hidden = !count;
  }

  async function enterApp(s) {
    session = s;
    const { data: ok, error } = await sb.rpc("is_admin");
    if (error || !ok) {
      await sb.auth.signOut();
      session = null;
      showAuth(error ? "Couldn't check your access: " + error.message : "This account isn't an admin yet. Ask an existing admin to add your email under Admin users.");
      return;
    }
    $("authView").hidden = true; $("appView").hidden = false;
    $("who").textContent = "Signed in as " + s.user.email;
    refreshNewCount();
    route();
  }

  function showAuth(err) {
    $("appView").hidden = true; $("authView").hidden = false;
    $("loginForm").hidden = false; $("resetForm").hidden = true;
    $("loginErr").textContent = err || "";
  }

  function init() {
    if (!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase)) {
      $("authView").hidden = false; $("loginForm").hidden = true; $("setupNote").hidden = false;
      return;
    }
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

    $("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("loginEmail").value.trim(), password = $("loginPass").value;
      if (!email || !password) { $("loginErr").textContent = "Enter your email and password."; return; }
      $("loginBtn").disabled = true; $("loginBtn").textContent = "Signing in…"; $("loginErr").textContent = "";
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      $("loginBtn").disabled = false; $("loginBtn").textContent = "Sign in";
      if (error) { $("loginErr").textContent = error.message === "Invalid login credentials" ? "Email or password is wrong." : error.message; return; }
      enterApp(data.session);
    });
    $("forgotBtn").addEventListener("click", async () => {
      const email = $("loginEmail").value.trim();
      if (!email) { $("loginErr").textContent = "Type your email above first, then click “Forgot password?”."; return; }
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/admin/" });
      $("loginErr").textContent = error ? error.message : "If that email has an account, a reset link is on its way.";
    });
    $("resetForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const p = $("newPass").value;
      if (p.length < 8) { $("resetErr").textContent = "Use at least 8 characters."; return; }
      const { data, error } = await sb.auth.updateUser({ password: p });
      if (error) { $("resetErr").textContent = error.message; return; }
      toast("Password saved"); history.replaceState(null, "", location.pathname); enterApp((await sb.auth.getSession()).data.session || session);
    });
    $("logoutBtn").addEventListener("click", async () => { await sb.auth.signOut(); session = null; showAuth(); });
    $("menuBtn").addEventListener("click", () => { const o = !$("side").classList.contains("open"); $("side").classList.toggle("open", o); $("menuBtn").setAttribute("aria-expanded", o); });
    $("drawerClose").addEventListener("click", closeDrawer);
    $("drawerBg").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (!$("confirmBg").hidden) $("confirmNo").click(); else if (!$("drawer").hidden) closeDrawer(); } });
    window.addEventListener("hashchange", route);

    sb.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") {
        session = s;
        $("appView").hidden = true; $("authView").hidden = false; $("loginForm").hidden = true; $("resetForm").hidden = false;
      }
    });
    sb.auth.getSession().then(({ data }) => {
      if (/type=recovery/.test(location.hash)) return; // handled by PASSWORD_RECOVERY
      if (data.session) enterApp(data.session); else showAuth();
    });
  }

  init();
})();
