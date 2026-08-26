/* Offline cache. Bump CACHE when the app changes so phones pick it up. */
var CACHE = "whichcard-v1";
var SHELL = ["./", "./index.html", "./manifest.webmanifest",
             "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  if(e.request.method!=="GET") return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit){
        /* refresh in the background so the next launch is current */
        fetch(e.request).then(function(res){
          if(res && (res.ok || res.type==="opaque")) caches.open(CACHE).then(function(c){ c.put(e.request, res); });
        }).catch(function(){});
        return hit;
      }
      return fetch(e.request).then(function(res){
        /* keep the Google Fonts files so the app looks right with no signal */
        if(res && (res.ok || res.type==="opaque")) {
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){ return caches.match("./index.html"); });
    })
  );
});
