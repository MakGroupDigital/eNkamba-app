'use client';

export type RealtimeStatus = 'disabled' | 'connecting' | 'connected' | 'disconnected' | 'error';

type RealtimePayload = Record<string, unknown>;

type RealtimeMessage = {
  type: string;
  payload?: RealtimePayload;
  clientMessageId?: string;
  queuedAt?: number;
  attempts?: number;
  ts?: number;
};

type Listener = (payload: RealtimePayload, message: RealtimeMessage) => void;
type StatusListener = (status: RealtimeStatus) => void;
type SendOptions = {
  persist?: boolean;
  dedupeKey?: string;
};

const DEFAULT_RECONNECT_MS = 2500;
const MAX_RECONNECT_MS = 20000;
const PERSISTED_QUEUE_KEY = 'enkamba_realtime_queue_v1';
const MAX_PERSISTED_QUEUE = 50;
const CRITICAL_TYPES = new Set(['notification:realtime', 'call:ringing']);

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
  private reconnectAttempt = 0;

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
      if (this.socket.readyState === WebSocket.OPEN) this.sendAuth();
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
    return this.sendWithOptions(type, payload);
  }

  sendReliable(type: string, payload: RealtimePayload = {}, options: SendOptions = {}) {
    return this.sendWithOptions(type, payload, { ...options, persist: true });
  }

  notifyUser(input: {
    toUid: string;
    title: string;
    message: string;
    actionUrl?: string;
    notificationType?: string;
    priority?: 'normal' | 'high' | 'critical';
    entityId?: string;
    notificationId?: string;
  }) {
    return this.sendReliable('notification:realtime', input, {
      dedupeKey: input.notificationId || `${input.toUid}:${input.notificationType || 'notification'}:${input.entityId || input.actionUrl || input.message}`,
    });
  }

  ringCall(input: {
    toUid: string;
    conversationId: string;
    callId: string;
    callType: 'audio' | 'video';
    actionUrl: string;
    notificationId?: string;
  }) {
    return this.sendReliable('call:ringing', input, {
      dedupeKey: input.notificationId || `call:${input.callId}`,
    });
  }

  private sendWithOptions(type: string, payload: RealtimePayload = {}, options: SendOptions = {}) {
    const clientMessageId = this.getClientMessageId(options.dedupeKey);
    const message: RealtimeMessage = {
      type,
      payload,
      clientMessageId,
      queuedAt: Date.now(),
      attempts: 0,
    };

    if (options.persist || CRITICAL_TYPES.has(type)) {
      this.persistMessage(message, options.dedupeKey);
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      if (this.queue.length < 30) this.queue.push(message);
      this.scheduleReconnect();
      return clientMessageId;
    }

    this.sendRaw(message);
    return clientMessageId;
  }

  private sendRaw(message: RealtimeMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({
      ...message,
      attempts: (message.attempts || 0) + 1,
    }));
  }

  private flushQueues() {
    const persisted = this.readPersistedQueue();
    const pending = [...persisted, ...this.queue];
    const seen = new Set<string>();
    this.queue = [];

    pending.forEach((message) => {
      const key = message.clientMessageId || `${message.type}:${JSON.stringify(message.payload || {})}`;
      if (seen.has(key)) return;
      seen.add(key);
      this.sendRaw(message);
    });
  }

  private getClientMessageId(dedupeKey?: string) {
    if (dedupeKey) return `rt-${this.hashText(dedupeKey)}`;
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return `rt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private persistMessage(message: RealtimeMessage, dedupeKey?: string) {
    if (typeof window === 'undefined') return;
    const nextMessage = {
      ...message,
      clientMessageId: message.clientMessageId || this.getClientMessageId(dedupeKey),
    };
    const queue = this.readPersistedQueue().filter((item) => item.clientMessageId !== nextMessage.clientMessageId);
    queue.push(nextMessage);
    window.localStorage.setItem(PERSISTED_QUEUE_KEY, JSON.stringify(queue.slice(-MAX_PERSISTED_QUEUE)));
  }

  private acknowledgeMessage(clientMessageId?: string) {
    if (!clientMessageId || typeof window === 'undefined') return;
    const queue = this.readPersistedQueue().filter((item) => item.clientMessageId !== clientMessageId);
    window.localStorage.setItem(PERSISTED_QUEUE_KEY, JSON.stringify(queue));
  }

  private readPersistedQueue() {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(PERSISTED_QUEUE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return parsed
        .filter((item) => item?.type && item?.clientMessageId && Number(item?.queuedAt || 0) > cutoff)
        .slice(-MAX_PERSISTED_QUEUE) as RealtimeMessage[];
    } catch {
      return [];
    }
  }

  private hashText(text: string) {
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
    }
    return Math.abs(hash).toString(36);
  }

  private sendAuth() {
    if (!this.authenticatedPayload) return;
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type: 'auth', payload: this.authenticatedPayload }));
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
      this.reconnectAttempt = 0;
      this.sendAuth();
      this.flushQueues();
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as RealtimeMessage;
        const payload = message.payload || {};
        if (message.type === 'server:ack') {
          const clientMessageId = String(payload.clientMessageId || '');
          const status = String(payload.status || '');
          if (clientMessageId && status !== 'rejected') this.acknowledgeMessage(clientMessageId);
        }
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
    const delay = Math.min(DEFAULT_RECONNECT_MS * Math.max(1, this.reconnectAttempt + 1), MAX_RECONNECT_MS);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.authenticatedPayload) this.openSocket();
    }, delay);
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
