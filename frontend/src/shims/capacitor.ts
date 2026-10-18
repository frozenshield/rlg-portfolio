export const Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web',
}

export enum CameraResultType {
  Uri = 'uri',
  Base64 = 'base64',
  DataUrl = 'dataUrl',
}

export enum CameraSource {
  Prompt = 'PROMPT',
  Camera = 'CAMERA',
  Photos = 'PHOTOS',
}

export const Camera = {
  getPhoto: async (_options?: any) => ({
    dataUrl: '/templates/pokemon-rlg-card-template.png',
    format: 'png',
    webPath: '/templates/pokemon-rlg-card-template.png',
  }),
}

export enum ImpactStyle {
  Heavy = 'HEAVY',
  Medium = 'MEDIUM',
  Light = 'LIGHT',
}

export const Haptics = {
  impact: async (_options?: any) => {},
  vibrate: async (_options?: any) => {},
}

export const Browser = {
  open: async (_options?: { url: string }) => {},
  close: async () => {},
}

export const Preferences = {
  get: async ({ key }: { key: string }) => ({
    value: typeof window !== 'undefined' ? window.localStorage.getItem(key) : null,
  }),
  set: async ({ key, value }: { key: string; value: string }) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value)
  },
  remove: async ({ key }: { key: string }) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key)
  },
}

