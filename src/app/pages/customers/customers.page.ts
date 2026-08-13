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
  IonSearchbar,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonAvatar,
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
  IonTextarea,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  personOutline,
  callOutline,
  logoWhatsapp,
  mailOutline,
  documentTextOutline,
  trashOutline,
  createOutline,
  closeOutline,
  checkmarkOutline,
  cardOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { CustomerService, CustomerStatement } from '../../core/services/customer.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';
import type { Customer } from '../../shared/models';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
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
    IonSearchbar,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonAvatar,
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
    IonTextarea,
    IonSpinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly customerService = inject(CustomerService);
  readonly authService = inject(AuthService);
  private readonly toastCtrl = inject(ToastController);

  readonly customers = this.customerService.customers;
  readonly loading = this.customerService.loading;

  readonly isFormModalOpen = signal(false);
  readonly isStatementModalOpen = signal(false);
  readonly editingCustomer = signal<Customer | null>(null);
  readonly selectedStatement = signal<CustomerStatement | null>(null);
  readonly loadingStatement = signal(false);
  readonly saving = signal(false);
  readonly searchTerm = signal('');

  readonly customerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9+() -]{10,20}$')]],
    email: ['', [Validators.email]],
    rfc: [''],
    address: [''],
    notes: [''],
  });

  constructor() {
    addIcons({
      'add-outline': addOutline,
      'person-outline': personOutline,
      'call-outline': callOutline,
      'logo-whatsapp': logoWhatsapp,
      'mail-outline': mailOutline,
      'document-text-outline': documentTextOutline,
      'trash-outline': trashOutline,
      'create-outline': createOutline,
      'close-outline': closeOutline,
      'checkmark-outline': checkmarkOutline,
      'card-outline': cardOutline,
    });
  }

  ngOnInit(): void {
    this.fetchCustomers();
  }

  fetchCustomers(): void {
    this.customerService.loadCustomers({
      search: this.searchTerm() || undefined,
    }).subscribe();
  }

  handleRefresh(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.customerService.loadCustomers({ search: this.searchTerm() || undefined }).subscribe({
      next: () => (event.target as HTMLIonRefresherElement).complete(),
      error: () => (event.target as HTMLIonRefresherElement).complete(),
    });
  }

  onSearchChange(event: CustomEvent): void {
    const val = event.detail.value || '';
    this.searchTerm.set(val);
    this.fetchCustomers();
  }

  openCreateModal(): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.editingCustomer.set(null);
    this.customerForm.reset({
      name: '',
      phone: '',
      email: '',
      rfc: '',
      address: '',
      notes: '',
    });
    this.isFormModalOpen.set(true);
  }

  openEditModal(customer: Customer, slidingItem?: IonItemSliding): void {
    slidingItem?.close();
    void Haptics.impact({ style: ImpactStyle.Light });
    this.editingCustomer.set(customer);
    this.customerForm.patchValue({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      rfc: customer.rfc || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    this.isFormModalOpen.set(true);
  }

  openStatementModal(customer: Customer): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.loadingStatement.set(true);
    this.isStatementModalOpen.set(true);

    this.customerService.getCustomerStatement(customer.id).subscribe({
      next: (res) => {
        this.selectedStatement.set(res.data);
        this.loadingStatement.set(false);
      },
      error: () => {
        this.loadingStatement.set(false);
      },
    });
  }

  closeModals(): void {
    this.isFormModalOpen.set(false);
    this.isStatementModalOpen.set(false);
  }

  deleteCustomer(customer: Customer, slidingItem?: IonItemSliding): void {
    slidingItem?.close();
    void Haptics.impact({ style: ImpactStyle.Medium });

    this.customerService.deleteCustomer(customer.id).subscribe({
      next: async () => {
        void Haptics.notification({ type: NotificationType.Success });
        const toast = await this.toastCtrl.create({
          message: 'Cliente eliminado correctamente',
          duration: 2000,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }

  saveCustomer(): void {
    if (this.customerForm.invalid || this.saving()) {
      void Haptics.notification({ type: NotificationType.Warning });
      this.customerForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    void Haptics.impact({ style: ImpactStyle.Medium });

    const fv = this.customerForm.value;
    const payload: Partial<Customer> = {
      name: fv.name,
      phone: fv.phone,
      email: fv.email || null,
      rfc: fv.rfc ? fv.rfc.toUpperCase() : null,
      address: fv.address || null,
      notes: fv.notes || null,
      is_active: true,
    };

    const isEdit = !!this.editingCustomer();
    const action$ = isEdit
      ? this.customerService.updateCustomer(this.editingCustomer()!.id, payload)
      : this.customerService.createCustomer(payload);

    action$.subscribe({
      next: async () => {
        this.saving.set(false);
        this.isFormModalOpen.set(false);
        void Haptics.notification({ type: NotificationType.Success });
        const toast = await this.toastCtrl.create({
          message: isEdit ? 'Cliente actualizado.' : 'Cliente registrado exitosamente.',
          duration: 2500,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
      },
      error: async (err) => {
        this.saving.set(false);
        void Haptics.notification({ type: NotificationType.Error });
        const message = err.error?.message || 'Error al guardar los datos del cliente.';
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

  getCleanPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 ? `52${digits}` : digits;
  }
}
