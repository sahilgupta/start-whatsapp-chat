// This is the service worker with the Cache-first network

const CACHE = "precache";


self.addEventListener("install", function (event) {
  console.log('Service worker install event!');
  self.skipWaiting();

  const siteBaseURL = new URL(location).searchParams.get('siteBaseURL');
  
  // List of files to precache
  var precacheFiles = [
    'index.html',
    siteBaseURL + '/static/purged.min.css',
    siteBaseURL + '/static/ua-parser.min.js',
    siteBaseURL + '/static/main.js',
    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.16/dist/tailwind.min.css',
    'https://unpkg.com/libphonenumber-js@1.7.25/bundle/libphonenumber-mobile.js'
  ];

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("Caching pages during install");
      return cache.addAll(precacheFiles);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activate event!');
});


// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  console.log('Fetch intercepted for:', event.request.url);
  
  event.respondWith(
    fromCache(event.request).then(
      function (response) {
        // The response was found in the cache so we responde with it and update the entry

        // This is where we call the server to get the newest version of the
        // file to use the next time we show view
        event.waitUntil(
          fetch(event.request).then(function (response) {
            return updateCache(event.request, response);
          })
        );

        return response;
      },
      function () {
        // The response was not found in the cache so we look for it on the server
        return fetch(event.request)
          .then(function (response) {
            // If request was success, add or update it in the cache
            event.waitUntil(updateCache(event.request, response.clone()));

            return response;
          })
          .catch(function (error) {
            console.log("Network request failed and no cache." + error);
          });
      }
    )
  );
});

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }

      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}
