// Content script entry point. On the InstaCheck page it shows a floating
// widget with a "scan here" box (the foolproof path for counter staff), parses
// the scan, and fills the form. It ALSO listens globally as a safety net, so a
// scan done without clicking the box still fills instead of dumping raw text
// into a field.
//
// The shop scanner emits the "AIMsi" pipe format (see aimsi.js). Raw AAMVA
// ("@ANSI...") is supported as a fallback for other scanners.
(function () {
  const TJID = (window.TJID = window.TJID || {});
  if (TJID._booted) return;
  TJID._booted = true;

  let lastParsed = null;
  let customMapping = null;
  let scanBox = null, statusEl = null; // widget refs

  const owns = () => window.top === window || TJID.presets.detect();
  // Capture only runs where there's something to fill — the InstaCheck form
  // (built-in preset) or a page the user taught. Never on general browsing.
  const captureActive = () => !!TJID.presets.detect() || !!customMapping;

  TJID.locate.loadMapping().then((m) => {
    customMapping = m;
    if (window.top === window && captureActive()) createWidget();
  });

  // ---- Toast (transient confirmation) -------------------------------------
  function toast(title, lines, tone) {
    document.querySelectorAll(".tjid-toast").forEach((n) => n.remove());
    const box = document.createElement("div");
    box.className = "tjid-toast";
    const color = tone === "error" ? "#b23b3b" : tone === "warn" ? "#9a7b1f" : "#3a5a2a";
    box.style.cssText = [
      "position:fixed", "top:64px", "right:16px", "z-index:2147483647",
      "background:#f5f1e6", "color:#2b2b2b", `border-left:6px solid ${color}`,
      "border-radius:8px", "box-shadow:0 6px 24px rgba(0,0,0,.28)",
      "font:13px/1.45 -apple-system,Segoe UI,Roboto,sans-serif",
      "padding:12px 14px", "max-width:340px",
    ].join(";");
    box.innerHTML =
      `<div style="font-weight:700;margin-bottom:4px">${title}</div>` +
      `<div style="opacity:.85">${(lines || []).map((l) => `<div>${l}</div>`).join("")}</div>`;
    document.documentElement.appendChild(box);
    setTimeout(() => box.remove(), tone === "error" ? 9000 : 5000);
  }

  const setStatus = (html) => { if (statusEl) statusEl.innerHTML = html; };

  // ---- Fill ----------------------------------------------------------------
  function fillFromData(data) {
    const preset = TJID.presets.detect();
    const fields = preset ? preset.fields : customMapping;
    if (!fields || !fields.length) {
      setStatus('<span style="color:#9a5b00">No field map for this page. Use the extension → Teach fields.</span>');
      toast("License scanned", [`${data.fullName || "(no name)"} — ${data.dobUS || "?"}`, "No field map for this page yet."], "warn");
      return;
    }
    const r = TJID.fill.applyFields(fields, data);
    const name = data.fullName || "(no name)";

    let s = `✓ <b>${name}</b><br>${data.dobUS || "?"} · ${r.filled.length} fields filled`;
    if (data._suffixUnavailable) s += `<div style="color:#9a5b00;margin-top:6px">⚠ Add suffix by hand (Jr/III/etc.) if the ID has one.</div>`;
    if (r.missing.length) s += `<div style="opacity:.7;margin-top:4px">${r.missing.length} field(s) not found on page.</div>`;
    setStatus(s);

    // The widget shows this status; only fall back to a toast if it's absent.
    if (!statusEl) {
      const tl = [`<b>${name}</b> — ${data.dobUS || "?"} · ${r.filled.length} filled`];
      if (data._suffixUnavailable) tl.push("⚠ Suffix not sent by scanner — add by hand if on the ID.");
      toast(preset ? preset.name : "Custom mapping", tl, r.filled.length ? "ok" : "warn");
    }
  }

  // Parse a raw scan string (auto-detecting format) and fill. Returns success.
  function processRaw(raw) {
    const fmt = TJID.aimsi.looksLikeScan(raw) ? "aimsi" : TJID.aamva.looksLikeScan(raw) ? "aamva" : null;
    if (!fmt) return false;
    const data = (fmt === "aimsi" ? TJID.aimsi : TJID.aamva).parse(raw).data;
    lastParsed = data;
    fillFromData(data);
    return true;
  }

  // ---- Floating widget -----------------------------------------------------
  function createWidget() {
    if (document.getElementById("tjid-widget")) return;
    const w = document.createElement("div");
    w.id = "tjid-widget";
    w.style.cssText =
      "position:fixed;top:12px;right:12px;z-index:2147483646;width:360px;background:#f5f1e6;" +
      "border:1px solid #c9c0a4;border-radius:13px;box-shadow:0 12px 38px rgba(0,0,0,.32);overflow:hidden;" +
      "font:13px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;color:#2b2b2b";
    const bg = TJID.assets && TJID.assets.licenseBg ? TJID.assets.licenseBg : "";
    const logo = TJID.assets && TJID.assets.logoWhite ? TJID.assets.logoWhite : "";
    // Fit the FULL card width (so all of "COLORADO" shows) and top-align it.
    const bodyBg = bg
      ? `background:linear-gradient(rgba(245,241,230,.26),rgba(245,241,230,.52)),url(${bg}) top center/100% auto no-repeat,#f5f1e6`
      : "background:#f5f1e6";
    w.innerHTML =
      '<div id="tjid-hd" style="background:#3a5a2a;color:#f5f1e6;padding:6px 12px;display:flex;align-items:center;gap:7px;cursor:move;user-select:none">' +
        (logo ? `<img src="${logo}" alt="Triple J Armory" style="height:16px;width:auto;display:block">` : '') +
        '<span style="font-weight:600;font-size:12.5px;opacity:.92">&mdash;&nbsp;ID&nbsp;Autofill</span>' +
        '<span style="flex:1"></span>' +
        '<span id="tjid-min" style="cursor:pointer;padding:0 6px;font-size:16px" title="Collapse">–</span>' +
      '</div>' +
      `<div id="tjid-bd" style="position:relative;box-sizing:border-box;min-height:196px;padding:16px 14px;` +
          `display:flex;flex-direction:column;justify-content:flex-end;${bodyBg}">` +
        '<input id="tjid-scanbox" placeholder="Click here, then scan →" autocomplete="off" ' +
          'style="width:100%;box-sizing:border-box;padding:10px;border:2px solid #3a5a2a;border-radius:8px;' +
          'background:rgba(255,255,255,.96);font:13px monospace" />' +
        '<div id="tjid-status" style="margin-top:8px;padding:8px 10px;border-radius:8px;font-size:12.5px;' +
          'background:rgba(245,241,230,.88);box-shadow:0 1px 3px rgba(0,0,0,.16)">Ready — click the box, then scan a license.</div>' +
      '</div>';
    document.documentElement.appendChild(w);
    scanBox = w.querySelector("#tjid-scanbox");
    statusEl = w.querySelector("#tjid-status");

    // Scan-into-box: the whole burst types in; debounce, parse, fill, clear.
    let t = null;
    scanBox.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const v = scanBox.value;
        if (TJID.aimsi.looksLikeScan(v) || TJID.aamva.looksLikeScan(v)) {
          if (processRaw(v)) scanBox.value = "";
        }
      }, 180);
    });
    scanBox.addEventListener("focus", () => { if (!lastParsed) setStatus("Ready — scan now."); });

    const bd = w.querySelector("#tjid-bd");
    const min = w.querySelector("#tjid-min");
    min.addEventListener("click", (e) => {
      e.stopPropagation();
      const hidden = bd.style.display === "none";
      bd.style.display = hidden ? "block" : "none";
      min.textContent = hidden ? "–" : "+";
    });

    // Drag by the header.
    const hd = w.querySelector("#tjid-hd");
    let dx = 0, dy = 0, drag = false;
    hd.addEventListener("mousedown", (e) => {
      if (e.target.id === "tjid-min") return;
      drag = true; dx = e.clientX - w.offsetLeft; dy = e.clientY - w.offsetTop; e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!drag) return;
      w.style.left = e.clientX - dx + "px"; w.style.top = e.clientY - dy + "px"; w.style.right = "auto";
    });
    document.addEventListener("mouseup", () => (drag = false));
  }

  // ---- Global capture (safety net) ----------------------------------------
  // Recognize a scan by its constant leading signature typed at scanner speed,
  // swallow the burst, parse, fill. Steps aside when the widget box is focused
  // (that path handles it) — this only fires when a form field or nothing has
  // focus, so a scan is never dumped raw into the form.
  const SIGS = [
    { sig: "AIMsi", fmt: "aimsi" },
    { sig: "@", fmt: "aamva" },
  ];
  const MAX_SIG = SIGS.reduce((m, s) => Math.max(m, s.sig.length), 0);
  const BURST_GAP = 120;

  let capturing = false, buffer = "", burst = "", lastT = 0, finalizeTimer = null;

  const armFinalize = () => {
    clearTimeout(finalizeTimer);
    finalizeTimer = setTimeout(finalize, 160);
  };
  function finalize() {
    const raw = buffer;
    capturing = false; buffer = ""; burst = "";
    processRaw(raw);
  }

  // Remove signature chars that leaked into the focused field before we
  // recognized the scan (all but the last char, which we prevented).
  function stripLeaked(count, sig) {
    if (count <= 0) return;
    const el = document.activeElement;
    if (!el) return;
    if (el.matches && el.matches("input,textarea")) {
      if (el.value.slice(-count) === sig.slice(0, count)) {
        el.value = el.value.slice(0, el.value.length - count);
      }
    } else if (el.isContentEditable) {
      for (let i = 0; i < count; i++) document.execCommand("delete", false);
    }
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (TJID._teaching || !captureActive()) return;
      if (document.activeElement && document.activeElement.id === "tjid-scanbox") return; // box path handles it
      if (typeof e.key !== "string") return; // jQuery/synthetic events can omit e.key

      if (capturing) {
        e.preventDefault(); e.stopPropagation();
        if (e.key === "Enter") { finalize(); return; }
        if (e.key.length === 1) buffer += e.key;
        armFinalize();
        return;
      }
      if (e.key.length !== 1) return;
      const now = performance.now();
      const gap = now - lastT; lastT = now;
      if (gap > BURST_GAP) burst = "";
      burst += e.key;
      for (const { sig } of SIGS) {
        if (burst === sig) {
          capturing = true; buffer = burst;
          e.preventDefault(); e.stopPropagation();
          stripLeaked(sig.length - 1, sig);
          armFinalize();
          return;
        }
      }
      if (burst.length > MAX_SIG) burst = burst.slice(-MAX_SIG);
    },
    true
  );

  // ---- Teach mode ----------------------------------------------------------
  function startTeach() {
    if (TJID._teaching) return;
    TJID._teaching = true;
    const draft = [];

    const bar = document.createElement("div");
    bar.className = "tjid-teach-ui";
    bar.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#2b2b2b;color:#f5f1e6;" +
      "font:13px -apple-system,Segoe UI,Roboto,sans-serif;padding:8px 12px;display:flex;gap:12px;align-items:center";
    bar.innerHTML =
      '<b>Teach mode:</b> <span>click a field, then pick what it holds.</span>' +
      '<span id="tjid-count" style="opacity:.7">0 mapped</span>' +
      '<button id="tjid-done" style="margin-left:auto;padding:4px 12px">Save</button>' +
      '<button id="tjid-cancel" style="padding:4px 12px">Cancel</button>';
    document.documentElement.appendChild(bar);

    let menu = null;
    const removeMenu = () => { menu?.remove(); menu = null; };

    function onClick(ev) {
      const el = ev.target;
      if (bar.contains(el) || (menu && menu.contains(el))) return;
      if (!el.matches || !el.matches("input,select,textarea")) return;
      ev.preventDefault(); ev.stopPropagation();
      removeMenu();
      showMenu(el, ev.clientX, ev.clientY);
    }

    function showMenu(el, x, y) {
      const sel = TJID.locate.genSelector(el);
      menu = document.createElement("div");
      menu.className = "tjid-teach-ui";
      menu.style.cssText =
        `position:fixed;left:${Math.min(x, innerWidth - 240)}px;top:${Math.min(y, innerHeight - 320)}px;` +
        "z-index:2147483647;background:#f5f1e6;color:#2b2b2b;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.35);" +
        "max-height:300px;overflow:auto;width:230px;font:13px -apple-system,Segoe UI,Roboto,sans-serif;padding:6px";
      TJID.locate.ATTR_OPTIONS.forEach((o) => {
        const b = document.createElement("button");
        b.textContent = o.label;
        b.style.cssText =
          "display:block;width:100%;text-align:left;border:0;background:transparent;padding:6px 8px;cursor:pointer;border-radius:5px";
        b.onmouseenter = () => (b.style.background = "#e3dcc7");
        b.onmouseleave = () => (b.style.background = "transparent");
        b.onclick = () => {
          const existing = draft.findIndex((d) => d.sel === sel);
          const spec = { sel, attr: o.attr, kind: TJID.locate.kindFor(o.attr) };
          if (existing >= 0) draft[existing] = spec; else draft.push(spec);
          el.style.outline = "2px solid #3a5a2a";
          bar.querySelector("#tjid-count").textContent = `${draft.length} mapped`;
          removeMenu();
        };
        menu.appendChild(b);
      });
      document.documentElement.appendChild(menu);
    }

    function stop(save) {
      document.removeEventListener("click", onClick, true);
      removeMenu();
      bar.remove();
      TJID._teaching = false;
      document.querySelectorAll("input,select,textarea").forEach((n) => (n.style.outline = ""));
      if (save) {
        customMapping = draft;
        TJID.locate.saveMapping(draft);
        if (!document.getElementById("tjid-widget")) createWidget();
        toast("Mapping saved", [`${draft.length} field(s) mapped for this page.`], "ok");
      }
    }

    document.addEventListener("click", onClick, true);
    bar.querySelector("#tjid-done").onclick = () => stop(true);
    bar.querySelector("#tjid-cancel").onclick = () => stop(false);
  }

  // ---- Init + popup messaging ---------------------------------------------
  if (window.top === window && captureActive()) createWidget();

  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.onMessage) return;
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!owns()) return;
    switch (msg.type) {
      case "getState": {
        const preset = TJID.presets.detect();
        sendResponse({
          host: location.hostname,
          presetName: preset ? preset.name : null,
          hasCustom: !!(customMapping && customMapping.length),
          hasLast: !!lastParsed,
          lastSummary: lastParsed ? `${lastParsed.fullName} — ${lastParsed.dobUS}` : null,
        });
        break;
      }
      case "fillNow":
        if (lastParsed) { fillFromData(lastParsed); sendResponse({ ok: true }); }
        else sendResponse({ ok: false, error: "No scan captured yet." });
        break;
      case "teachStart":
        startTeach();
        sendResponse({ ok: true });
        break;
      case "clearMapping":
        TJID.locate.clearMapping().then(() => { customMapping = null; sendResponse({ ok: true }); });
        return true;
    }
  });
})();
