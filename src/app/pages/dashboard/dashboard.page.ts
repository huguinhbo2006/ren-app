import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSkeletonText,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  keyOutline,
  hourglassOutline,
  walletOutline,
  addOutline,
  calendarOutline,
  arrowForwardOutline,
  personOutline,
  cubeOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyMxnPipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSkeletonText,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  readonly dashboardService = inject(DashboardService);
  readonly authService = inject(AuthService);

  readonly data = this.dashboardService.data;
  readonly loading = this.dashboardService.loading;
  readonly currentUser = this.authService.currentUser;

  constructor() {
    addIcons({
      'cash-outline': cashOutline,
      'key-outline': keyOutline,
      'hourglass-outline': hourglassOutline,
      'wallet-outline': walletOutline,
      'add-outline': addOutline,
      'calendar-outline': calendarOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'person-outline': personOutline,
      'cube-outline': cubeOutline,
      'trending-up-outline': trendingUpOutline,
    });
  }

  ngOnInit(): void {
    this.dashboardService.loadDashboard().subscribe();
  }

  handleRefresh(event: CustomEvent): void {
    void Haptics.impact({ style: ImpactStyle.Light });
    this.dashboardService.loadDashboard().subscribe({
      next: () => (event.target as HTMLIonRefresherElement).complete(),
      error: () => (event.target as HTMLIonRefresherElement).complete(),
    });
  }

  getUrgencyColor(days: number): string {
    if (days === 0) return 'danger';
    if (days === 1) return 'warning';
    return 'primary';
  }

  getMaxChartValue(data: { income_cents: number; expenses_cents: number }[]): number {
    let max = 1;
    for (const item of data) {
      if (item.income_cents > max) max = item.income_cents;
      if (item.expenses_cents > max) max = item.expenses_cents;
    }
    return max;
  }
}
