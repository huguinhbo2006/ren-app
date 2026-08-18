import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSkeletonText,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  cardOutline,
  swapHorizontalOutline,
  addOutline,
  closeOutline,
  checkmarkOutline,
  receiptOutline,
  personOutline,
  calendarOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { PaymentService } from '../../core/services/payment.service';
import { RentalService } from '../../core/services/rental.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';
import type { Payment, Rental } from '../../shared/models';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyMxnPipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonButton,
    IonButtons,
    IonBackButton,
    IonSkeletonText,
    IonModal,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly paymentService = inject(PaymentService);
  readonly rentalService = inject(RentalService);
  private readonly toastCtrl = inject(ToastController);

  readonly payments = this.paymentService.payments;
  readonly loading = this.paymentService.loading;
  readonly rentals = this.rentalService.rentals;

  readonly isModalOpen = signal(false);
  readonly saving = signal(false);

  readonly paymentForm: FormGroup = this.fb.group({
    rental_id: [null, [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    method: ['cash', [Validators.required]],
    reference: [''],
    notes: [''],
  });

  constructor() {
    addIcons({
      'cash-outline': cashOutline,
      'card-outline': cardOutline,
      'swap-horizontal-outline': swapHorizontalOutline,
      'add-outline': addOutline,
      'close-outline': closeOutline,
      'checkmark-outline': checkmarkOutline,
      'receipt-outline': receiptOutline,
      'person-outline': personOutline,
      'calendar-outline': calendarOutline,
    });
  }

  ngOnInit(): void {
    this.loadPayments();
    this.rentalService.loadRentals({ status: 'active' }).subscribe();
  }

  loadPayments(): void {
    this.paymentService.loadPayments().subscribe();
  }

  handleRefresh(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.paymentService.loadPayments().subscribe({
      next: () => (event.target as HTMLIonRefresherElement).complete(),
      error: () => (event.target as HTMLIonRefresherElement).complete(),
    });
  }

  openCreateModal(): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.paymentForm.reset({
      rental_id: null,
      amount: 0,
      method: 'cash',
      reference: '',
      notes: '',
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  savePayment(): void {
    if (this.paymentForm.invalid || this.saving()) {
      void Haptics.notification({ type: NotificationType.Warning });
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    void Haptics.impact({ style: ImpactStyle.Medium });

    const fv = this.paymentForm.value;
    const payload = {
      rental_id: parseInt(fv.rental_id, 10),
      amount_cents: Math.round(parseFloat(fv.amount) * 100),
      method: fv.method,
      reference: fv.reference || null,
      notes: fv.notes || null,
    };

    this.paymentService.createPayment(payload).subscribe({
      next: async () => {
        this.saving.set(false);
        this.isModalOpen.set(false);
        void Haptics.notification({ type: NotificationType.Success });
        const toast = await this.toastCtrl.create({
          message: 'Pago registrado exitosamente.',
          duration: 2500,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
      },
      error: async (err) => {
        this.saving.set(false);
        void Haptics.notification({ type: NotificationType.Error });
        const message = err.error?.message || 'Error al registrar el pago.';
        const toast = await this.toastCtrl.create({
          message,
          duration: 3500,
          color: 'danger',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }

  getMethodBadgeColor(method: string): string {
    switch (method) {
      case 'cash': return 'success';
      case 'transfer': return 'primary';
      case 'card': return 'tertiary';
      default: return 'medium';
    }
  }

  getMethodLabel(method: string): string {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'transfer': return 'Transferencia';
      case 'card': return 'Tarjeta';
      case 'check': return 'Cheque';
      default: return 'Otro';
    }
  }
}
