import axios from 'axios'
import { config } from '@/shared/config'

export class AuthService {
  public server = '';
  public email = '';
  public accessToken = '';
  private authenticated = false;
  private registedSuccess = false;

  constructor() {
    this.server = config.serverUrl || localStorage.getItem('server') || ''
    this.email = localStorage.getItem('email') || ''
    this.accessToken = localStorage.getItem('access_token') || ''
  }

  private saveSession() {
    if (!config.serverUrl) {
      localStorage.setItem('server', this.server)
    }
    localStorage.setItem('email', this.email)
    localStorage.setItem('access_token', this.accessToken)
  }

  async checkTokenExist(): Promise<boolean> {
    if (!this.accessToken) {
      return false
    }
    return this.loginWithPassword(this.email, '1234', false)
      .then(() => true)
      .catch(() => false)
  }

  async loginWithPassword(email: string, password: string, remember: boolean) {
    return axios.post(`${this.server}/rest/login`, { email: email, password: password })
      .then((response) => {
        if (response.data.success !== true) {
          const err = new Error(response.data.message)
          return Promise.reject(err)
        }
        this.authenticated = true
        this.email = email
        this.accessToken = response.data.access_token
        if (remember) {
          this.saveSession()
        }
      })
  }

  async registerUser(name: string, email: string, password: string) {
    return axios.post(`${this.server}/rest/register`, { name: name, email: email, password: password })
      .then((response) => {
        if (response.data.success !== true) {
          const err = new Error(response.data.message)
          return Promise.reject(err)
        }
        this.registedSuccess = true
      })
  }

  logout() {
    localStorage.clear()
    sessionStorage.clear()
  }

  isAuthenticated() {
    return this.authenticated
  }

  isRegistedSuccess() {
    return this.registedSuccess
  }
}
