import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logInOutline, keyOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonCard,
    IonCardContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly showPassword = signal(false);

  constructor() {
    addIcons({
      'mail-outline': mailOutline,
      'lock-closed-outline': lockClosedOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'log-in-outline': logInOutline,
      'key-outline': keyOutline,
    });
  }

  togglePasswordVisibility(): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.showPassword.update((v) => !v);
  }

  async setQuickUser(email: string): Promise<void> {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.loginForm.patchValue({
      email,
      password: 'password123',
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid || this.loading()) {
      void Haptics.notification({ type: NotificationType.Warning });
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    void Haptics.impact({ style: ImpactStyle.Medium });

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: async () => {
        this.loading.set(false);
        void Haptics.notification({ type: NotificationType.Success });
        this.router.navigate(['/tabs/rentals'], { replaceUrl: true });
      },
      error: async (err) => {
        this.loading.set(false);
        void Haptics.notification({ type: NotificationType.Error });

        const message =
          err.error?.message || 'Credenciales incorrectas o error de conexión.';

        const toast = await this.toastCtrl.create({
          message,
          duration: 3000,
          color: 'danger',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }
}
