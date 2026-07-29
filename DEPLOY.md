# Deploying to the 3 background-check workstations

This is an **unpacked Chrome extension** hosted in a public GitHub repo:
**https://github.com/JDMurphree/tja_drivers_license_tool**

Everything runs locally in the browser — no license data leaves the machine.

## One-time install on each workstation

Do this once per PC (all three background-check stations).

1. **Download it.** Open this link and it downloads a ZIP:
   **https://github.com/JDMurphree/tja_drivers_license_tool/archive/refs/heads/main.zip**
   (Or go to the repo → green **Code** button → **Download ZIP**.)

2. **Extract it to a permanent location.** The ZIP unzips to a folder named
   `tja_drivers_license_tool-main`. Move it somewhere permanent and rename it —
   recommended:

   ```
   C:\TJ-Tools\tja_drivers_license_tool
   ```

   Do NOT run it from Downloads or a USB stick (if the folder moves or is
   deleted, the extension breaks).

3. In Chrome, go to **chrome://extensions**.
4. Turn on **Developer mode** (toggle, top-right).
5. Click **Load unpacked** and select `C:\TJ-Tools\tja_drivers_license_tool`.
6. The olive **Triple J** icon appears in the toolbar. Pin it.
7. Verify: open the InstaCheck Background Check page — the branded **Triple J
   Armory — ID Autofill** widget should appear top-right.

> **Chrome may show "Disable developer-mode extensions" on startup.** Click
> **Keep / X** to dismiss it — normal for in-house unpacked extensions.

## Daily use (for counter staff)

1. Log in to InstaCheck, open a Background Check application.
2. **Click the scan box** in the Triple J widget (top-right), then **scan the
   back of the license**.
3. Name, DOB, address, sex, state, and ID fields fill automatically.
4. Fill SSN, Race, gun/sale type, citizenship, and the **Suffix** (Jr/III — the
   scanner doesn't send it; the widget reminds you) by hand, then Submit.

## Pushing an update to all 3 machines

When the tool is updated on GitHub, on **each** workstation:

1. Re-download the ZIP (link above) and replace the contents of
   `C:\TJ-Tools\tja_drivers_license_tool` with the new files (same folder path).
2. Go to **chrome://extensions** and click the **↻ reload** icon on the card.

(If a machine has Git installed, `git pull` in the folder is faster than
re-downloading. Keep all three on the same version by updating them together.)

## Troubleshooting

| Symptom | Fix |
|---|---|
| Widget doesn't appear | You're not on the InstaCheck page, or the tab was open before install — reload the tab (Ctrl+R). |
| Scan does nothing | Click the widget's scan box first so the cursor is in it. Confirm the scanner is in keyboard-wedge mode. |
| Raw text (`AIMsi\|...`) dumped in a field | The scan wasn't recognized — capture it via `test/raw-capture.html` and send it to JD to adjust the parser. |
| Dropdowns (Sex/State) not set | Option text differs from expected — check via `test/mock-instacheck.html`; the matcher can be extended. |
| Extension greyed out / "invalid" | The folder was moved or deleted. Restore it to `C:\TJ-Tools\tja_drivers_license_tool` and reload. |

## Repo layout

`manifest.json` is at the repo root, so **Load unpacked** points at the repo
folder itself. `src/` holds the code, `test/` holds the local test pages (safe
to keep; not needed at the counter). See `README.md` for how it all works.
