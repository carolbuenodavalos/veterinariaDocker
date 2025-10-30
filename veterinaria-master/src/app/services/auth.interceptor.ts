import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, from, EMPTY, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { KeycloakService } from './keycloak.service';
import Swal from 'sweetalert2';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private keycloakService = inject(KeycloakService);

  constructor() {
    // debug removido
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // debug removido
    
    if (!req.url.includes('/api')) {
      // debug removido
      return next.handle(req);
    }
    
    const isLoggedIn = this.keycloakService.isLoggedIn();
    // debug removido
    
    if (!isLoggedIn) {
      // debug removido
      return next.handle(req);
    }

    // debug removido
    return from(this.keycloakService.updateToken(60)).pipe(
      switchMap(() => {
        const token = this.keycloakService.getToken();
        // debug removido
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        // debug removido
            return next.handle(authReq).pipe(
              // Log básico de sucesso: [HTTP] 200 GET /api/...
              tap((event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                  const url = event.url || authReq.url;
                  console.info(`[HTTP] ${event.status} ${authReq.method} ${url}`);
                }
              }),
          catchError((err: any) => {
            // Intercepta erros do backend para mostrar mensagens amigáveis quando for apenas restrição de edição
            if (err instanceof HttpErrorResponse) {
              const status = err.status;
              const body = (typeof err.error === 'string') ? err.error : JSON.stringify(err.error || {});
              const isAccessDenied = body?.toLowerCase().includes('access denied');

              if ((status === 400 || status === 403) && isAccessDenied) {
                // Decide mensagem com base na URL chamada
                    const url = err.url || authReq.url;
                    console.log(`[HTTP] ${status} ${authReq.method} ${url} - Access Denied`);

                // Mostrar mensagem de visualização quando for uma operação potencialmente de edição
                // ou quando a tela deveria permitir somente visualizar
                Swal.fire({
                  icon: 'info',
                  title: 'Acesso Restrito',
                  text: 'Você está liberado apenas para visualização nesta área.',
                  confirmButtonText: 'Ok',
                  timer: 2200,
                  timerProgressBar: true
                });

                // Evita propagar o erro para os componentes (não chamar notifyError)
                return EMPTY;
                  } else {
                    // Log básico de erro: [HTTP] 4xx/5xx GET /api/...
                    const url = err.url || authReq.url;
                    console.log(`[HTTP] ${status} ${authReq.method} ${url}`);
              }
            }
            return throwError(() => err);
          })
        );
      })
    );
  }
}
