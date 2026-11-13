export const Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web',
}

export const App = {
  exitApp: async () => {},
  addListener: () => ({ remove: () => {} }),
}

export const StatusBar = {
  setStyle: async () => {},
  setBackgroundColor: async () => {},
  show: async () => {},
  hide: async () => {},
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

export interface Token {
  value: string;
}
export interface ActionPerformed {
  actionId: string;
  notification: any;
}
export interface PushNotificationSchema {
  id?: string;
  title?: string;
  body?: string;
  data?: any;
}

export const PushNotifications = {
  requestPermissions: async () => ({ receive: 'granted' }),
  register: async () => {},
  addListener: (_event: string, _callback: any) => ({ remove: () => {} }),
}
