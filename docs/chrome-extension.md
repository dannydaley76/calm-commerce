# Scout Chrome Extension

The Scout Chrome extension has one canonical source:

`/Users/admin/winning-product-scanner`

Do not edit an `extension/` folder inside the Calm Commerce OS repo. That embedded copy was removed because it became stale and caused testing confusion.

## Local Testing

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load unpacked from `/Users/admin/winning-product-scanner`.
4. After code changes, click reload on the Scout extension card.
5. Test on a real product page, then use `Save to Workspace`.

The workspace target is:

`https://www.calmcommerce.net/ideas`

The import route is:

`https://www.calmcommerce.net/ideas/import?payload=...`

## Reset Extension Test State

Inspect the Scout extension popup and run:

```js
chrome.storage.local.clear(() => location.reload());
```

For a narrower reset:

```js
chrome.storage.local.remove(
  ["calm_commerce_api_key", "calm_commerce_os_url", "free_scan_count"],
  () => location.reload()
);
```
