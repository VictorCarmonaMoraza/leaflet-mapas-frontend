import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../config/api.config';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const savedLanguage = (localStorage.getItem('geovistaLanguage') || 'es').toLowerCase();
  const language = savedLanguage === 'en' ? 'en' : 'es';

  const needsApiPrefix = req.url.startsWith('/api');
  const finalUrl = needsApiPrefix ? `${API_BASE_URL}${req.url}` : req.url;

  const cloned = req.clone({
    url: finalUrl,
    setHeaders: {
      'Accept-Language': language,
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  return next(cloned);
};
