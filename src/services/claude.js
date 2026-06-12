import { isPremium, getPlanConfig } from './subscription';
import { getSubToken, getDeviceId } from './subscription';

// Max messages sent to server per call — caps cost on long conversations
const MAX_CONTEXT_MESSAGES = 20;
import { getMemory } from './memory';

const SERVER_URL = 'https://mindtalk-server-production.up.railway.app';
const APP_KEY = 'mk-app-2024-xK9pL3mNqR7vW2jT'; // must match APP_KEY env var on server

// ─── HMAC-SHA256 request signing ──────────────────────────────────────────────
// Signs the request body with the APP_KEY so the server can detect if a proxy
// tool (Charles, Burp Suite) has modified the body in transit.
// Uses the Web Crypto API available in Hermes (React Native 0.71+).
async function signBody(bodyStr, ts) {
  try {
    const enc = new TextEncoder();
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      'raw',
      enc.encode(APP_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await globalThis.crypto.subtle.sign(
      'HMAC',
      keyMaterial,
      enc.encode(`${ts}:${bodyStr}`)
    );
    // Convert ArrayBuffer → hex string
    return Array.from(new Uint8Array(sigBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    // Web Crypto not available (old RN / web) — skip signing, server allows unsigned
    console.warn('[Security] HMAC signing unavailable:', e.message);
    return '';
  }
}

export async function sendMessage(messages, userName = 'friend', coachName = 'Sarah', coachGender = 'female', checkup = null, coachLanguage = 'en', coachId = 'sarah_en', userGender = null) {
  const plan = await getPlanConfig();
  const memory = await getMemory();

  // Always keep the first message (welcome) + last N messages to cap token cost
  const contextMessages = messages.length > MAX_CONTEXT_MESSAGES
    ? [messages[0], ...messages.slice(-(MAX_CONTEXT_MESSAGES - 1))]
    : messages;

  const bodyObj = {
    messages: contextMessages.map((msg) => ({ role: msg.role, content: msg.content })),
    userName,
    isPremium: plan.id !== 'free',   // kept for dev-mode fallback; server ignores in production
    planModel: plan.model,           // 'haiku' | 'sonnet'
    chatLanguage: coachLanguage,
    memory,
    coachName,
    coachGender,
    coachId,
    checkup,
    userGender,
  };

  const bodyStr = JSON.stringify(bodyObj);
  const ts      = Date.now().toString();
  const sig     = await signBody(bodyStr, ts);

  // Sub-token: server-issued after purchase, stored in SecureStore.
  // Server validates this and uses it as the ONLY source of truth for premium.
  const subToken = await getSubToken();

  const response = await fetch(`${SERVER_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-key': APP_KEY,
      'x-ts': ts,                   // timestamp — replay protection
      ...(sig       && { 'x-sig':       sig }),        // HMAC signature
      ...(subToken  && { 'x-sub-token': subToken }),   // subscription proof
    },
    body: bodyStr,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const data = await response.json();
  return data.content;
}
