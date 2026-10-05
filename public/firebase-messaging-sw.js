self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { return; }
  const notification = payload.notification || {};
  const data = payload.data || {};
  event.waitUntil(self.registration.showNotification(notification.title || "SiteLearning LMS", {
    body: notification.body || "Yangi bildirishnoma",
    data: { action_url: typeof data.action_url === "string" && data.action_url.startsWith("/") ? data.action_url : "/notifications" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedPath = event.notification.data?.action_url || "/notifications";
  const path = typeof requestedPath === "string" && requestedPath.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\") ? requestedPath : "/notifications";
  const url = new URL(path, self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(url);
      return existing.focus();
    }
    return clients.openWindow(url);
  })());
});
