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
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  buildOutline,
  constructOutline,
  cartOutline,
  cashOutline,
  cameraOutline,
  imageOutline,
  trashOutline,
  closeOutline,
  checkmarkOutline,
  documentAttachOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { ExpenseService } from '../../core/services/expense.service';
import { AssetService } from '../../core/services/asset.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';
import type { Asset, Expense } from '../../shared/models';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss'],
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
    IonSpinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly expenseService = inject(ExpenseService);
  readonly assetService = inject(AssetService);
  private readonly toastCtrl = inject(ToastController);

  readonly expenses = this.expenseService.expenses;
  readonly loading = this.expenseService.loading;
  readonly assets = this.assetService.assets;

  readonly activeTab = signal<'all' | 'maintenance' | 'repair' | 'purchase' | 'other'>('all');
  readonly isModalOpen = signal(false);
  readonly saving = signal(false);
  readonly receiptBase64 = signal<string | null>(null);

  readonly expenseForm: FormGroup = this.fb.group({
    asset_id: [null],
    category: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    expense_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    vendor: [''],
    type: ['maintenance', [Validators.required]],
  });

  constructor() {
    addIcons({
      'add-outline': addOutline,
      'build-outline': buildOutline,
      'construct-outline': constructOutline,
      'cart-outline': cartOutline,
      'cash-outline': cashOutline,
      'camera-outline': cameraOutline,
      'image-outline': imageOutline,
      'trash-outline': trashOutline,
      'close-outline': closeOutline,
      'checkmark-outline': checkmarkOutline,
      'document-attach-outline': documentAttachOutline,
    });
  }

  ngOnInit(): void {
    this.assetService.loadAssets().subscribe();
    this.fetchExpenses();
  }

  fetchExpenses(): void {
    const tab = this.activeTab();
    const typeParam = tab === 'all' ? undefined : tab;
    this.expenseService.loadExpenses({ type: typeParam }).subscribe();
  }

  onTabChange(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.activeTab.set(event.detail.value);
    this.fetchExpenses();
  }

  handleRefresh(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    const tab = this.activeTab();
    const typeParam = tab === 'all' ? undefined : tab;
    this.expenseService.loadExpenses({ type: typeParam }).subscribe({
      next: () => (event.target as HTMLIonRefresherElement).complete(),
      error: () => (event.target as HTMLIonRefresherElement).complete(),
    });
  }

  openCreateModal(): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.receiptBase64.set(null);
    this.expenseForm.reset({
      asset_id: null,
      category: '',
      description: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      vendor: '',
      type: 'maintenance',
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  async takeReceiptPhoto(): Promise<void> {
    void Haptics.impact({ style: ImpactStyle.Light });
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      });

      if (image.dataUrl) {
        this.receiptBase64.set(image.dataUrl);
      }
    } catch (e) {
      console.warn('Camera action cancelled:', e);
    }
  }

  saveExpense(): void {
    if (this.expenseForm.invalid || this.saving()) {
      void Haptics.notification({ type: NotificationType.Warning });
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    void Haptics.impact({ style: ImpactStyle.Medium });

    const fv = this.expenseForm.value;
    const formData = new FormData();

    if (fv.asset_id) formData.append('asset_id', fv.asset_id);
    formData.append('category', fv.category);
    formData.append('description', fv.description);
    formData.append('amount_cents', Math.round(parseFloat(fv.amount) * 100).toString());
    formData.append('expense_date', fv.expense_date);
    if (fv.vendor) formData.append('vendor', fv.vendor);
    formData.append('type', fv.type);

    const b64 = this.receiptBase64();
    if (b64) {
      const blob = this.dataURItoBlob(b64);
      formData.append('receipt', blob, 'ticket.jpg');
    }

    this.expenseService.createExpense(formData).subscribe({
      next: async () => {
        this.saving.set(false);
        this.isModalOpen.set(false);
        void Haptics.notification({ type: NotificationType.Success });
        const toast = await this.toastCtrl.create({
          message: 'Egreso registrado exitosamente.',
          duration: 2500,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
      },
      error: async (err) => {
        this.saving.set(false);
        void Haptics.notification({ type: NotificationType.Error });
        const message = err.error?.message || 'Error al guardar el egreso.';
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

  deleteExpense(expense: Expense): void {
    void Haptics.impact({ style: ImpactStyle.Medium });
    this.expenseService.deleteExpense(expense.id).subscribe({
      next: async () => {
        void Haptics.notification({ type: NotificationType.Warning });
        const toast = await this.toastCtrl.create({
          message: 'Egreso eliminado.',
          duration: 2000,
          color: 'warning',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }

  getTypeBadge(type: string): { label: string; color: string } {
    switch (type) {
      case 'maintenance': return { label: 'Mantenimiento', color: 'primary' };
      case 'repair': return { label: 'Reparación', color: 'danger' };
      case 'purchase': return { label: 'Adquisición', color: 'success' };
      default: return { label: 'General', color: 'medium' };
    }
  }

  private dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }
}
