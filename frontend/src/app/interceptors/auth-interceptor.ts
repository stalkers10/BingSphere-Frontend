import { HttpInterceptorFn } from '@angular/common/http';

function isPublicAuthRequest(url: string) {
  return url.includes('/api/token/') || url.includes('/api/register/');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (token && !isPublicAuthRequest(req.url)) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned)
  }

  return next(req);
};
