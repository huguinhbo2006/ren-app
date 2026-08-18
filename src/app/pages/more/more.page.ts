import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButton,
  IonButtons,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  businessOutline,
  starOutline,
  lockClosedOutline,
  logOutOutline,
  notificationsOutline,
  checkmarkOutline,
  closeOutline,
  barChartOutline,
  cashOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { AuthService } from '../../core/auth/auth.service';
import { SettingService } from '../../core/services/setting.service';

@Component({
  selector: 'app-more',
  templateUrl: './more.page.html',
  styleUrls: ['./more.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonButtons,
    IonModal,
    IonInput,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MorePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  readonly settingService = inject(SettingService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);

  readonly currentUser = this.authService.currentUser;
  readonly planUsage = this.settingService.planUsage;
  readonly settings = this.settingService.settings;

  readonly isSettingsModalOpen = signal(false);
  readonly saving = signal(false);

  readonly settingsForm: FormGroup = this.fb.group({
    business_name: ['', [Validators.required]],
    business_rfc: [''],
    business_phone: [''],
    business_address: [''],
    notification_days_before: ['3'],
  });

  constructor() {
    addIcons({
      'person-circle-outline': personCircleOutline,
      'business-outline': businessOutline,
      'star-outline': starOutline,
      'lock-closed-outline': lockClosedOutline,
      'log-out-outline': logOutOutline,
      'notifications-outline': notificationsOutline,
      'checkmark-outline': checkmarkOutline,
      'close-outline': closeOutline,
      'bar-chart-outline': barChartOutline,
      'cash-outline': cashOutline,
    });
  }

  ngOnInit(): void {
    this.settingService.loadPlanUsage().subscribe();
    this.settingService.loadSettings().subscribe((res) => {
      this.settingsForm.patchValue(res.data);
    });
  }

  openSettingsModal(): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.isSettingsModalOpen.set(true);
  }

  closeModal(): void {
    this.isSettingsModalOpen.set(false);
  }

  saveSettings(): void {
    if (this.settingsForm.invalid || this.saving()) return;

    this.saving.set(true);
    void Haptics.impact({ style: ImpactStyle.Medium });

    this.settingService.updateSettings(this.settingsForm.value).subscribe({
      next: async () => {
        this.saving.set(false);
        this.isSettingsModalOpen.set(false);
        void Haptics.notification({ type: NotificationType.Success });
        const toast = await this.toastCtrl.create({
          message: 'Configuración guardada correctamente.',
          duration: 2500,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
      },
      error: async () => {
        this.saving.set(false);
        void Haptics.notification({ type: NotificationType.Error });
      },
    });
  }

  async upgradeToPro(): Promise<void> {
    void Haptics.impact({ style: ImpactStyle.Medium });
    const alert = await this.alertCtrl.create({
      header: 'Plan Pro ($499 MXN/mes)',
      message: 'Desbloquea inventario de activos ilimitado, clientes ilimitados, contratos ilimitados y reportes financieros avanzados.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Activar Pro',
          handler: () => {
            this.settingService.subscribeToPlan('pro').subscribe({
              next: async () => {
                void Haptics.notification({ type: NotificationType.Success });
                this.authService.me().subscribe();
                const toast = await this.toastCtrl.create({
                  message: '¡Plan Pro activado exitosamente!',
                  duration: 3000,
                  color: 'success',
                  position: 'bottom',
                });
                await toast.present();
              },
            });
          },
        },
      ],
    });

    await alert.present();
  }

  async logout(): Promise<void> {
    void Haptics.impact({ style: ImpactStyle.Light });
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas salir de tu cuenta?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: () => {
            void Haptics.notification({ type: NotificationType.Warning });
            this.authService.logout().subscribe();
          },
        },
      ],
    });

    await alert.present();
  }
}
