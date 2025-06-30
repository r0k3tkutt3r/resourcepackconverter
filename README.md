# Resource Pack Converter

Convert Minecraft Java Edition resource packs to **any target game version** in seconds – directly in your browser, no installs, no servers, **100% privacy-friendly**.

## ✨ Why you'll love it

- **One-click conversions** – drag-and-drop a `.zip`, pick the game version, download the converted pack.
- **Bulk conversion mode** – convert to multiple versions at once and get them all in one zip file.
- **Smart file naming** – automatically replaces version numbers in filenames (e.g., `MyPack_1.19.zip` → `MyPack_1.21.zip`).
- **Zero setup** – runs fully client-side in React; *your files never leave your computer*.
- **Always up-to-date** – dynamically fetches the latest Minecraft → pack-format mapping from the official wiki.
- **Snapshot support** – includes development snapshots alongside stable releases.
- **Error-proof** – warns about missing `pack.mcmeta`, invalid versions, and shows live progress messages.
- **Beautiful UX** – responsive design, drag-over highlight, animated glowing buttons, dark-friendly colors.
- **Complete privacy** – no data transmission, no tracking, no analytics – everything stays on your device.

## 🚀 Features at a glance

| Feature | Description |
|---------|-------------|
| **Drag & Drop Upload** | Drop or browse any Java Edition resource pack `.zip` file. |
| **Instant Validation** | Scans archive for `pack.mcmeta` and displays pack format info before enabling conversion. |
| **Game Version Picker** | Dropdown with every MC version from 1.6.1 to latest – auto-fills pack format. |
| **Snapshot Toggle** | Include development snapshots alongside stable releases. |
| **Manual Override** | Enter a pack format manually if you need something specific. |
| **Bulk Mode** | Convert to a range of versions simultaneously and download as one archive. |
| **Smart File Naming** | Intelligently replaces detected version numbers in output filenames. |
| **Client-side Processing** | Uses [JSZip](https://stuk.github.io/jszip/) to edit `pack.mcmeta` locally. |
| **Progress Feedback** | Real-time status: _Loading_, _Converting_, _Packaging_, _Download Ready_. |
| **Automatic Download** | Generates and triggers browser download once complete. |

## 🔒 Privacy & Security

Your resource packs **never leave your computer**. This tool:
- ✅ Runs entirely in your browser (client-side JavaScript)
- ✅ No file uploads to any server
- ✅ No data collection or tracking
- ✅ Works completely offline (after initial page load)
- ✅ Open source – you can verify the code yourself

Perfect for private/sensitive resource packs or when working offline.

## 🎯 Smart Features

### Bulk Conversion Mode
Convert your resource pack to multiple Minecraft versions at once:
1. Enable "Bulk Mode" toggle
2. Select start and end versions (e.g., 1.19 to 1.21)
3. Get all converted packs in one convenient zip file

### Smart File Naming
Automatically detects and replaces Minecraft version numbers in filenames:
- `MyPack_1.19.zip` → `MyPack_1.21.zip` (single conversion)
- Uses the oldest version when converting ranges
- Falls back to standard naming if no version detected
- Prevents conflicts with multiple version detection

## 🖥️ Quick start (development)

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm start
# Open http://localhost:3000
```

The app is built with **Create React App** – all familiar CRA scripts work (`npm test`, `npm run build`, etc.).

### Production build

```bash
npm run build
```
The optimized bundle will be placed in `build/` ready to deploy on any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.).

## 🛠️ How it works under the hood

### Single Conversion
1. User selects or drops a `.zip` file
2. App loads it with **JSZip** and validates `pack.mcmeta`
3. Displays original pack format and compatible game version
4. When user picks target version, looks up correct `pack_format` from wiki data
5. Modifies `pack.mcmeta` JSON and creates new zip with updated metadata
6. Downloads converted pack with smart filename

### Bulk Conversion
1. User enables Bulk Mode and selects version range
2. App processes original pack once and creates multiple variants
3. Each variant gets proper pack format for its target version
4. All variants are packaged into one master zip file
5. Downloads complete bulk archive

### Smart Naming
- Detects Minecraft version patterns (1.6+) in original filename
- Replaces detected version with target version
- Handles version ranges by using the oldest/base version
- Maintains original filename structure

Everything happens **locally** with no server communication after the initial wiki data fetch.

## 📊 Version Support

The app dynamically fetches the latest pack format data from the Minecraft Wiki, supporting:
- **Stable releases**: 1.6.1 through latest
- **Development snapshots**: When "Include snapshots" is enabled
- **Automatic updates**: Always has the newest version mappings

## 🤝 Contributing

Pull requests and issues are welcome! Feel free to contribute:
- New features or improvements
- Bug fixes
- UI/UX enhancements
- Documentation updates

```bash
# Development workflow
npm install
npm start
npm test          # if you add tests
npm run build     # verify production build
```

## 📄 License

This project is released under the **MIT License** – see [LICENSE](LICENSE) for details.
