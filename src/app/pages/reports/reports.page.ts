import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSkeletonText,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cashOutline,
  walletOutline,
  trendingUpOutline,
  alertCircleOutline,
  cubeOutline,
  downloadOutline,
  refreshOutline,
  calendarOutline,
  personOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ReportService } from '../../core/services/report.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyMxnPipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonButton,
    IonButtons,
    IonBackButton,
    IonSkeletonText,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  readonly reportService = inject(ReportService);

  readonly balance = this.reportService.balance;
  readonly receivable = this.reportService.receivable;
  readonly utilization = this.reportService.utilization;
  readonly assetRoi = this.reportService.assetRoi;
  readonly loading = this.reportService.loading;

  readonly activeTab = signal<'balance' | 'receivable' | 'utilization' | 'roi'>('balance');

  constructor() {
    addIcons({
      'bar-chart-outline': barChartOutline,
      'cash-outline': cashOutline,
      'wallet-outline': walletOutline,
      'trending-up-outline': trendingUpOutline,
      'alert-circle-outline': alertCircleOutline,
      'cube-outline': cubeOutline,
      'download-outline': downloadOutline,
      'refresh-outline': refreshOutline,
      'calendar-outline': calendarOutline,
      'person-outline': personOutline,
      'chevron-forward-outline': chevronForwardOutline,
    });
  }

  ngOnInit(): void {
    this.loadActiveReport();
  }

  onTabChange(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.activeTab.set(event.detail.value as 'balance' | 'receivable' | 'utilization' | 'roi');
    this.loadActiveReport();
  }

  handleRefresh(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.loadActiveReport();
    setTimeout(() => {
      (event.target as HTMLIonRefresherElement).complete();
    }, 800);
  }

  loadActiveReport(): void {
    const tab = this.activeTab();
    if (tab === 'balance') this.reportService.loadBalance().subscribe();
    else if (tab === 'receivable') this.reportService.loadReceivable().subscribe();
    else if (tab === 'utilization') this.reportService.loadUtilization().subscribe();
    else if (tab === 'roi') this.reportService.loadAssetRoi().subscribe();
  }

  exportPdf(type: string): void {
    void Haptics.impact({ style: ImpactStyle.Medium });
    this.reportService.exportPdf(type);
  }

  getUrgencyColor(urgency: string): string {
    if (urgency === 'overdue') return 'danger';
    if (urgency === 'soon') return 'warning';
    return 'success';
  }
}
