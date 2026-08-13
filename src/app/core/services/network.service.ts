import { Injectable, inject, signal } from '@angular/core';
import { Network } from '@capacitor/network';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private readonly toastCtrl = inject(ToastController);
  readonly isOnline = signal<boolean>(true);

  constructor() {
    this.initNetworkMonitoring();
  }

  private async initNetworkMonitoring(): Promise<void> {
    try {
      const status = await Network.getStatus();
      this.isOnline.set(status.connected);

      Network.addListener('networkStatusChange', async (st) => {
        this.isOnline.set(st.connected);
        if (!st.connected) {
          const toast = await this.toastCtrl.create({
            message: '⚠️ Sin conexión a Internet. Modo lectura sin conexión activo.',
            duration: 4000,
            color: 'warning',
            position: 'top',
          });
          await toast.present();
        } else {
          const toast = await this.toastCtrl.create({
            message: '🟢 Conexión restablecida.',
            duration: 2500,
            color: 'success',
            position: 'top',
          });
          await toast.present();
        }
      });
    } catch (e) {
      console.warn('Network listener unavailable:', e);
    }
  }
}
