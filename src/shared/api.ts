import axios, { AxiosRequestConfig, AxiosInstance } from 'axios'
import { AuthService } from '@/auth/service'

export type AlbumSort =
  'a-z' |
  'recently-added'|
  'recently-played' |
  'most-played' |
  'random'

export interface Track {
  id: string
  title: string
  duration: number
  starred: boolean
  image?: string
  url?: string
  track?: number
  album?: string
  albumId?: string
  artist?: string
  artistId?: string
}

export interface Album {
  id: string
  name: string
  artist: string
  artistId: string
  year: number
  starred: boolean
  genreId?: string
  image?: string
  tracks?: Track[]
}

export interface Artist {
  id: string
  name: string
  albumCount: number
  description?: string
  starred: boolean
  albums?: Album[]
}

export interface SearchResult {
  artists: Artist[]
  albums: Album[]
  tracks: Track[]
}

export class API {
  readonly http: AxiosInstance;
  readonly get: (path: string, params?: any) => Promise<any>;
  readonly post: (path: string, params?: any) => Promise<any>;
  readonly clientName = window.origin || 'web';

  constructor(private auth: AuthService) {
    this.http = axios.create({})
    this.http.interceptors.request.use((config: AxiosRequestConfig) => {
      config.params = config.params || {}
      config.baseURL = this.auth.server
      config.headers = { Authorization: `Bearer ${this.auth.accessToken}` } || {}
      return config
    })

    this.get = (path: string, params: any = {}) => {
      return this.http.get(path, { params }).then(response => {
        if (response.data.success !== true) {
          const message = response.data.error?.message || response.data.status
          const err = new Error(message)
          return Promise.reject(err)
        }
        return Promise.resolve(response.data)
      })
    }

    this.post = (path: string, params: any = {}) => {
      return this.http.post(path, params).then(response => {
        if (response.data.success !== true) {
          const err = new Error(response.data.status)
          return Promise.reject(err)
        }
        return Promise.resolve(response.data)
      })
    }
  }

  async getGenres() {
    const response = await this.get('rest/getGenres', {})
    return response.genres
      .map((item: any) => ({
        id: item.value,
        name: item.value,
        albumCount: item.albumCount,
        trackCount: item.songCount,
      }))
      .sort((a: any, b:any) => b.albumCount - a.albumCount)
  }

  async getAlbumsByGenre(id: string, size: number, offset = 0) {
    const params = {
      type: 'byGenre',
      genre: id,
      size,
      offset,
    }
    const response = await this.get('rest/getAlbumList', params)
    return (response.albums || []).map(this.normalizeAlbum, this)
  }

  async getTracksByGenre(id: string, size: number, offset = 0) {
    const params = {
      genre: id,
      count: size,
      offset,
    }
    const response = await this.get('rest/getSongsByGenre', params)
    return (response.songs || []).map(this.normalizeTrack, this)
  }

  async getArtists(): Promise<Artist[]> {
    const response = await this.get('rest/getArtists')
    return (response.artists?.index || [])
      .flatMap((index: any) => index.artist)
      .map(this.normalizeArtist, this)
  }

  async getAlbums(sort: AlbumSort, size: number, offset = 0): Promise<Album[]> {
    const type = {
      'a-z': 'alphabeticalByName',
      'recently-added': 'newest',
      'recently-played': 'recent',
      'most-played': 'frequent',
      random: 'random',
    }[sort]

    const params = { type, offset, size }
    const response = await this.get('rest/getAlbumList', params)
    const albums = response.albums || []
    return albums.map(this.normalizeAlbum, this)
  }

  async getArtistDetails(id: string): Promise<Artist> {
    const params = { id }
    const [info1] = await Promise.all([
      this.get('rest/getArtist', params).then(r => r.artist),
    ])
    return this.normalizeArtist({ ...info1 })
  }

  async getAlbumDetails(id: string): Promise<Album> {
    const params = { id }
    const data = await this.get('rest/getAlbum', params)
    return this.normalizeAlbum(data.album)
  }

  async getPlaylists() {
    const response = await this.get('rest/getPlaylists')
    return (response.playlists || []).map((playlist: any) => ({
      ...playlist,
      name: playlist.name || '(Unnamed)',
      image: playlist.songCount > 0 ? this.getCoverArtUrl(playlist) : undefined,
    }))
  }

