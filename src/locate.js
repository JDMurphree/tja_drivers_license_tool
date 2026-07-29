// Selector generation + custom (taught) mappings for sites without a built-in
// preset. Custom mappings are stored per-hostname in chrome.storage.local.
(function () {
  const TJID = (window.TJID = window.TJID || {});

  // Attributes a user can assign to a field in teach mode.
  const ATTR_OPTIONS = [
    { attr: "firstName", label: "First name" },
    { attr: "middleName", label: "Middle name" },
    { attr: "middleNameOrNMN", label: 'Middle name (or "NMN")' },
    { attr: "lastName", label: "Last name" },
    { attr: "suffix", label: "Suffix" },
    { attr: "fullName", label: "Full name" },
    { attr: "sexWord", label: "Sex (Male/Female)" },
    { attr: "dobMonth", label: "DOB month (MM)" },
    { attr: "dobDay", label: "DOB day (DD)" },
    { attr: "dobYear", label: "DOB year (YYYY)" },
    { attr: "dobUS", label: "DOB (MM/DD/YYYY)" },
    { attr: "dobISO", label: "DOB (YYYY-MM-DD)" },
    { attr: "address1", label: "Street address" },
    { attr: "city", label: "City" },
    { attr: "stateCode", label: "State" },
    { attr: "zip5", label: "Zip (5)" },
    { attr: "zip9", label: "Zip (ZIP+4)" },
    { attr: "idNumber", label: "ID / license number" },
    { attr: "idStateCode", label: "ID issuing state" },
    { attr: "countryName", label: "Country" },
  ];

  const STATE_ATTRS = new Set(["stateCode", "idStateCode"]);
  const kindFor = (attr) => (STATE_ATTRS.has(attr) ? "stateSelect" : undefined);

  const cssEscape = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/[^a-zA-Z0-9_-]/g, "\\$&"));

  // Prefer a stable #id, then a unique [name], then a short structural path.
  function genSelector(el) {
    if (el.id && document.querySelectorAll(`#${cssEscape(el.id)}`).length === 1) {
      return `#${cssEscape(el.id)}`;
    }
    if (el.name) {
      const sel = `${el.tagName.toLowerCase()}[name="${el.name}"]`;
      if (document.querySelectorAll(sel).length === 1) return sel;
    }
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node.tagName !== "BODY" && parts.length < 5) {
      let part = node.tagName.toLowerCase();
      if (node.id) { parts.unshift(`#${cssEscape(node.id)}`); break; }
      const siblings = node.parentNode
        ? Array.from(node.parentNode.children).filter((c) => c.tagName === node.tagName)
        : [];
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      parts.unshift(part);
      node = node.parentNode;
    }
    return parts.join(" > ");
  }

  const key = () => `map:${location.hostname}`;

  function loadMapping() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([key()], (r) => resolve((r && r[key()]) || null));
      } catch {
        resolve(null);
      }
    });
  }

  function saveMapping(fields) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [key()]: fields }, () => resolve(true));
      } catch {
        resolve(false);
      }
    });
  }

  function clearMapping() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.remove([key()], () => resolve(true));
      } catch {
        resolve(false);
      }
    });
  }

  TJID.locate = {
    ATTR_OPTIONS,
    kindFor,
    genSelector,
    loadMapping,
    saveMapping,
    clearMapping,
  };
})();
