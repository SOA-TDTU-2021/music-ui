export interface Config {
  serverUrl: string
}

export const config: Config = {
  serverUrl: process.env.SERVER_URL || 'https://music-api.xuansang.ga',
}
