import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonBadge,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSkeletonText,
  IonModal,
  IonButtons,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSpinner,
  ActionSheetController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  keyOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  shareSocialOutline,
  calendarOutline,
  closeOutline,
  checkmarkOutline,
  personOutline,
  cubeOutline,
  alertCircleOutline,
  cashOutline,
  cardOutline,
} from 'ionicons/icons';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { RentalService } from '../../core/services/rental.service';
import { AssetService } from '../../core/services/asset.service';
import { CustomerService } from '../../core/services/customer.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';
import type { Asset, Customer, Rental } from '../../shared/models';

@Component({
  selector: 'app-rentals',
  templateUrl: './rentals.page.html',
  styleUrls: ['./rentals.page.scss'],
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
    IonSegment,
    IonSegmentButton,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonBadge,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSkeletonText,
    IonModal,
    IonButtons,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly rentalService = inject(RentalService);
  readonly assetService = inject(AssetService);
  readonly customerService = inject(CustomerService);
  readonly paymentService = inject(PaymentService);
  readonly authService = inject(AuthService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly toastCtrl = inject(ToastController);

  readonly rentals = this.rentalService.rentals;
  readonly loading = this.rentalService.loading;
  readonly customers = this.customerService.customers;
  readonly assets = this.assetService.assets;

  readonly activeTab = signal<'active' | 'completed' | 'all'>('active');
  readonly isModalOpen = signal(false);
  readonly isPaymentModalOpen = signal(false);
  readonly selectedRental = signal<Rental | null>(null);
  readonly isDetailOpen = signal(false);
  readonly saving = signal(false);

  readonly selectedAsset = signal<Asset | null>(null);
  readonly calculatedDays = signal(1);
  readonly basePriceCents = signal(0);

  readonly rentalForm: FormGroup = this.fb.group({
    customer_id: [null, [Validators.required]],
    asset_id: [null, [Validators.required]],
    start_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    end_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    deposit: [0],
    discount: [0],
    notes: [''],
  });

  readonly paymentForm: FormGroup = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    method: ['cash', [Validators.required]],
    reference: [''],
  });

  readonly totalCents = computed(() => {
    const dep = Math.round(parseFloat(this.rentalForm.get('deposit')?.value || 0) * 100);
    const disc = Math.round(parseFloat(this.rentalForm.get('discount')?.value || 0) * 100);
    return Math.max(0, this.basePriceCents() + dep - disc);
  });

  constructor() {
    addIcons({
      'add-outline': addOutline,
      'key-outline': keyOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'share-social-outline': shareSocialOutline,
      'calendar-outline': calendarOutline,
      'close-outline': closeOutline,
      'checkmark-outline': checkmarkOutline,
      'person-outline': personOutline,
      'cube-outline': cubeOutline,
      'alert-circle-outline': alertCircleOutline,
      'cash-outline': cashOutline,
      'card-outline': cardOutline,
    });
  }

  ngOnInit(): void {
    this.customerService.loadCustomers({ is_active: true }).subscribe();
    this.assetService.loadAssets({ status: 'available' }).subscribe();
    this.fetchRentals();

    this.rentalForm.get('asset_id')?.valueChanges.subscribe((id) => {
      if (id) {
        const found = this.assets().find((a) => a.id === parseInt(id, 10)) || null;
        this.selectedAsset.set(found);
        if (found?.deposit_cents) {
          this.rentalForm.patchValue({ deposit: found.deposit_cents / 100 });
        }
        this.recalculate();
      }
    });

    this.rentalForm.get('start_date')?.valueChanges.subscribe(() => this.recalculate());
    this.rentalForm.get('end_date')?.valueChanges.subscribe(() => this.recalculate());
  }

  fetchRentals(): void {
    const tab = this.activeTab();
    const statusParam = tab === 'all' ? undefined : tab;
    this.rentalService.loadRentals({ status: statusParam }).subscribe();
  }

  onTabChange(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.activeTab.set(event.detail.value as 'active' | 'completed' | 'all');
    this.fetchRentals();
  }

  handleRefresh(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    const tab = this.activeTab();
    const statusParam = tab === 'all' ? undefined : tab;
    this.rentalService.loadRentals({ status: statusParam }).subscribe({
      next: () => (event.target as HTMLIonRefresherElement).complete(),
      error: () => (event.target as HTMLIonRefresherElement).complete(),
    });
  }

  private recalculate(): void {
    const startStr = this.rentalForm.get('start_date')?.value;
    const endStr = this.rentalForm.get('end_date')?.value;
    const asset = this.selectedAsset();

    if (!startStr || !endStr || !asset) return;

    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    this.calculatedDays.set(diffDays);

    let base = asset.daily_rate_cents * diffDays;
    if (asset.monthly_rate_cents && diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      const rem = diffDays % 30;
      base = (months * asset.monthly_rate_cents) + (rem * asset.daily_rate_cents);
    } else if (asset.weekly_rate_cents && diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      const rem = diffDays % 7;
      base = (weeks * asset.weekly_rate_cents) + (rem * asset.daily_rate_cents);
    }

    this.basePriceCents.set(base);
  }

  openCreateModal(): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.selectedAsset.set(null);
    this.rentalForm.reset({
      customer_id: null,
      asset_id: null,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      deposit: 0,
      discount: 0,
      notes: '',
    });
    this.isModalOpen.set(true);
  }

  openDetail(rental: Rental): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.selectedRental.set(rental);
    this.isDetailOpen.set(true);
  }

  openPaymentModal(rental: Rental, event?: Event): void {
    event?.stopPropagation();
    void Haptics.impact({ style: ImpactStyle.Light });
    this.selectedRental.set(rental);
    const pending = (rental.pending_balance_cents || 0) / 100;
    this.paymentForm.patchValue({
      amount: pending > 0 ? pending : 0,
      method: 'cash',
      reference: '',
    });
    this.isPaymentModalOpen.set(true);
  }

  closeModals(): void {
    this.isModalOpen.set(false);
    this.isDetailOpen.set(false);
    this.isPaymentModalOpen.set(false);
  }

  async openActionMenu(rental: Rental, event: Event, slidingItem?: IonItemSliding): Promise<void> {
    event.stopPropagation();
    slidingItem?.close();
    void Haptics.impact({ style: ImpactStyle.Light });

    const buttons = [
      {
        text: 'Ver Detalles',
        icon: 'key-outline',
        handler: () => this.openDetail(rental),
      },
      {
        text: 'Registrar Cobro / Abono',
        icon: 'cash-outline',
        handler: () => this.openPaymentModal(rental),
      },
      {
        text: 'Compartir Resumen',
        icon: 'share-social-outline',
        handler: () => this.shareRental(rental),
      },
    ];

    if (rental.status === 'active') {
      buttons.push(
        {
          text: 'Completar y Devolver Activo',
          icon: 'checkmark-circle-outline',
          handler: () => this.completeRental(rental),
        },
        {
          text: 'Cancelar Renta',
          icon: 'close-circle-outline',
          handler: () => this.cancelRental(rental),
        }
      );
    }

    buttons.push({
      text: 'Cerrar',
      icon: 'close-outline',
      handler: () => {},
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: `Contrato ${rental.folio}`,
      buttons,
    });

    await actionSheet.present();
  }

  completeRental(rental: Rental): void {
    void Haptics.impact({ style: ImpactStyle.Medium });
    this.rentalService.completeRental(rental.id).subscribe({
      next: async () => {
        this.isDetailOpen.set(false);
        void Haptics.notification({ type: NotificationType.Success });
        const toast = await this.toastCtrl.create({
          message: 'Renta completada y bien devuelto.',
          duration: 2500,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }

  cancelRental(rental: Rental): void {
    void Haptics.impact({ style: ImpactStyle.Medium });
    this.rentalService.cancelRental(rental.id).subscribe({
      next: async () => {
        this.isDetailOpen.set(false);
        void Haptics.notification({ type: NotificationType.Warning });
        const toast = await this.toastCtrl.create({
          message: 'Contrato de renta cancelado.',
          duration: 2500,
          color: 'warning',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }

  async shareRental(rental: Rental): Promise<void> {
    try {
      await Share.share({
        title: `Contrato ${rental.folio} - Rentame`,
        text: `Contrato de renta ${rental.folio}\nCliente: ${rental.customer?.name}\nActivo: ${rental.asset?.name}\nPeriodo: ${rental.start_date} al ${rental.end_date}\nTotal: $${(rental.total_amount_cents / 100).toFixed(2)} MXN`,
        dialogTitle: 'Compartir Contrato',
      });
    } catch (e) {
      console.warn('Share cancelled:', e);
    }
  }

  saveRental(): void {
    if (this.rentalForm.invalid || this.saving()) {
      void Haptics.notification({ type: NotificationType.Warning });
      this.rentalForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    void Haptics.impact({ style: ImpactStyle.Medium });

    const fv = this.rentalForm.value;
    const payload = {
      customer_id: parseInt(fv.customer_id, 10),
      asset_id: parseInt(fv.asset_id, 10),
      start_date: fv.start_date,
      end_date: fv.end_date,
      deposit_cents: Math.round(parseFloat(fv.deposit || 0) * 100),
      discount_cents: Math.round(parseFloat(fv.discount || 0) * 100),
      notes: fv.notes || null,
    };

    this.rentalService.createRental(payload).subscribe({
      next: async () => {
        this.saving.set(false);
        this.isModalOpen.set(false);
        void Haptics.notification({ type: NotificationType.Success });
        const toast = await this.toastCtrl.create({
          message: 'Contrato de renta generado exitosamente.',
          duration: 2500,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
      },
      error: async (err) => {
        this.saving.set(false);
        void Haptics.notification({ type: NotificationType.Error });
        const message = err.error?.message || 'Error al generar el contrato.';
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

  savePayment(): void {
    const rental = this.selectedRental();
    if (!rental || this.paymentForm.invalid || this.saving()) return;

    this.saving.set(true);
    void Haptics.impact({ style: ImpactStyle.Medium });

    const fv = this.paymentForm.value;
    const payload = {
      rental_id: rental.id,
      amount_cents: Math.round(parseFloat(fv.amount) * 100),
      method: fv.method,
      reference: fv.reference || null,
    };

    this.paymentService.createPayment(payload).subscribe({
      next: async () => {
        this.saving.set(false);
        this.isPaymentModalOpen.set(false);
        this.fetchRentals();
        void Haptics.notification({ type: NotificationType.Success });
        const toast = await this.toastCtrl.create({
          message: 'Cobro registrado correctamente.',
          duration: 2500,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
      },
      error: async (err) => {
        this.saving.set(false);
        void Haptics.notification({ type: NotificationType.Error });
        const message = err.error?.message || 'Error al registrar el cobro.';
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
