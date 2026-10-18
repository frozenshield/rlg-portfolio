import { ref, watch, type Ref } from 'vue'

export const StorageSerializers = {
  object: {
    read: (v: string) => (v ? JSON.parse(v) : null),
    write: (v: any) => JSON.stringify(v),
  },
  string: {
    read: (v: string) => v,
    write: (v: any) => String(v),
  },
  number: {
    read: (v: string) => Number.parseFloat(v),
    write: (v: any) => String(v),
  },
  boolean: {
    read: (v: string) => v === 'true',
    write: (v: any) => String(v),
  },
}

export function useStorage<T>(
  key: string,
  initialValue: T,
  storage?: Storage,
  options?: { serializer?: { read: (v: string) => any; write: (v: any) => string } }
): Ref<T> {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined)
  let startVal = initialValue

  if (store) {
    try {
      const raw = store.getItem(key)
      if (raw !== null) {
        if (options?.serializer) {
          startVal = options.serializer.read(raw)
        } else if (typeof initialValue === 'string') {
          try {
            startVal = JSON.parse(raw)
          } catch {
            startVal = raw as unknown as T
          }
        } else {
          startVal = JSON.parse(raw)
        }
      } else if (initialValue !== null && initialValue !== undefined) {
        const serialized = options?.serializer
          ? options.serializer.write(initialValue)
          : typeof initialValue === 'string'
            ? initialValue
            : JSON.stringify(initialValue)
        store.setItem(key, serialized)
      }
    } catch {
      startVal = initialValue
    }
  }

  const data = ref(startVal) as Ref<T>

  watch(
    data,
    (newVal) => {
      if (!store) return
      try {
        if (newVal === null || newVal === undefined) {
          store.removeItem(key)
        } else {
          const serialized = options?.serializer
            ? options.serializer.write(newVal)
            : typeof newVal === 'string'
              ? newVal
              : JSON.stringify(newVal)
          store.setItem(key, serialized)
        }
      } catch {
        // Ignore storage quota errors in demo mode
      }
    },
    { deep: true }
  )

  return data
}

