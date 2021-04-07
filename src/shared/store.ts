import Vuex, { Module } from 'vuex'

import { playerModule } from '@/player/store'
import { AuthService } from '@/auth/service'
import { API } from './api'
import { config } from '@/shared/config'

interface State {
  isLoggedIn: boolean;
  email: null | string;
  server: null | string;
  accessToken: null | string;
  showMenu: boolean;
  error: Error | null;
  playlists: any[];
}

const setupRootModule = (authService: AuthService, api: API): Module<State, any> => ({
  state: {
    isLoggedIn: false,
    email: null,
    server: null,
    accessToken: null,
    showMenu: false,
    error: null,
    playlists: [],
  },
  mutations: {
    setError(state, error) {
      state.error = error
    },
    clearError(state) {
      state.error = null
    },
    setLoginSuccess(state, { email, accessToken }) {
      state.isLoggedIn = true
      state.email = email
      state.server = config.serverUrl
      state.accessToken = accessToken
    },
    setMenuVisible(state, visible) {
      state.showMenu = visible
    },
    setPlaylists(state, playlists: any[]) {
      state.playlists = playlists
        .sort((a: any, b: any) => b.changed.localeCompare(a.changed))
    },
    setPlaylist(state, playlist: any) {
      const idx = state.playlists.findIndex(x => x.id === playlist.id)
      state.playlists.splice(idx, 1, playlist)
    },
    removePlaylist(state, id: string) {
      state.playlists = state.playlists.filter(p => p.id !== id)
    },
  },
  actions: {
    showMenu({ commit }) {
      commit('setMenuVisible', true)
    },
    hideMenu({ commit }) {
      commit('setMenuVisible', false)
    },
    loadPlaylists({ commit }) {
      api.getPlaylists().then(result => {
        commit('setPlaylists', result)
      })
    },
    createPlaylist({ commit }, name) {
      api.createPlaylist(name).then(result => {
        commit('setPlaylists', result)
      })
    },
    updatePlaylist({ commit, state }, { id, name }) {
      api.editPlaylist(id, name).then(() => {
        const playlist = {
          ...state.playlists.find(x => x.id === id),
          name,
        }
        commit('setPlaylist', playlist)
      })
    },
    addTrackToPlaylist({ }, { playlistId, trackId }) {
      api.addToPlaylist(playlistId, trackId)
    },
    deletePlaylist({ commit }, id) {
      api.deletePlaylist(id).then(() => {
        commit('removePlaylist', id)
      })
    }
  },
})

export function setupStore(authService: AuthService, api: API) {
  const store = new Vuex.Store({
    strict: true,
    ...setupRootModule(authService, api),
    modules: {
      player: {
        namespaced: true,
        ...playerModule
      }
    }
  })

  store.watch(
    (state) => state.isLoggedIn,
    () => {
      store.dispatch('loadPlaylists')
    }
  )

  return store
}
