// Fill engine: writes normalized license data into form controls in a way that
// framework/legacy validation notices (native setter + full event sequence).
(function () {
  const TJID = (window.TJID = window.TJID || {});

  // Set an <input>/<textarea> value via the native prototype setter so React et
  // al. see it, then fire the events a page's validation typically listens for.
  function setText(el, value) {
    if (value == null) value = "";
    const proto =
      el.tagName === "TEXTAREA"
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    el.focus();
    setter.call(el, String(value));
    // InstaCheck (and similar) validate on keyup/change and enable Submit only
    // once these fire, so dispatch the whole realistic sequence.
    for (const type of ["input", "keydown", "keyup", "change"]) {
      el.dispatchEvent(new Event(type, { bubbles: true }));
    }
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  // Choose the matching <option> for a select. `candidates` are acceptable
  // text/value strings; comparison is trimmed + case-insensitive, with a
  // contains() fallback for near matches ("United States" vs "...of America").
  function setSelect(el, candidates) {
    const wanted = candidates.filter(Boolean).map((s) => String(s).toLowerCase().trim());
    if (!wanted.length) return false;
    const opts = Array.from(el.options);
    const norm = (s) => (s || "").toLowerCase().trim();

    let opt =
      opts.find((o) => wanted.includes(norm(o.value))) ||
      opts.find((o) => wanted.includes(norm(o.textContent)));
    if (!opt) {
      opt = opts.find((o) =>
        wanted.some((w) => norm(o.textContent).includes(w) || (o.value && norm(o.value).includes(w)))
      );
    }
    if (!opt) return false;

    el.focus();
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    setter.call(el, opt.value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  }

  // Build the candidate list for a field based on its declared kind.
  function candidatesFor(kind, value, data) {
    if (kind === "stateSelect") {
      const abbr = (value || "").toUpperCase();
      const name = TJID.states.abbrToName(abbr);
      return [abbr, name];
    }
    return [value];
  }

  // Apply a list of {sel, attr, kind} field specs against parsed license data.
  // Returns a report the popup/toast can show.
  function applyFields(fields, data) {
    const report = { filled: [], skipped: [], missing: [] };
    for (const f of fields) {
      const el = document.querySelector(f.sel);
      const value = data[f.attr];
      if (!el) {
        report.missing.push(f.sel);
        continue;
      }
      if (value == null || value === "") {
        report.skipped.push(f.sel);
        continue;
      }
      let ok;
      if (f.kind === "select" || f.kind === "stateSelect" || el.tagName === "SELECT") {
        ok = setSelect(el, candidatesFor(f.kind, value, data));
      } else {
        setText(el, value);
        ok = true;
      }
      (ok ? report.filled : report.skipped).push(f.sel);
    }
    return report;
  }

  TJID.fill = { setText, setSelect, applyFields };
})();
