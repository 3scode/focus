# Debug PWA Installation

## Langkah-langkah cek kenapa install button tidak muncul:

### 1. Cek Service Worker Status
1. Buka DevTools (F12)
2. Tab **Application** → **Service Workers**
3. Pastikan:
   - ✅ Status: **activated and is running**
   - ✅ Source: `/sw.js`
   - ✅ Tidak ada error merah

**Kalau belum ada service worker:**
- Hard refresh: `Ctrl + Shift + R`
- Atau centang "Update on reload"

---

### 2. Cek Manifest
1. DevTools → Tab **Application** → **Manifest**
2. Pastikan:
   - ✅ Manifest loaded tanpa error
   - ✅ Icons terlihat (preview muncul)
   - ✅ Start URL: `/`
   - ✅ Display: `standalone`

**Kalau ada warning:**
- Catat error yang muncul
- Biasanya masalah di icon atau manifest format

---

### 3. Cek Installability
1. DevTools → Tab **Application** → **Manifest**
2. Scroll ke bagian bawah → lihat **"Installability"** section
3. Baca pesan di sana - akan jelasin kenapa tidak bisa install

**Common issues:**
- ❌ Page not served over HTTPS → pakai localhost OK
- ❌ Service worker not registered → reload page
- ❌ Manifest missing required fields → cek manifest.json
- ❌ Already installed → uninstall dulu

---

### 4. Cek Console Errors
1. DevTools → Tab **Console**
2. Filter: cari `[SW]` atau error merah
3. Pastikan tidak ada error:
   - Manifest 404
   - Icon 404
   - Service worker registration failed

---

### 5. Force Install (Manual)
Kalau install button tetap tidak muncul tapi tidak ada error:

**Desktop Chrome:**
1. DevTools → **Application** → **Manifest**
2. Klik tombol **"Install"** di section manifest
3. Atau jalankan di console:
   ```js
   window.prompt('install')
   ```

**Mobile Chrome:**
1. Menu (⋮) → **Add to Home screen**
2. Confirm

---

### 6. Clear dan Reinstall
Kalau sudah pernah install:

1. **Uninstall app:**
   - Desktop: `chrome://apps` → klik kanan app → Remove
   - Mobile: Long press icon → Uninstall

2. **Clear site data:**
   - DevTools → Application → **Storage** → Clear site data
   - Atau Settings → Privacy → Clear browsing data → Site settings

3. **Hard refresh:**
   - `Ctrl + Shift + R` (Windows)
   - `Cmd + Shift + R` (Mac)

4. **Reload page:**
   - Tunggu 2-3 detik
   - Install button akan muncul

---

## Quick Check Script

Jalankan ini di **Console** untuk cek PWA status:

```js
// Cek service worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length)
  regs.forEach(reg => console.log('  Scope:', reg.scope, 'State:', reg.active?.state))
})

// Cek manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => console.log('Manifest:', m))
  .catch(e => console.error('Manifest error:', e))

// Cek installability
if ('getInstalledRelatedApps' in navigator) {
  navigator.getInstalledRelatedApps().then(apps => {
    console.log('Installed apps:', apps.length)
  })
}

// Cek beforeinstallprompt
let deferredPrompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ Install prompt available!')
  deferredPrompt = e
})

console.log('PWA Check complete. Lihat output di atas.')
```

---

## Troubleshooting

### "Service worker registration failed"
```bash
# Restart dev server
npm run dev
```

### "Manifest not found"
- Cek file ada di `/public/manifest.json`
- Cek tidak ada typo di `layout.tsx` metadata

### "Icons not loading"
- Cek file ada di `/public/icon-*.png`
- Generate ulang icons kalau perlu

### "Already installed"
```
1. Uninstall app (chrome://apps)
2. Clear site data (DevTools → Application → Storage)
3. Hard reload (Ctrl+Shift+R)
```

---

## Expected Output (Healthy PWA)

Service Worker:
```
✅ Status: activated and is running
✅ Scope: http://localhost:3000/
```

Manifest:
```
✅ Identity: "TimeBlock"
✅ Start URL: /
✅ Icons: 4 icons
✅ Display: standalone
```

Installability:
```
✅ Page is installable
```

Setelah semua ✅, install button akan muncul di address bar.
