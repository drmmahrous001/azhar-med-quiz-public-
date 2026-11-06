'use client'

import { useSyncExternalStore } from 'react'

export function createLocalStore<T extends object>(key: string, empty: T) {
  let cache: T | null = null
  const listeners = new Set<() => void>()

  function read(): T {
    if (cache) return cache
    try {
      const raw = window.localStorage.getItem(key)
      cache = raw ? { ...empty, ...JSON.parse(raw) } : empty
    } catch {
      cache = empty
    }
    return cache as T
  }

  function write(next: T) {
    cache = next
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Storage can be unavailable (private mode, quota); keep in-memory state.
    }
    listeners.forEach((listener) => listener())
  }

  function update(fn: (prev: T) => T) {
    write(fn(read()))
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) {
        cache = null
        listener()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }

  function useStore() {
    return useSyncExternalStore(subscribe, read, () => empty)
  }

  return { read, write, update, useStore, reset: () => write(empty) }
}
