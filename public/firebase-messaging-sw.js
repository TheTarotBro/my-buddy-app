importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyABzrfG8Sjx3pcvktXUicJEudm653Xnn3g",
  authDomain: "eurovision-2026-app.firebaseapp.com",
  databaseURL: "https://eurovision-2026-app-default-rtdb.firebaseio.com",
  projectId: "eurovision-2026-app",
  storageBucket: "eurovision-2026-app.firebasestorage.app",
  messagingSenderId: "562088911861",
  appId: "1:562088911861:web:94a90514118df2931bf6bc"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "My Circle";
  const body = (payload.notification && payload.notification.body) || "";
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png"
  });
});
