const axios = {
  defaults: {
    headers: {
      common: {} as Record<string, string>,
    },
  },
  async post(url: string, body?: any) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.defaults.headers.common,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    return { data, status: res.status }
  },
  async get(url: string) {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.defaults.headers.common,
      },
    })
    const data = await res.json().catch(() => ({}))
    return { data, status: res.status }
  },
}

export default axios

