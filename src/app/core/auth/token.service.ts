import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'rentame_mobile_token';
const USER_KEY  = 'rentame_mobile_user';

/**
 * TokenService (Ionic / Capacitor Mobile)
 *
 * Utiliza @capacitor/preferences para almacenamiento seguro y persistente
 * en dispositivos nativos (Android/iOS) y fallback a Web Storage en navegador.
 * Mantiene copia en memoria para acceso síncrono ultra-rápido en interceptores HTTP.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private cachedToken: string | null = null;
  private cachedUser: unknown = null;
  private initialized = false;

  constructor() {
    this.init();
  }

  /**
   * Inicializa la caché en memoria desde Capacitor Preferences
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const { value: token } = await Preferences.get({ key: TOKEN_KEY });
      this.cachedToken = token;

      const { value: userStr } = await Preferences.get({ key: USER_KEY });
      this.cachedUser = userStr ? JSON.parse(userStr) : null;
      this.initialized = true;
    } catch (e) {
      console.warn('[TokenService] Error initializing preferences:', e);
      this.initialized = true;
    }
  }

  /**
   * Guarda el token de autenticación
   */
  async saveToken(token: string): Promise<void> {
    this.cachedToken = token;
    await Preferences.set({ key: TOKEN_KEY, value: token });
  }

  /**
   * Obtiene el token de forma síncrona (desde memoria)
   */
  getToken(): string | null {
    return this.cachedToken;
  }

  /**
   * Obtiene el token de forma asíncrona directamente del storage
   */
  async getTokenAsync(): Promise<string | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    this.cachedToken = value;
    return value;
  }

  /**
   * Guarda los datos del usuario
   */
  async saveUser(user: object): Promise<void> {
    this.cachedUser = user;
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
  }

  /**
   * Obtiene los datos del usuario en memoria
   */
  getUser<T>(): T | null {
    return (this.cachedUser as T) || null;
  }

  /**
   * Elimina sesión y credenciales
   */
  async clearAll(): Promise<void> {
    this.cachedToken = null;
    this.cachedUser = null;
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: USER_KEY });
  }

  /**
   * Verifica si hay token almacenado
   */
  hasToken(): boolean {
    return !!this.cachedToken;
  }
}
