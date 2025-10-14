/* eslint-disable no-restricted-globals */

// キャッシュ名とバージョン
const CACHE_NAME = 'secure-todo-v1';

// キャッシュするファイル
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/index.html',
  '/manifest.json'
];

// インストール時
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// フェッチ時（オフライン対応）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュがあれば返す
        if (response) {
          return response;
        }
        // なければネットワークから取得
        return fetch(event.request);
      }
    )
  );
});

// 有効化時（古いキャッシュの削除）
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});