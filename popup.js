// Popup: shows page/mapping status and drives the content script.
const $ = (id) => document.getElementById(id);

function send(type) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) return resolve(null);
      chrome.tabs.sendMessage(tab.id, { type }, (resp) => {
        void chrome.runtime.lastError; // ignore "no receiver" on unsupported pages
        resolve(resp || null);
      });
    });
  });
}

async function refresh() {
  const s = await send("getState");
  if (!s) {
    $("host").textContent = "(extension not active here)";
    $("map").innerHTML = '<span class="pill no">none</span>';
    $("last").textContent = "—";
    return;
  }
  $("host").textContent = s.host;
  $("map").innerHTML = s.presetName
    ? `<span class="pill ok">built-in</span> ${s.presetName}`
    : s.hasCustom
      ? '<span class="pill ok">taught</span> custom mapping'
      : '<span class="pill no">none</span> — use Teach';
  $("last").textContent = s.hasLast ? s.lastSummary : "— none yet —";
  $("fill").disabled = !s.hasLast;
}

$("fill").onclick = async () => {
  const r = await send("fillNow");
  if (r && !r.ok) alert(r.error || "Nothing to fill.");
  window.close();
};
$("teach").onclick = async () => { await send("teachStart"); window.close(); };
$("clear").onclick = async () => { await send("clearMapping"); refresh(); };

refresh();
