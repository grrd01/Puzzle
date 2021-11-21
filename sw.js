/*
 * grrd's Puzzle
 * Copyright (c) 2012 Gerard Tyedmers, grrd@gmx.net
 * Licensed under the MPL License
 */

/*jslint devel: true, browser: true */ /*global  self  */

var CACHE_NAME = "grrds-puzzle-cache";
var CACHE_VERSION = "v2.10";
var CACHE = CACHE_NAME + "-" + CACHE_VERSION;

var urlsToCache = [
    "index.html",
    "Images/4inarow.svg",
    "Images/bullets0.svg",
    "Images/bullets0o.svg",
    "Images/bullets1.svg",
    "Images/bullets1o.svg",
    "Images/dice.svg",
    "Images/down.svg",
    "Images/dummy.png",
    "Images/easy.svg",
    "Images/easy_gold.svg",
    "Images/escfullscreen.svg",
    "Images/favicon.ico",
    "Images/favicon_dark.ico",
    "Images/fullscreen.svg",
    "Images/hard.svg",
    "Images/hard_gold.svg",
    "Images/info.svg",
    "Images/loading.svg",
    "Images/lock.svg",
    "Images/mail.svg",
    "Images/medal1.svg",
    "Images/medal2.svg",
    "Images/medal3.svg",
    "Images/medium.svg",
    "Images/medium_gold.svg",
    "Images/memo.svg",
    "Images/next.svg",
    "Images/ok.svg",
    "Images/photo.svg",
    "Images/piece_gold.svg",
    "Images/prev.svg",
    "Images/puzzle.svg",
    "Images/settings.svg",
    "Images/tictactoe.svg",
    "Images/title1.png",
    "Images/title_wide.png",
    "Images/x.svg",
    "Images/africa/theme.png",
    "Images/america/theme.png",
    "Images/animals/theme.png",
    "Images/asia/theme.png",
    "Images/europe/theme.png",
    "Images/flowers/theme.png",
    "Images/mascha/theme.png",
    "Images/mascha2/theme.png",
    "Images/mascha3/theme.png",
    "Images/mascha4/theme.png",
    "Images/shrek/theme.png",
    "Images/tricky/theme.png",
    "Scripts/exif.js",
    "Scripts/kinetic-v4.7.4.min.js",
    "Scripts/l10n.js",
    "Scripts/puzzle.css",
    "Scripts/puzzle.js",
    "Scripts/swipe.css",
    "Scripts/swipe.js",
    "Locales/ar/puzzle.properties",
    "Locales/bn/puzzle.properties",
    "Locales/cs/puzzle.properties",
    "Locales/de/puzzle.properties",
    "Locales/en/puzzle.properties",
    "Locales/es/puzzle.properties",
    "Locales/fr/puzzle.properties",
    "Locales/hr/puzzle.properties",
    "Locales/hu/puzzle.properties",
    "Locales/it/puzzle.properties",
    "Locales/nl/puzzle.properties",
    "Locales/pl/puzzle.properties",
    "Locales/pt_BR/puzzle.properties",
    "Locales/pt_PT/puzzle.properties",
    "Locales/rm/puzzle.properties",
    "Locales/ru/puzzle.properties",
    "Locales/sl/puzzle.properties",
    "Locales/sr/puzzle.properties",
    "Locales/ta/puzzle.properties",
    "Locales/tr/puzzle.properties",
    "Locales/ur/puzzle.properties",
    "Locales/zh/puzzle.properties",
    "Locales/zh_CN/puzzle.properties",
    "Locales/locales.ini",
    "Sounds/click.mp3",
    "Sounds/click.ogg",
    "Sounds/ding.mp3",
    "Sounds/ding.ogg"
];

self.addEventListener("install", function (event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE)
            .then(function (cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener("fetch", function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                var fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function (response) {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== "basic") {
                            return response;
                        }

                        var responseToCache = response.clone();

                        caches.open(CACHE)
                            .then(function (cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(cacheNames.map(function (cacheName) {
                if (cacheName.indexOf(CACHE_NAME) === 0 && cacheName.indexOf(CACHE_VERSION) === -1) {
                    console.log(cacheName + " deleted");
                    return caches.delete(cacheName);
                }
            }));
        })
    );
});
