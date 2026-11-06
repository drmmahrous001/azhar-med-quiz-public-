'use client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type DeviceSessionPayload = {
  localStorage: Record<string, string>
  route?: string
  savedAt: number
}

export type DeviceSessionResult =
  | { ok: true; session_id?: string; version: number; payload?: DeviceSessionPayload }
  | { ok: false; reason: string }

function getConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase is not configured. Check the Vercel environment variables.')
  }
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_KEY }
}

/** Generates a high-entropy, URL-safe recovery code. Never log this value. */
export function generateRecoveryCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { url, key } = getConfig()
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Supabase request failed (${response.status}): ${detail.slice(0, 240)}`)
  }
  return response.json() as Promise<T>
}

export function createRemoteSession(code: string, payload: DeviceSessionPayload) {
  return rpc<DeviceSessionResult>('create_device_session', {
    p_recovery_code: code,
    p_payload: payload,
  })
}

export function saveRemoteSession(code: string, payload: DeviceSessionPayload, expectedVersion: number) {
  return rpc<DeviceSessionResult>('save_device_session', {
    p_recovery_code: code,
    p_payload: payload,
    p_expected_version: expectedVersion,
  })
}

export function transferRemoteSession(oldCode: string, newCode: string) {
  return rpc<DeviceSessionResult>('transfer_device_session', {
    p_recovery_code: oldCode,
    p_new_recovery_code: newCode,
  })
}
