import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export function useWebSocket(channel = "schedule") {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Build WebSocket URL from API base or current host
    const apiUrl = import.meta.env.VITE_API_URL;
    let wsUrl;
    if (apiUrl) {
      // Production: derive WS URL from API URL (https://x → wss://x)
      const base = apiUrl.replace(/^http/, "ws").replace(/\/+$/, "");
      wsUrl = `${base}/ws/${channel}?token=${token}`;
    } else {
      // Dev: same host via Vite proxy
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${proto}//${location.host}/ws/${channel}?token=${token}`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
      ws.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          setEvents(prev => [...prev.slice(-49), evt]);
        } catch {}
      };
      return () => ws.close();
    } catch { setConnected(false); }
  }, [channel, token]);

  return { events, connected, lastEvent: events[events.length - 1] };
}
