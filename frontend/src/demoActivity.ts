const activityUrl = '/_demo/activity';
const intervalMs = 30_000;
let lastSent = -Infinity;
let sending = false;

async function reportActivity() {
  if (document.visibilityState !== 'visible' || sending) return;
  const now = performance.now();
  if (now - lastSent < intervalMs) return;
  sending = true;
  try {
    const response = await fetch(activityUrl, {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      keepalive: true,
    });
    if (response.ok) lastSent = now;
  } catch {
    // Activity reporting must not interrupt the application.
  } finally {
    sending = false;
  }
}

function onInteraction(event: Event) {
  if (event.isTrusted) void reportActivity();
}

for (const eventName of ['pointerdown', 'pointermove', 'keydown', 'scroll']) {
  window.addEventListener(eventName, onInteraction, {
    passive: true,
    capture: true,
  });
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void reportActivity();
});

void reportActivity();
