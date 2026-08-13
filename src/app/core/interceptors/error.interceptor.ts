import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const toastCtrl = inject(ToastController);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearSession();
        router.navigate(['/login'], { replaceUrl: true });
      } else if (error.status === 0) {
        toastCtrl.create({
          message: 'Sin conexión con el servidor. Verifica tu internet.',
          duration: 3000,
          color: 'danger',
          position: 'bottom',
        }).then(t => t.present());
      }

      return throwError(() => error);
    }),
  );
};
