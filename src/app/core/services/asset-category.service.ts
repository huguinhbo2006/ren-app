import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse, AssetCategory } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AssetCategoryService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/asset-categories`;

  readonly categories = signal<AssetCategory[]>([]);

  loadCategories(): Observable<ApiResponse<AssetCategory[]>> {
    return this.http.get<ApiResponse<AssetCategory[]>>(this.api).pipe(
      tap((res) => this.categories.set(res.data)),
    );
  }
}
