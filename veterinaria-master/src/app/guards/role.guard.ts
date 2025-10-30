import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { KeycloakService } from '../services/keycloak.service';
import Swal from 'sweetalert2';

/**
 * Guard para proteger rotas baseado em roles do Keycloak
 * 
 * Uso:
 * { path: 'rota', component: Componente, canActivate: [roleGuard], data: { roles: ['ADMIN', 'USER_SISTEMA1'] } }
 */
export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  // logs de debug removidos

  // Verifica se está autenticado
  if (!keycloakService.isLoggedIn()) {
  // debug removido
    await Swal.fire('Acesso Negado', 'Você precisa fazer login primeiro', 'warning');
    router.navigate(['/login']);
    return false;
  }

  // Pega as roles requeridas pela rota (definidas em app.routes.ts)
  const requiredRoles = route.data['roles'] as Array<string> || [];
  
  // Se não há roles requeridas, permite acesso
  if (requiredRoles.length === 0) {
  // debug removido
    return true;
  }

  // Pega as roles do usuário do token JWT
  const userRoles = keycloakService.getUserRoles() || [];
  // debug removido

  // ADMIN tem acesso total
  if (userRoles.includes('ADMIN')) {
  // debug removido
    return true;
  }

  // Verifica se o usuário tem PELO MENOS UMA das roles requeridas
  const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
  
  if (hasRequiredRole) {
  // debug removido
    return true;
  }

  // Acesso negado - verifica se é rota de edição ou visualização
  // debug removido
  
  // Detecta se é rota de edição/criação (new, edit)
  const isEditRoute = state.url.includes('/new') || state.url.includes('/edit');
  
  if (isEditRoute) {
    // Rota de edição - verifica se usuário tem acesso à área mas não à edição
    // Extrai o módulo da URL (ex: /admin/medicos/new -> medicos)
    const urlParts = state.url.split('/');
    const modulePath = urlParts.find((part, index) => 
      index > 0 && 
      urlParts[index - 1] === 'admin' && 
      part !== 'new' && 
      part !== 'edit' && 
      !part.match(/^\d+$/) // ignora IDs numéricos
    );
    
  // debug removido
    
    // Define quais usuários podem VISUALIZAR cada módulo
    let canViewModule = false;
    
    switch(modulePath) {
      case 'medicos':
        canViewModule = userRoles.some(r => ['ADMIN', 'USER_SISTEMA1', 'USER_SISTEMA2'].includes(r));
        break;
      case 'consultas':
        canViewModule = userRoles.some(r => ['ADMIN', 'USER_BASICO', 'USER_SISTEMA1', 'USER_SISTEMA2'].includes(r));
        break;
      case 'tutores':
      case 'animais':
        canViewModule = userRoles.some(r => ['ADMIN', 'USER_BASICO', 'USER_SISTEMA1'].includes(r));
        break;
      case 'vacinas':
        canViewModule = userRoles.some(r => ['ADMIN', 'USER_BASICO', 'USER_SISTEMA1', 'USER_SISTEMA2'].includes(r));
        break;
      default:
        canViewModule = false;
    }
    
  // debug removido
    
    if (canViewModule) {
      // Tem acesso à visualização mas não à edição
      await Swal.fire({
        icon: 'info',
        title: 'Acesso Restrito',
        text: 'Você está liberado apenas para visualização nesta área.',
        confirmButtonText: 'Ok'
      });
    } else {
      // Não tem acesso nem para visualizar
      await Swal.fire({
        icon: 'error',
        title: 'Acesso Negado',
        text: 'Você não tem permissão para acessar esta área.',
        confirmButtonText: 'Ok'
      });
    }
  } else {
    // Rota de listagem bloqueada - mostra "Acesso Negado"
    await Swal.fire({
      icon: 'error',
      title: 'Acesso Negado',
      text: 'Você não tem permissão para acessar esta área.',
      confirmButtonText: 'Ok'
    });
  }
  
  // Redireciona para o dashboard
  router.navigate(['/admin/dashboard']);
  return false;
};
