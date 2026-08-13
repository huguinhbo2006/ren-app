import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../auth/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getToken();

  if (!token || !req.url.includes('/api/')) {
    return next(req);
  }

  const authReq = req.clone({
    headers: req.headers
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json'),
  });

  return next(authReq);
};
