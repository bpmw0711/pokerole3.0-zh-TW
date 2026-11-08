// 網站離線快取：看過的頁面離線也能開；有網路時一律先抓最新版，所以網頁更新會自動同步。
// 圖片（圖鑑插圖、圖示）走快取優先。改快取策略時把 VER 加一。
var VER = 'v1', PAGES = 'pk-pages-' + VER, IMGS = 'pk-img-' + VER;
var SHELL = ['index.html', 'assets/style.css', 'assets/app.js', 'assets/favicon.svg', 'assets/icon-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(PAGES).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== PAGES && k !== IMGS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (/\.(png|webp|jpg|jpeg|svg|ico)$/i.test(u.pathname)) {
    e.respondWith(caches.open(IMGS).then(function (c) {
      return c.match(r).then(function (hit) {
        return hit || fetch(r).then(function (res) { if (res.ok) c.put(r, res.clone()); return res; });
      });
    }));
    return;
  }
  e.respondWith(caches.open(PAGES).then(function (c) {
    return fetch(r).then(function (res) {
      if (res.ok) c.put(r, res.clone());
      return res;
    }).catch(function () {
      return c.match(r, { ignoreSearch: true }).then(function (hit) { return hit || c.match('index.html'); });
    });
  }));
});
