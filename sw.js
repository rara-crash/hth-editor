// HTH service worker: ページ一式を端末にキャッシュして、オフラインでも開けるようにする
const VER = 'hth-v3-20261124';
const CORE = ['./', 'index.html', 'ics-manager.html', 'twin-3d.html', 'twin-real.html',
  'manifest.json', 'icon.svg', 'robot.glb.manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // ページ本体はネット優先 (更新を取りこぼさない)、失敗したらキャッシュ
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(e.request).then(r => {
      const cp = r.clone(); caches.open(VER).then(c => c.put(e.request, cp)); return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  // それ以外 (GLB 分割ファイル等) はキャッシュ優先
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
    const cp = r.clone(); caches.open(VER).then(c => c.put(e.request, cp)); return r;
  })));
});
