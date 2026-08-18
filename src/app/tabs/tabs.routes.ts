import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'rentals',
        loadComponent: () =>
          import('../pages/rentals/rentals.page').then((m) => m.RentalsPage),
      },
      {
        path: 'assets',
        loadComponent: () =>
          import('../pages/assets/assets.page').then((m) => m.AssetsPage),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('../pages/customers/customers.page').then((m) => m.CustomersPage),
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('../pages/expenses/expenses.page').then((m) => m.ExpensesPage),
      },
      {
        path: 'more',
        loadComponent: () =>
          import('../pages/more/more.page').then((m) => m.MorePage),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('../pages/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('../pages/payments/payments.page').then((m) => m.PaymentsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/rentals',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/rentals',
    pathMatch: 'full',
  },
];
