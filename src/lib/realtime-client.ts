'use client';

export type RealtimeStatus = 'disabled' | 'connecting' | 'connected' | 'disconnected' | 'error';

type RealtimePayload = Record<string, unknown>;

type RealtimeMessage = {
  type: string;
  payload?: RealtimePayload;
  ts?: number;
};

type Listener = (payload: RealtimePayload, message: RealtimeMessage) => void;
type StatusListener = (status: RealtimeStatus) => void;

const DEFAULT_RECONNECT_MS = 2500;

class EnkambaRealtimeClient {
  private socket: WebSocket | null = null;
  private url = '';
  private authenticatedPayload: RealtimePayload | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private statusListeners = new Set<StatusListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manualClose = false;
  private status: RealtimeStatus = 'disabled';
  private queue: RealtimeMessage[] = [];

  configure(url?: string) {
    this.url = String(url || '').trim();
    this.setStatus(this.url ? 'disconnected' : 'disabled');
  }

  connect(authPayload: RealtimePayload) {
    if (typeof window === 'undefined') return;
    this.authenticatedPayload = authPayload;
    this.manualClose = false;

    if (!this.url) {
      this.setStatus('disabled');
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      this.send('auth', authPayload);
      return;
    }

    this.openSocket();
  }

  disconnect() {
    this.manualClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close();
    this.socket = null;
    this.setStatus(this.url ? 'disconnected' : 'disabled');
  }

  send(type: string, payload: RealtimePayload = {}) {
    const message = { type, payload };
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      if (this.queue.length < 30) this.queue.push(message);
      return;
    }

    this.socket.send(JSON.stringify(message));
  }

  subscribe(type: string, listener: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)?.add(listener);
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  onStatus(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  getStatus() {
    return this.status;
  }

  private openSocket() {
    if (!this.url) return;

    this.setStatus('connecting');
    try {
      this.socket = new WebSocket(this.url);
    } catch {
      this.setStatus('error');
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.setStatus('connected');
      if (this.authenticatedPayload) this.send('auth', this.authenticatedPayload);
      const pending = [...this.queue];
      this.queue = [];
      pending.forEach((message) => this.send(message.type, message.payload || {}));
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as RealtimeMessage;
        const payload = message.payload || {};
        this.listeners.get(message.type)?.forEach((listener) => listener(payload, message));
        this.listeners.get('*')?.forEach((listener) => listener(payload, message));
      } catch {
        // Ignore malformed realtime frames.
      }
    };

    this.socket.onerror = () => {
      this.setStatus('error');
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.setStatus(this.url ? 'disconnected' : 'disabled');
      if (!this.manualClose) this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.manualClose || !this.url) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.authenticatedPayload) this.openSocket();
    }, DEFAULT_RECONNECT_MS);
  }

  private setStatus(status: RealtimeStatus) {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}

export const enkambaRealtime = new EnkambaRealtimeClient();

export function getRealtimeUrl() {
  return process.env.NEXT_PUBLIC_REALTIME_WS_URL || '';
}
