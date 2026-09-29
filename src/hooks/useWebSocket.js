import { useEffect, useRef, useState } from "react";

const MAX_BACKOFF_MS = 30000;

// Opens /api/ws with the stored JWT and calls onMessage for every server push.
// Reconnects with the same exponential backoff the mobile client uses, and
// stops for good if the server rejects the token (close code 1008), since a
// stale token would otherwise be retried forever.
//
// Pass enabled=false while signed out so the socket is not opened at all.
export function useWebSocket(onMessage, enabled = true) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onMessage);

  // Written in an effect rather than during render: the socket closes over
  // this ref, so it must always see the latest callback without reconnecting.
  useEffect(() => {
    handlerRef.current = onMessage;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let socket = null;
    let retryTimer = null;
    let attempt = 0;
    let stopped = false;

    function readToken() {
      try {
        const raw = localStorage.getItem("pulsebook.auth");
        return raw ? JSON.parse(raw).token : null;
      } catch {
        return null;
      }
    }

    function scheduleReconnect() {
      if (stopped) return;
      const backoff = Math.min(1000 * 2 ** Math.min(attempt, 5), MAX_BACKOFF_MS);
      attempt += 1;
      retryTimer = setTimeout(connect, backoff);
    }

    function connect() {
      if (stopped) return;
      const token = readToken();
      if (!token) {
        scheduleReconnect();
        return;
      }

      const base = import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws");
      socket = new WebSocket(`${base}/api/ws?token=${encodeURIComponent(token)}`);

      socket.onopen = () => {
        attempt = 0;
        setConnected(true);
      };

      socket.onmessage = (event) => {
        let frame;
        try {
          frame = JSON.parse(event.data);
        } catch {
          return;
        }
        handlerRef.current?.(frame);
      };

      socket.onerror = () => socket?.close();

      socket.onclose = (event) => {
        setConnected(false);
        socket = null;
        if (event.code === 1008) {
          // Invalid/revoked token: reconnecting cannot help. The user needs to
          // sign in again, which AuthContext handles on the next API call.
          return;
        }
        scheduleReconnect();
      };
    }

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      setConnected(false);
    };
  }, [enabled]);

  return enabled && connected;
}
