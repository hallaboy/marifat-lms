self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { return; }
  const notification = payload.notification || {};
  const data = payload.data || {};
  event.waitUntil(self.registration.showNotification(notification.title || "Ma’rifat LMS", {
    body: notification.body || "Yangi bildirishnoma",
    data: { action_url: typeof data.action_url === "string" && data.action_url.startsWith("/") ? data.action_url : "/notifications" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.action_url || "/notifications";
  event.waitUntil(clients.openWindow(path));
});
