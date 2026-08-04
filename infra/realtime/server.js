import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT || 8787);
const heartbeatMs = Number(process.env.HEARTBEAT_MS || 25000);
const presenceTtlMs = Number(process.env.PRESENCE_TTL_MS || 45000);
const maxPayloadBytes = Number(process.env.MAX_PAYLOAD_BYTES || 16 * 1024);

const clients = new Map();
const userSockets = new Map();
const conversationRooms = new Map();

function now() {
  return Date.now();
}

function safeText(value, max = 140) {
  return String(value || '').slice(0, max);
}

function publicUser(client) {
  return {
    uid: client.uid,
    name: client.name,
    avatar: client.avatar,
    app: client.app,
    path: client.path,
    online: true,
    lastSeenAt: client.lastSeenAt,
  };
}

function send(client, type, payload = {}) {
  if (!client?.socket || client.socket.readyState !== client.socket.OPEN) return;
  client.socket.send(JSON.stringify({ type, payload, ts: now() }));
}

function broadcastToUser(uid, type, payload, exceptSocketId) {
  const socketIds = userSockets.get(uid);
  if (!socketIds) return;

  for (const socketId of socketIds) {
    if (socketId === exceptSocketId) continue;
    send(clients.get(socketId), type, payload);
  }
}

function broadcastToRoom(roomId, type, payload, exceptSocketId) {
  const socketIds = conversationRooms.get(roomId);
  if (!socketIds) return;

  for (const socketId of socketIds) {
    if (socketId === exceptSocketId) continue;
    send(clients.get(socketId), type, payload);
  }
}

function joinRoom(client, conversationId) {
  const roomId = safeText(conversationId, 120);
  if (!roomId) return;
  client.rooms.add(roomId);
  if (!conversationRooms.has(roomId)) conversationRooms.set(roomId, new Set());
  conversationRooms.get(roomId).add(client.id);
}

function leaveRoom(client, conversationId) {
  const roomId = safeText(conversationId, 120);
  if (!roomId) return;
  client.rooms.delete(roomId);
  const room = conversationRooms.get(roomId);
  room?.delete(client.id);
  if (room && room.size === 0) conversationRooms.delete(roomId);
}

function removeClient(client) {
  if (!client) return;

  clients.delete(client.id);
  if (client.uid) {
    const sockets = userSockets.get(client.uid);
    sockets?.delete(client.id);
    if (!sockets || sockets.size === 0) {
      userSockets.delete(client.uid);
      broadcastPresence(client.uid, false, client);
    }
  }

  for (const roomId of client.rooms) {
    const room = conversationRooms.get(roomId);
    room?.delete(client.id);
    if (room && room.size === 0) conversationRooms.delete(roomId);
  }
}

function broadcastPresence(uid, online, sourceClient) {
  const payload = {
    uid,
    online,
    name: sourceClient?.name || '',
    avatar: sourceClient?.avatar || '',
    app: sourceClient?.app || '',
    path: sourceClient?.path || '',
    lastSeenAt: now(),
  };

  for (const client of clients.values()) {
    if (client.uid === uid) continue;
    send(client, 'presence:update', payload);
  }
}

function handleAuth(client, payload) {
  const uid = safeText(payload?.uid, 128);
  if (!uid) {
    send(client, 'error', { message: 'Utilisateur invalide.' });
    return;
  }

  client.uid = uid;
  client.name = safeText(payload?.name || 'Utilisateur', 80);
  client.avatar = safeText(payload?.avatar, 300);
  client.app = safeText(payload?.app || 'eNkamba', 60);
  client.path = safeText(payload?.path, 240);
  client.lastSeenAt = now();

  if (!userSockets.has(uid)) userSockets.set(uid, new Set());
  const wasOffline = userSockets.get(uid).size === 0;
  userSockets.get(uid).add(client.id);

  send(client, 'auth:ok', {
    socketId: client.id,
    connectedUsers: userSockets.size,
    connectedSockets: clients.size,
  });

  if (wasOffline) broadcastPresence(uid, true, client);
}

