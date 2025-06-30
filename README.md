# Resource Pack Converter

Convert Minecraft Java Edition resource-packs to **any target game version** in seconds – directly in your browser, no installs, no servers, 100 % privacy-friendly.

## ✨ Why you'll love it

- **One-click conversions** – drag-and-drop a `.zip`, pick the game version, download the converted pack.
- **Zero setup** – runs fully client-side in React; *your files never leave your computer*.
- **Always up-to-date** – ships with an accurate Minecraft → pack-format mapping (1.6.1 → 1.21.6).
- **Error-proof** – warns about missing `pack.mcmeta`, invalid versions, and shows live progress messages.
- **Smart filenames** – output packs are named like `MyPack_MC1.20.4.zip` so you know exactly what you got.
- **Beautiful UX** – responsive design, drag-over highlight, animated buttons, dark-friendly colors.

## 🚀 Features at a glance

| Feature | Description |
|---------|-------------|
| Drag & Drop Upload | Drop or browse any Java Edition resource-pack `.zip`. |
| Instant Validation | Scans archive for `pack.mcmeta` before enabling conversion. |
| Game-Version Picker | Dropdown for every MC version 1.6.1 → 1.21.6 – auto-fills pack-format. |
| Manual Override | Enter a pack-format manually if you need something exotic. |
| Client-side Conversion | Uses [JSZip](https://stuk.github.io/jszip/) to edit `pack.mcmeta`, then re-zip. |
| Progress Feedback | Friendly messages: _Loading_, _Updating_, _Re-Packaging_, _Ready to Download_. |
| Automatic Download | Generates and triggers the browser download once done. |

## 🖥️ Quick start (development)

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm start
# Open http://localhost:3000
```

The app is built with **Create React App** – all familiar CRA scripts still work (`npm test`, `npm run build`, etc.).

### Production build

```bash
npm run build
```
The optimized bundle will be placed in `build/` ready to deploy on any static host (GitHub Pages, Netlify, Cloudflare Pages, …).

## 🛠️ How it works under the hood

1. The user selects or drops a `.zip` file.
2. The app loads it with **JSZip** and checks for `pack.mcmeta`.
3. When the user picks a target version, the correct `pack_format` (e.g. `63` for 1.21.6) is looked up from the in-code mapping.
4. `pack.mcmeta` is JSON-parsed, the `pack.pack_format` number is replaced, and the file is re-stringified.
5. A fresh zip archive is created: every original file is copied over **except** the old `pack.mcmeta`; the modified one is added instead.
6. The new archive is generated as a Blob and automatically downloaded.

Everything happens **locally** – perfect for sensitive packs or offline use.

## 📜 Version → pack-format map (excerpt)

| Minecraft | Pack format |
|-----------|------------|
| 1.21.6 | 63 |
| 1.21.4 – 1.21.5 | 46 |
| 1.21.2 – 1.21.3 | 42 |
| 1.21 / 1.21.1 | 34 |
| 1.20.5 – 1.20.6 | 32 |
| … | … |

*(The full list is in `src/App.js`.)*

## 🤝 Contributing

Pull requests and issues are welcome!  Feel free to open a PR to update mappings, improve styling, or add new features.

```bash
# lint & test (if you add tests)
npm run lint
npm test
```

## 📄 License

This project is released under the **MIT License** – see [LICENSE](LICENSE) for details.
