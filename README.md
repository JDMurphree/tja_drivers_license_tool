# Triple J ID Autofill

A Chrome extension that fills a logged-in form from a **driver's-license PDF417
scan** using your keyboard-wedge scanner. Built for **Colorado InstaCheck**
(CBI background check), but works on other forms via a "teach" mode.

## How it works

1. Your scanner reads the barcode on the back of the license and "types" the
   result (it acts like a keyboard — a *keyboard wedge*). The shop scanner is
   configured to emit the **AIMsi pipe-delimited format**, e.g.
   `AIMsi|1.0|002070974|7422 E EASTER WAY||USA|80112-0000|CO|CENTENNIAL|JAMES|DENNIS|MURPHREE|07/09/1985|...`
2. The extension silently catches that keystroke burst on the InstaCheck page —
   it recognizes the `AIMsi|` signature, swallows the burst so it never lands in
   a field, parses the pipe fields, and fills the form.
3. A small toast in the top-right confirms what was filled.

Raw AAMVA (`@ANSI...`) scanners are also supported as a fallback, but the shop
scanner uses the AIMsi format above.

## Install (load unpacked)

Full step-by-step for the counter workstations is in **DEPLOY.md**. Quick version:

1. Download the ZIP:
   https://github.com/JDMurphree/tja_drivers_license_tool/archive/refs/heads/main.zip
2. Extract it to a permanent folder, e.g. `C:\TJ-Tools\tja_drivers_license_tool`.
3. **chrome://extensions** → **Developer mode** (top-right) → **Load unpacked** →
   select that folder.
4. The olive **Triple J** icon appears in the toolbar. Pin it.

After any code change, click the **↻ reload** icon on the card in
chrome://extensions (and reload the InstaCheck tab).

## Using it on InstaCheck

The InstaCheck form has no scanner field, so the extension adds a small floating
**ID Autofill** widget (top-right) with a "Click here, then scan" box — a clear,
foolproof target for staff.

1. Log in to InstaCheck and open a Background Check application (the form with
   "Transferee's Full Name"). The widget appears automatically.
2. **Click the scan box** in the widget, then **scan the back of the license**.
3. Fields auto-fill. The widget shows the name, DOB, how many fields were set,
   and a suffix reminder when needed. The box clears, ready for the next customer.

The widget is **collapsible** (the `–` button) and **draggable** (by its header)
if it's ever in the way.

**Safety net:** if someone scans without clicking the box, the extension still
catches the burst and fills the form correctly — it will never dump raw scanner
text (`AIMsi|1.0|...`) into a field.

### What it fills

Name (First / Middle-or-"NMN" / Last), Sex, Date of Birth (all three boxes),
Street / City / State / Zip, ID Number, and ID Issuing State.

### What it leaves for you

- **Suffix (Jr/III/etc.)** — the AIMsi scanner format does **not** include it, so
  the tool can't fill it. When a license has a suffix, the toast reminds you to
  type it in by hand.
- **Not on a license:** SSN, Race, AKA, IDT/UPIN, Country of Citizenship, Type of
  Gun / Type of Sale, and the Dealer Contact name (auto-filled at login).

> The **Submit** button stays disabled until *all* required fields are valid —
> including the ones above that you fill by hand. That's InstaCheck's rule, not
> the extension's.

## Scanner setup

The extension expects the scanner in **keyboard-wedge mode** emitting the
**AIMsi pipe-delimited format** (verified against the shop's scanner). Detection
keys off the constant `AIMsi|` prefix, so no extra configuration is required.

If you ever swap scanners or change the output template and scans stop working,
capture one scan into `test/raw-capture.html` (or Notepad) and send the exact
text — adapting the parser to a new format is a small change in `src/aimsi.js`.

## Testing without the live system

Open `test/mock-instacheck.html` in Chrome. It mimics the real InstaCheck field
IDs and loads the same code directly (no extension needed):

- **Simulate a wedge scan** — dispatches keystrokes exactly like your scanner.
- **Parse & fill from textarea** — paste raw scanner output; results log to the
  console (F12).

## Other forms (teach mode)

For a page without a built-in preset, open the extension popup and click
**Teach fields on this page**: click each form field, pick what it holds, then
**Save**. The mapping is stored per-website and used automatically on the next
scan.

## Files

| File | Purpose |
|------|---------|
| `manifest.json`     | Extension manifest (MV3) |
| `src/aimsi.js`      | **AIMsi pipe-format parser (the shop scanner's output) → normalized fields** |
| `src/aamva.js`      | Raw AAMVA PDF417 parser (fallback for other scanners) |
| `src/states.js`     | State abbreviation ↔ full name |
| `src/presets.js`    | Built-in InstaCheck field map |
| `src/locate.js`     | Selector generation + taught mappings |
| `src/fill.js`       | Fill engine (native setter + event sequence + dropdown matching) |
| `src/capture.js`    | Keystroke capture, toast, teach UI, messaging |
| `popup.html/js`     | Toolbar popup |
| `test/`             | Local mock InstaCheck form |

## Privacy

Everything runs locally in your browser. No license data leaves the machine;
nothing is sent anywhere. Taught mappings are stored in Chrome local storage.
