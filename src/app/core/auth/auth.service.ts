import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, map } from 'rxjs/operators';
import { Observable, from } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import type {
  User,
  AuthTokenResponse,
  ApiResponse,
} from '../../shared/models';

/**
 * AuthService (Ionic Mobile)
 *
 * Maneja el estado de autenticación con Signals y Capacitor Preferences.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly api = environment.apiUrl;

  readonly currentUser = signal<User | null>(
    this.tokenService.getUser<User>()
  );

  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userPlan = computed(() => this.currentUser()?.plan ?? null);
  readonly planSlug = computed(() => this.userPlan()?.slug ?? 'free');
  readonly isPro = computed(() => this.planSlug() === 'pro');

  login(email: string, password: string): Observable<AuthTokenResponse> {
    return this.http
      .post<ApiResponse<AuthTokenResponse>>(`${this.api}/auth/login`, {
        email,
        password,
      })
      .pipe(
        map((res) => res.data),
        tap((data) => this.handleAuthSuccess(data)),
      );
  }

  register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<AuthTokenResponse> {
    return this.http
      .post<ApiResponse<AuthTokenResponse>>(`${this.api}/auth/register`, payload)
      .pipe(
        map((res) => res.data),
        tap((data) => this.handleAuthSuccess(data)),
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.api}/auth/logout`, {})
      .pipe(
        tap(() => this.clearSession()),
        map(() => undefined),
      );
  }

  me(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.api}/auth/me`)
      .pipe(
        map((res) => res.data),
        tap((user) => {
          this.currentUser.set(user);
          void this.tokenService.saveUser(user);
        }),
      );
  }

  hasFeature(feature: keyof NonNullable<User['plan']>['features'] | string): boolean {
    const features = this.userPlan()?.features as Record<string, boolean> | undefined;
    return !!(features?.[feature]);
  }

  clearSession(): void {
    void this.tokenService.clearAll();
    this.currentUser.set(null);
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private handleAuthSuccess(data: AuthTokenResponse): void {
    void this.tokenService.saveToken(data.token);
    void this.tokenService.saveUser(data.user);
    this.currentUser.set(data.user);
  }
}
