import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {
  private keycloak: Keycloak | undefined;

  async init(): Promise<boolean> {
    this.keycloak = new Keycloak({
      url: window.location.origin + '/auth',
      realm: 'veterinaria',
      clientId: 'veterinaria-frontend'
    });

    try {
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false
      });

      if (authenticated) {
        setInterval(() => {
          this.updateToken(60);
        }, 60000);
      }
      return authenticated;
    } catch (error) {
      console.error('Keycloak init error:', error);
      return false;
    }
  }

  login(): Promise<void> {
    return this.keycloak?.login() || Promise.resolve();
  }

  async loginWithPassword(username: string, password: string): Promise<boolean> {
    try {
      const tokenUrl = window.location.origin + '/auth/realms/veterinaria/protocol/openid-connect/token';
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: 'veterinaria-frontend',
          grant_type: 'password',
          username: username,
          password: password,
          scope: 'openid'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!this.keycloak) {
          this.keycloak = new Keycloak({
            url: window.location.origin + '/auth',
            realm: 'veterinaria',
            clientId: 'veterinaria-frontend'
          });
        }
        
        this.keycloak.token = data.access_token;
        this.keycloak.refreshToken = data.refresh_token;
        this.keycloak.idToken = data.id_token;
        
  // debug removido
        try {
          const userInfoResponse = await fetch('/auth/realms/veterinaria/protocol/openid-connect/userinfo', {
            headers: { 'Authorization': `Bearer ${data.access_token}` }
          });
          
          if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json();
            
            const tokenToUse = data.id_token || data.access_token;
            const tokenParts = tokenToUse.split('.');
            if (tokenParts.length === 3) {
              const base64Url = tokenParts[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const tokenPayload = JSON.parse(jsonPayload);
              const payload = { ...tokenPayload, ...userInfo };
              
              this.keycloak.tokenParsed = payload;
              this.keycloak.authenticated = true;
              
              // debug removido
            }
          }
        } catch (error) {
          console.error('Erro UserInfo:', error);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro login:', error);
      return false;
    }
  }

 logout(): void {
  if (this.keycloak) {
    this.keycloak.logout({ redirectUri: window.location.origin + '/login' });
  }
}

  getToken(): string | undefined {
  const token = this.keycloak?.token;
  return token;
  }

  isLoggedIn(): boolean {
    return this.keycloak?.authenticated || false;
  }

  getUsername(): string | undefined {
    return this.keycloak?.tokenParsed?.['preferred_username'];
  }

  getUserRoles(): string[] {
    return this.keycloak?.tokenParsed?.['realm_access']?.['roles'] || [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Verifica se usuário pode editar Tutores/Animais (Sistema1)
   */
  canEditSistema1(): boolean {
    return this.hasAnyRole(['ADMIN', 'USER_SISTEMA1']);
  }

  /**
   * Verifica se usuário pode editar Médicos/Consultas (Sistema1 ou Sistema2)
   */
  canEditMedicosConsultas(): boolean {
    return this.hasAnyRole(['ADMIN', 'USER_SISTEMA1', 'USER_SISTEMA2']);
  }

  /**
   * Verifica se usuário pode editar Vacinas (apenas ADMIN)
   */
  canEditVacinas(): boolean {
    return this.hasRole('ADMIN');
  }

updateToken(minValidity: number = 60): Promise<boolean> {
  if (!this.keycloak?.tokenParsed) return Promise.resolve(false);

  const now = Math.floor(Date.now() / 1000);
  const exp = this.keycloak.tokenParsed['exp'];
  const secondsLeft = exp - now;

  if (secondsLeft > minValidity) {
    return Promise.resolve(true);
  }

  return this.keycloak.updateToken(minValidity)
    .then(() => true)
    .catch(async () => {
      const ok = await this.refreshToken();
      if (!ok) this.logout();
      return ok;
    });
}

private async refreshToken(): Promise<boolean> {
  if (!this.keycloak?.refreshToken) return false;

  try {
    const tokenUrl = window.location.origin + '/auth/realms/veterinaria/protocol/openid-connect/token';
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: 'veterinaria-frontend',
        grant_type: 'refresh_token',
        refresh_token: this.keycloak.refreshToken!,
      })
    });

    if (!response.ok) return false;

    const data = await response.json();
    this.keycloak.token = data.access_token;
    this.keycloak.refreshToken = data.refresh_token;
    this.keycloak.idToken = data.id_token;

    const parts = data.access_token.split('.');
    if (parts.length === 3) {
      (this.keycloak as any).tokenParsed = JSON.parse(atob(parts[1]));
      (this.keycloak as any).authenticated = true;
    }

    return true;
  } catch (e) {
    return false;
  }
}
  
}
