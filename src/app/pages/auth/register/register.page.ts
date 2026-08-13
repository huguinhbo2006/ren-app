import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, callOutline, personAddOutline, checkmarkCircle } from 'ionicons/icons';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { AuthService } from '../../../core/auth/auth.service';

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('password_confirmation')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  readonly selectedPlan = signal<'free' | 'pro'>('free');
  readonly loading = signal(false);
  readonly showPassword = signal(false);

  readonly registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern('^[0-9+() -]{10,20}$')]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
  }, { validators: passwordMatchValidator });

  constructor() {
    addIcons({
      'person-outline': personOutline,
      'mail-outline': mailOutline,
      'lock-closed-outline': lockClosedOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'call-outline': callOutline,
      'person-add-outline': personAddOutline,
      'checkmark-circle': checkmarkCircle,
    });
  }

  onPlanSegmentChange(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.selectedPlan.set(event.detail.value as 'free' | 'pro');
  }

  togglePasswordVisibility(): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.showPassword.update((v) => !v);
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid || this.loading()) {
      void Haptics.notification({ type: NotificationType.Warning });
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    void Haptics.impact({ style: ImpactStyle.Medium });

    const { name, email, phone, password, password_confirmation } = this.registerForm.value;

    this.authService.register({
      name,
      email,
      password,
      password_confirmation,
    }).subscribe({
      next: async () => {
        this.loading.set(false);
        void Haptics.notification({ type: NotificationType.Success });
        this.router.navigate(['/tabs/rentals'], { replaceUrl: true });
      },
      error: async (err) => {
        this.loading.set(false);
        void Haptics.notification({ type: NotificationType.Error });

        const errorsObj = err.error?.errors as Record<string, string[]> | undefined;
        let errorDetail = err.error?.message || 'Error al registrar la cuenta.';

        if (errorsObj) {
          errorDetail = Object.keys(errorsObj)
            .map((k) => errorsObj[k].join(', '))
            .join(' ');
        }

        const toast = await this.toastCtrl.create({
          message: errorDetail,
          duration: 3500,
          color: 'danger',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }
}