  async getPlaylist(id: string) {
    if (id === 'random') {
      return {
        id,
        name: 'Random',
        tracks: await this.getRandomSongs(),
      }
    }
    const response = await this.get('rest/getPlaylist', { id })
    return {
      ...response.playlist,
      name: response.playlist.name || '(Unnamed)',
      tracks: (response.playlist.entry || []).map(this.normalizeTrack, this),
    }
  }

  async createPlaylist(name: string) {
    await this.get('rest/createPlaylist', { name })
    return this.getPlaylists()
  }

  async editPlaylist(playlistId: string, name: string) {
    const params = {
      playlistId,
      name,
    }
    await this.get('rest/updatePlaylist', params)
  }

  async deletePlaylist(id: string) {
    await this.get('rest/deletePlaylist', { id })
  }

  async addToPlaylist(playlistId: string, trackId: string) {
    const params = {
      playlistId,
      songIdToAdd: trackId,
    }
    await this.get('rest/updatePlaylist', params)
  }

  async removeFromPlaylist(playlistId: string, index: string) {
    const params = {
      playlistId,
      songIndexToRemove: index,
    }
    await this.get('rest/updatePlaylist', params)
  }

  async getRandomSongs(): Promise<Track[]> {
    const params = {
      size: 200,
    }
    const response = await this.get('rest/getRandomSongs', params)
    return (response.randomSongs || []).map(this.normalizeTrack, this)
  }

  async getStarred() {
    const response = await this.get('rest/getStarred')
    return {
      albums: (response.starred?.album || []).map(this.normalizeAlbum, this),
      artists: (response.starred?.artist || []).map(this.normalizeArtist, this),
      tracks: (response.starred?.song || []).map(this.normalizeTrack, this)
    }
  }

  starAlbum(id: string) {
    return this.star('album', id)
  }

  unstarAlbum(id: string) {
    return this.unstar('album', id)
  }

  async star(type: 'track' | 'album' | 'artist', id: string) {
    const params = {
      id: type === 'track' ? id : undefined,
      albumId: type === 'album' ? id : undefined,
      artistId: type === 'artist' ? id : undefined,
    }
    await this.get('rest/star', params)
  }

  async unstar(type: 'track' | 'album' | 'artist', id: string) {
    const params = {
      id: type === 'track' ? id : undefined,
      albumId: type === 'album' ? id : undefined,
      artistId: type === 'artist' ? id : undefined,
    }
    await this.get('rest/unstar', params)
  }

  async search(query: string): Promise<SearchResult> {
    const params = {
      query,
    }
    const data = await this.get('rest/search3', params)
    return {
      tracks: (data.searchResult3.song || []).map(this.normalizeTrack, this),
      albums: (data.searchResult3.album || []).map(this.normalizeAlbum, this),
      artists: (data.searchResult3.artist || []).map(this.normalizeArtist, this),
    }
  }

  async scrobble(id: string): Promise<void> {
    return this.get('rest/scrobble', { id })
  }

  private normalizeTrack(item: any): Track {
    return {
      id: item.id,
      title: item.title,
      duration: item.duration,
      starred: !!item.starred,
      track: item.track,
      album: item.album,
      albumId: item.albumId,
      artist: item.artist,
      artistId: item.artistId,
      url: this.getStreamUrl(item.id),
      image: this.getCoverArtUrl(item),
    }
  }

  private normalizeAlbum(item: any): Album {
    return {
      id: item.id,
      name: item.name,
      artist: item.artist,
      artistId: item.artistId,
      image: this.getCoverArtUrl(item),
      year: item.year || 0,
      starred: !!item.starred,
      genreId: item.genre,
      tracks: (item.song || []).map(this.normalizeTrack, this)
    }
  }

  private normalizeArtist(item: any): Artist {
    const albums = item.album
      ?.map(this.normalizeAlbum, this)
      .sort((a: any, b: any) => b.year - a.year)

    return {
      id: item.id,
      name: item.name,
      description: (item.description || '').replace(/<a[^>]*>.*?<\/a>/gm, ''),
      starred: !!item.starred,
      albumCount: item.albumCount,
      albums,
    }
  }

  getDownloadUrl(id: any) {
    const { server, email } = this.auth
    return `${server}/rest/download` +
      `?id=${id}`
  }

  private getCoverArtUrl(item: any) {
    if (!item.coverArt) {
      return undefined
    }
    const { server, email } = this.auth
    return `${server}/rest/getCoverArt` +
      `?id=${item.coverArt}` +
      '&size=300'
  }

  private getStreamUrl(id: any) {
    const { server, email } = this.auth
    return `${server}/rest/stream` +
      `?id=${id}` +
      '&format=raw'
  }
}
