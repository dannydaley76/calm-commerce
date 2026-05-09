# Scout Chrome Extension — Icon Assets

## Files

| File | Size | Use |
|------|------|-----|
| `scout-icon-16.png` | 16×16 px | Favicon, toolbar compressed |
| `scout-icon-32.png` | 32×32 px | Windows taskbar |
| `scout-icon-48.png` | 48×48 px | Extensions management page |
| `scout-icon-128.png` | 128×128 px | Chrome Web Store, install dialog |

Source SVG: `../scout-icon.svg` (48×48 viewBox, re-render at any size if needed).

---

## manifest.json

Add the `icons` block and `action.default_icon` to your `manifest.json`:

```json
{
  "name": "Scout by Calm Commerce",
  "short_name": "Scout",
  "description": "AI-powered product research assistant. Discover profitable products with evidence-led scoring.",
  "version": "1.0.0",
  "manifest_version": 3,

  "icons": {
    "16":  "icons/scout-icon-16.png",
    "32":  "icons/scout-icon-32.png",
    "48":  "icons/scout-icon-48.png",
    "128": "icons/scout-icon-128.png"
  },

  "action": {
    "default_icon": {
      "16":  "icons/scout-icon-16.png",
      "32":  "icons/scout-icon-32.png",
      "48":  "icons/scout-icon-48.png",
      "128": "icons/scout-icon-128.png"
    },
    "default_title": "Scout by Calm Commerce",
    "default_popup": "popup.html"
  }
}
```

## File structure

Copy the PNGs into your extension's `icons/` folder:

```
your-extension/
├── manifest.json
├── popup.html
├── icons/
│   ├── scout-icon-16.png
│   ├── scout-icon-32.png
│   ├── scout-icon-48.png
│   └── scout-icon-128.png
└── ...
```

## Chrome Web Store

The 128px PNG is the primary asset used in the Chrome Web Store listing tile
and the extension install dialog. Upload it separately in the Store Developer
Dashboard under **Store listing → Icons**.