function handleMessage(client, raw) {
  if (Buffer.byteLength(raw) > maxPayloadBytes) {
    send(client, 'error', { message: 'Message temps réel trop volumineux.' });
    return;
  }

  let message;
  try {
    message = JSON.parse(raw);
  } catch {
    send(client, 'error', { message: 'Message temps réel invalide.' });
    return;
  }

  const type = safeText(message?.type, 80);
  const payload = message?.payload || {};
  client.lastSeenAt = now();

  switch (type) {
    case 'auth':
      handleAuth(client, payload);
      break;
    case 'presence:ping':
      client.app = safeText(payload?.app || client.app, 60);
      client.path = safeText(payload?.path || client.path, 240);
      send(client, 'presence:pong', { at: now() });
      break;
    case 'conversation:join':
      joinRoom(client, payload?.conversationId);
      break;
    case 'conversation:leave':
      leaveRoom(client, payload?.conversationId);
      break;
    case 'typing:start':
    case 'typing:stop': {
      const conversationId = safeText(payload?.conversationId, 120);
      if (!conversationId || !client.uid) return;
      broadcastToRoom(
        conversationId,
        type,
        {
          conversationId,
          uid: client.uid,
          name: client.name,
          at: now(),
        },
        client.id
      );
      break;
    }
    case 'notification:realtime': {
      const toUid = safeText(payload?.toUid, 128);
      if (!toUid || !client.uid) return;
      broadcastToUser(toUid, 'notification:realtime', {
        fromUid: client.uid,
        title: safeText(payload?.title, 120),
        message: safeText(payload?.message, 240),
        actionUrl: safeText(payload?.actionUrl, 240),
        notificationType: safeText(payload?.notificationType, 80),
        at: now(),
      });
      break;
    }
    case 'call:ringing': {
      const toUid = safeText(payload?.toUid, 128);
      if (!toUid || !client.uid) return;
      broadcastToUser(toUid, 'call:ringing', {
        fromUid: client.uid,
        fromName: client.name,
        conversationId: safeText(payload?.conversationId, 120),
        callId: safeText(payload?.callId, 120),
        callType: payload?.callType === 'audio' ? 'audio' : 'video',
        actionUrl: safeText(payload?.actionUrl, 240),
        at: now(),
      });
      break;
    }
    default:
      send(client, 'error', { message: 'Type temps réel non reconnu.' });
  }
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    const body = JSON.stringify({
      ok: true,
      service: 'enkamba-realtime',
      connectedUsers: userSockets.size,
      connectedSockets: clients.size,
      rooms: conversationRooms.size,
      uptime: process.uptime(),
    });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(body);
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ ok: false }));
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (socket, request) => {
  const client = {
    id: randomUUID(),
    uid: '',
    name: '',
    avatar: '',
    app: '',
    path: '',
    lastSeenAt: now(),
    socket,
    rooms: new Set(),
  };

  clients.set(client.id, client);
  socket.isAlive = true;

  socket.on('pong', () => {
    socket.isAlive = true;
    client.lastSeenAt = now();
  });

  socket.on('message', (raw) => handleMessage(client, raw.toString()));
  socket.on('close', () => removeClient(client));
  socket.on('error', () => removeClient(client));

  send(client, 'server:hello', {
    socketId: client.id,
    ip: request.socket.remoteAddress,
    at: now(),
  });
});

setInterval(() => {
  const cutoff = now() - presenceTtlMs;

  for (const client of clients.values()) {
    if (client.socket.readyState !== client.socket.OPEN || client.lastSeenAt < cutoff) {
      try {
        client.socket.terminate();
      } catch {}
      removeClient(client);
      continue;
    }

    client.socket.isAlive = false;
    try {
      client.socket.ping();
    } catch {
      removeClient(client);
    }
  }
}, heartbeatMs);

server.listen(port, '0.0.0.0', () => {
  console.log(`eNkamba realtime server listening on ${port}`);
});
