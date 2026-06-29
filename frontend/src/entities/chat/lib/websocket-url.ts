function getDefaultWebSocketBaseUrl() {
  if (typeof window === 'undefined') {
    return 'ws://localhost:8001';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || getDefaultWebSocketBaseUrl();

export function buildChatWebSocketUrl(projectId: string | number, baseUrl = WS_BASE_URL) {
  // Browser WebSocket cannot send an Authorization header; backend must support
  // token query/subprotocol or another auth mechanism if JWT middleware requires it.
  return `${baseUrl.replace(/\/$/, '')}/ws/chat/${encodeURIComponent(projectId)}/`;
}
