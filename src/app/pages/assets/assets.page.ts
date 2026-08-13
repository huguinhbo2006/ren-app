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
  IonThumbnail,
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
  cubeOutline,
  pricetagOutline,
  cameraOutline,
  trashOutline,
  createOutline,
  ellipsisVertical,
  closeOutline,
  checkmarkOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { AssetService } from '../../core/services/asset.service';
import { AssetCategoryService } from '../../core/services/asset-category.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';
import type { Asset, AssetCategory } from '../../shared/models';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.page.html',
  styleUrls: ['./assets.page.scss'],
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
    IonThumbnail,
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
export class AssetsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly assetService = inject(AssetService);
  readonly categoryService = inject(AssetCategoryService);
  readonly authService = inject(AuthService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly toastCtrl = inject(ToastController);

  readonly assets = this.assetService.assets;
  readonly loading = this.assetService.loading;
  readonly categories = this.categoryService.categories;

  readonly isModalOpen = signal(false);
  readonly editingAsset = signal<Asset | null>(null);
  readonly capturedPhotoBlob = signal<Blob | null>(null);
  readonly capturedPhotoUrl = signal<string | null>(null);
  readonly saving = signal(false);
  readonly searchTerm = signal('');

  readonly assetForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category_id: [null],
    daily_rate: [0, [Validators.required, Validators.min(0)]],
    weekly_rate: [0],
    monthly_rate: [0],
    deposit: [0],
    status: ['available', [Validators.required]],
    location: [''],
    description: [''],
    serial_number: [''],
  });

  constructor() {
    addIcons({
      'add-outline': addOutline,
      'cube-outline': cubeOutline,
      'pricetag-outline': pricetagOutline,
      'camera-outline': cameraOutline,
      'trash-outline': trashOutline,
      'create-outline': createOutline,
      'ellipsis-vertical': ellipsisVertical,
      'close-outline': closeOutline,
      'checkmark-outline': checkmarkOutline,
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.categoryService.loadCategories().subscribe();
    this.fetchAssets();
  }

  fetchAssets(): void {
    this.assetService.loadAssets({
      search: this.searchTerm() || undefined,
    }).subscribe();
  }

  handleRefresh(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.assetService.loadAssets({ search: this.searchTerm() || undefined }).subscribe({
      next: () => (event.target as HTMLIonRefresherElement).complete(),
      error: () => (event.target as HTMLIonRefresherElement).complete(),
    });
  }

  onSearchChange(event: CustomEvent): void {
    const val = event.detail.value || '';
    this.searchTerm.set(val);
    this.fetchAssets();
  }

  openCreateModal(): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.editingAsset.set(null);
    this.capturedPhotoBlob.set(null);
    this.capturedPhotoUrl.set(null);
    this.assetForm.reset({
      name: '',
      category_id: null,
      daily_rate: 0,
      weekly_rate: 0,
      monthly_rate: 0,
      deposit: 0,
      status: 'available',
      location: '',
      description: '',
      serial_number: '',
    });
    this.isModalOpen.set(true);
  }

  openEditModal(asset: Asset): void {
    this.editingAsset.set(asset);
    this.capturedPhotoBlob.set(null);
    this.capturedPhotoUrl.set(asset.primary_image || null);
    this.assetForm.patchValue({
      name: asset.name,
      category_id: asset.category_id,
      daily_rate: asset.daily_rate_cents / 100,
      weekly_rate: (asset.weekly_rate_cents || 0) / 100,
      monthly_rate: (asset.monthly_rate_cents || 0) / 100,
      deposit: (asset.deposit_cents || 0) / 100,
      status: asset.status,
      location: asset.location || '',
      description: asset.description || '',
      serial_number: asset.serial_number || '',
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  async takePhoto(): Promise<void> {
    void Haptics.impact({ style: ImpactStyle.Medium });

    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
      });

      if (photo.webPath) {
        this.capturedPhotoUrl.set(photo.webPath);
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        this.capturedPhotoBlob.set(blob);
      }
    } catch (e) {
      console.warn('Camera dismissed or cancelled:', e);
    }
  }

  async openActionMenu(asset: Asset, event: Event): Promise<void> {
    event.stopPropagation();
    void Haptics.impact({ style: ImpactStyle.Light });

    const actionSheet = await this.actionSheetCtrl.create({
      header: asset.name,
      buttons: [
        {
          text: 'Editar Activo',
          icon: 'create-outline',
          handler: () => this.openEditModal(asset),
        },
        {
          text: 'Eliminar Activo',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => this.confirmDelete(asset),
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close-outline',
        },
      ],
    });

    await actionSheet.present();
  }

  private confirmDelete(asset: Asset): void {
    this.assetService.deleteAsset(asset.id).subscribe({
      next: async () => {
        void Haptics.notification({ type: NotificationType.Success });
        const toast = await this.toastCtrl.create({
          message: 'Activo eliminado correctamente',
          duration: 2000,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
      },
    });
  }

  async saveAsset(): Promise<void> {
    if (this.assetForm.invalid || this.saving()) {
      void Haptics.notification({ type: NotificationType.Warning });
      this.assetForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    void Haptics.impact({ style: ImpactStyle.Medium });

    const fv = this.assetForm.value;
    const payload: Partial<Asset> = {
      name: fv.name,
      category_id: fv.category_id ? parseInt(fv.category_id, 10) : null,
      serial_number: fv.serial_number || null,
      daily_rate_cents: Math.round(parseFloat(fv.daily_rate) * 100),
      weekly_rate_cents: Math.round(parseFloat(fv.weekly_rate || 0) * 100),
      monthly_rate_cents: Math.round(parseFloat(fv.monthly_rate || 0) * 100),
      deposit_cents: Math.round(parseFloat(fv.deposit || 0) * 100),
      status: fv.status,
      location: fv.location || null,
      description: fv.description || null,
    };

    const isEdit = !!this.editingAsset();
    const action$ = isEdit
      ? this.assetService.updateAsset(this.editingAsset()!.id, payload)
      : this.assetService.createAsset(payload);

    action$.subscribe({
      next: async (res) => {
        const savedAsset = res.data;
        const photoBlob = this.capturedPhotoBlob();

        if (photoBlob && savedAsset.id) {
          this.assetService.uploadPhoto(savedAsset.id, photoBlob).subscribe({
            next: () => this.finalizeSave('Activo guardado exitosamente.'),
            error: () => this.finalizeSave('Activo guardado, pero no se pudo subir la foto.'),
          });
        } else {
          this.finalizeSave('Activo guardado exitosamente.');
        }
      },
      error: async (err) => {
        this.saving.set(false);
        void Haptics.notification({ type: NotificationType.Error });
        const message = err.error?.message || 'Error al guardar el activo.';
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

  private async finalizeSave(message: string): Promise<void> {
    this.saving.set(false);
    this.isModalOpen.set(false);
    void Haptics.notification({ type: NotificationType.Success });
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
  }

  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'available': return 'success';
      case 'rented': return 'primary';
      case 'maintenance': return 'warning';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'available': return 'Disponible';
      case 'rented': return 'En Renta';
      case 'maintenance': return 'Mantenimiento';
      default: return 'Inactivo';
    }
  }
}
