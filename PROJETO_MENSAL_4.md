# 📋 Projeto Mensal 4: Conteinerização e Balanceamento de Carga

**Aluno:** Carol Bueno Dávalos  
**Disciplina:** Arquitetura de Software  
**Data:** Novembro 2025

---

## 📌 1. Visão Geral do Projeto

Este projeto implementa uma arquitetura de microserviços containerizada com balanceamento de carga utilizando **HAProxy**, atendendo aos requisitos do Projeto Mensal 4.

### Componentes Principais:
- **HAProxy**: Load Balancer (ponto de entrada único)
- **Frontend**: 2 réplicas Angular SPA (Nginx)
- **Backend**: 4 réplicas Spring Boot (2 para Sistema 1, 2 para Sistema 2)
- **Keycloak**: Servidor de autenticação centralizado
- **MariaDB**: Banco de dados com TLS habilitado

---

## 🏗️ 2. Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIOS                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      HAProxy (Load Balancer)                 │
│                                                               │
│  - Porta 80 (HTTP) → Redireciona para HTTPS                 │
│  - Porta 443 (HTTPS) → TLS Termination                      │
│  - Porta 8404 → Estatísticas (/stats)                       │
│  - Algoritmo: Round-Robin                                    │
│  - Health Checks: /actuator/health (backend), / (frontend)  │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Frontend    │  │  Backend     │  │  Keycloak    │
│  Pool        │  │  Pool        │  │  (Auth)      │
│              │  │              │  │              │
│ • front-c1   │  │ • back1-c1   │  │ • keycloak1  │
│ • front-c2   │  │ • back1-c2   │  │              │
│              │  │ • back2-c1   │  └──────────────┘
│ (Nginx +     │  │ • back2-c2   │
│  Angular)    │  │              │
│              │  │ (Spring Boot)│
└──────────────┘  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   MariaDB    │
                  │   (TLS)      │
                  │              │
                  │ • Schema S1  │
                  │ • Schema S2  │
                  └──────────────┘
```

---

## 🔄 3. Fluxo de uma Requisição (Detalhado)

### 3.1. Requisição HTTPS para Sistema 1

```
1. Usuário acessa: https://system1.local.projetomensal.com.br/login
   ↓
2. DNS resolve para 127.0.0.1 (via arquivo HOSTS)
   ↓
3. HAProxy recebe conexão na porta 443
   - TLS Handshake (certificado wildcard.crt)
   - Descriptografa HTTPS → HTTP interno
   ↓
4. HAProxy analisa:
   - Host: system1.local.projetomensal.com.br
   - Path: /login
   - Decisão: Rotear para "frontend_servers" (não é /api/ nem /auth/)
   ↓
5. HAProxy aplica Round-Robin:
   - Requisição 1 → front-c1 (frontend1:80)
   - Requisição 2 → front-c2 (frontend2:80)
   - Requisição 3 → front-c1 (volta ao início)
   ↓
6. Frontend (Nginx) serve o Angular SPA:
   - Retorna index.html + bundle.js
   ↓
7. Navegador executa JavaScript:
   - Angular Router carrega LoginComponent
   - Redireciona para Keycloak: https://system1.../auth/realms/veterinaria
   ↓
8. Nova requisição ao HAProxy:
   - Path: /auth/realms/veterinaria
   - HAProxy identifica ACL "is_auth"
   - Roteia para "keycloak_server"
   ↓
9. Keycloak autentica usuário:
   - Valida credenciais no realm "veterinaria"
   - Gera JWT (token de acesso)
   - Redireciona de volta para Angular com token
   ↓
10. Angular armazena token e acessa API:
    - Requisição: GET https://system1.../api/animais
    - Header: Authorization: Bearer eyJhbGc...
    ↓
11. HAProxy recebe requisição /api/:
    - Host: system1 → backend1_servers
    - Round-Robin entre back1-c1 e back1-c2
    ↓
12. Backend (Spring Boot) processa:
    - Valida JWT via JWKS do Keycloak
    - Verifica permissões (@PreAuthorize)
    - Consulta MariaDB (schema veterinaria_s1)
    ↓
13. MariaDB retorna dados:
    - Conexão TLS (sslMode=REQUIRED)
    ↓
14. Backend retorna JSON:
    - Status 200 + lista de animais
    ↓
15. HAProxy envia resposta de volta:
    - Criptografa HTTP → HTTPS
    ↓
16. Navegador recebe JSON e renderiza UI
```

### 3.2. Requisição com Acesso Negado (403)

```
1. Usuário (usuario.basico) tenta criar animal:
   POST https://system1.../api/animais
   Header: Authorization: Bearer <token_usuario_basico>
   ↓
2. HAProxy → Backend1 (round-robin)
   ↓
3. Backend valida JWT e verifica permissões:
   - Método: AnimalController.createAnimal()
   - Anotação: @PreAuthorize("hasRole('ADMIN') or hasRole('USER_SISTEMA1')")
   - Token do usuário: roles = ['USER_BASICO']
   - Resultado: Access Denied!
   ↓
4. Backend retorna: 403 Forbidden
   ↓
5. HAProxy repassa 403 para navegador
   ↓
6. Angular AuthInterceptor detecta 403:
   - Loga no console: "[HTTP] 403 POST /api/animais - Access Denied"
   - Exibe SweetAlert2: "Você não tem permissão para esta ação"
```

---

## 🐳 4. Dockerfiles

### 4.1. Dockerfile do Frontend (Angular)

**Localização:** `veterinaria-master/Dockerfile`

```dockerfile
# Etapa 1: Build da aplicação Angular
FROM node:18 AS build
WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia código-fonte e compila
COPY . .
RUN npm run build --prod || npm run build

# Etapa 2: Servir com Nginx
FROM nginx:alpine

# Copia build do Angular para Nginx
COPY --from=build /app/dist/veterinaria/browser /usr/share/nginx/html

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

**Características:**
- **Multi-stage build**: Reduz tamanho da imagem final (Node 18 → Nginx Alpine)
- **Imagem base**: `node:18` para build, `nginx:alpine` para runtime (~50MB final)
- **Build otimizado**: Produção com AOT compilation e tree-shaking
- **Porta**: 80 (HTTP interno, TLS no HAProxy)

---

### 4.2. Dockerfile do Backend (Spring Boot)

**Localização:** `veterinariaBack/Dockerfile`

```dockerfile
# Etapa 1: Build da aplicação Spring Boot
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copia todo o projeto
COPY . .

# Compila com Maven (sem rodar testes)
RUN ./mvnw -q -DskipTests package

# Etapa 2: Runtime
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copia JAR compilado
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Entrypoint para executar aplicação
ENTRYPOINT ["java","-jar","/app/app.jar"]
```

**Características:**
- **Multi-stage build**: JDK para build (450MB) → JRE para runtime (200MB)
- **Imagem base**: Eclipse Temurin (distribuição OpenJDK certificada)
- **Build Maven**: Wrapper `./mvnw` incluído no projeto (não requer Maven instalado)
- **Otimização**: `-DskipTests` acelera build (testes rodam em CI/CD)
- **Porta**: 8080 (HTTP interno)

---

## ⚙️ 5. Configuração do HAProxy

**Localização:** `haproxy/haproxy.cfg`

### 5.1. Seções Principais

#### Frontend HTTP (Porta 80)
```haproxy
frontend http_front
    bind *:80
    
    # Redireciona system1/system2 para HTTPS
    acl is_system1 hdr(host) -i system1.local.projetomensal.com.br
    acl is_system2 hdr(host) -i system2.local.projetomensal.com.br
    http-request redirect scheme https code 301 if is_system1 OR is_system2
    
    # localhost continua em HTTP (desenvolvimento)
    default_backend frontend_servers
```

#### Frontend HTTPS (Porta 443)
```haproxy
frontend https_front
   bind *:443 ssl crt /etc/ssl-projetomensal.com.br/haproxy-combined.pem
    
    # ACLs para roteamento
    acl is_system1 hdr(host) -i system1.local.projetomensal.com.br
    acl is_system2 hdr(host) -i system2.local.projetomensal.com.br
    acl is_api path_beg /api/
    acl is_auth path_beg /auth/
    
    # Roteamento inteligente
   use_backend backend1_servers if is_system1 is_api
   use_backend backend2_servers if is_system2 is_api
   use_backend keycloak_server if is_auth
    default_backend frontend_servers
```

#### Backend Pool - Frontend (Round-Robin)
```haproxy
backend frontend_servers
    balance roundrobin
    option httpchk GET /
    
    # Sticky sessions com cookies
    cookie SERVERID insert indirect nocache
    
    server front-c1 frontend1:80 check cookie front1
    server front-c2 frontend2:80 check cookie front2
```

#### Backend Pool - Sistema 1
```haproxy
backend backend1_servers
    balance roundrobin
    option httpchk GET /actuator/health
    
    server back1-c1 backend1:8080 check
    server back1-c2 backend1_replica:8080 check
```

#### Backend Pool - Sistema 2
```haproxy
backend backend2_servers
   balance roundrobin
   option httpchk GET /actuator/health
    
   server back2-c1 backend2:8080 check
   server back2-c2 backend2_replica:8080 check
```

#### Keycloak (Reescrita de Caminho + Healthcheck TCP)
```haproxy
backend keycloak_server
   mode http
   balance roundrobin
    
   # Remove o prefixo /auth antes de encaminhar ao Keycloak
   # Ex.: /auth/realms/veterinaria -> /realms/veterinaria
   http-request replace-path /auth(.*) \1

   # Healthcheck simples em TCP (porta 8080) para evitar falso negativo de HTTP
   option tcp-check
   server keycloak1 keycloak:8080 check fall 3 rise 2 inter 3000ms
```

### 5.2. Algoritmo de Balanceamento: Round-Robin

**Como funciona:**
1. **Requisição 1** → Servidor A
2. **Requisição 2** → Servidor B
3. **Requisição 3** → Servidor A
4. **Requisição 4** → Servidor B
5. E assim sucessivamente...

**Vantagens:**
- Distribui carga igualmente entre servidores
- Simples de entender e debugar
- Ideal quando servidores têm capacidade similar

### 5.3. Health Checks

HAProxy monitora a saúde dos servidores a cada 2 segundos:

- **Backend:** `GET /actuator/health` (Spring Boot Actuator)
- **Frontend:** `GET /` (Nginx)
- **Critério de falha:** 3 checks consecutivos falhados
- **Critério de recuperação:** 2 checks consecutivos bem-sucedidos

Se um servidor falha, HAProxy automaticamente remove do pool até que se recupere.

---

## 🚀 6. Como Executar

### 6.1. Pré-requisitos
```powershell
# Verificar Docker instalado
docker --version

# Verificar Docker Compose
docker-compose --version

# Configurar arquivo HOSTS (Administrador)
notepad C:\Windows\System32\drivers\etc\hosts

# Adicionar:
127.0.0.1    system1.local.projetomensal.com.br
127.0.0.1    system2.local.projetomensal.com.br
```

### 6.2. Subir a Aplicação
```powershell
# Navegue até a pasta do projeto
cd veterinariaDockerter-main

# Suba todos os containers
docker-compose -f docker-compose-haproxy.yml up -d --build

# Verificar containers rodando (deve mostrar 9 containers)
docker ps
```

**Containers esperados:**
1. `veterinaria-haproxy` (Load Balancer)
2. `veterinaria-frontend1` (Angular SPA - Réplica 1)
3. `veterinaria-frontend2` (Angular SPA - Réplica 2)
4. `veterinaria-backend1` (Spring Boot S1 - Réplica 1)
5. `veterinaria-backend1-replica` (Spring Boot S1 - Réplica 2)
6. `veterinaria-backend2` (Spring Boot S2 - Réplica 1)
7. `veterinaria-backend2-replica` (Spring Boot S2 - Réplica 2)
8. `veterinaria-keycloak` (Autenticação)
9. `veterinaria-db` (MariaDB com TLS)

### 6.3. Testar a Aplicação

#### Acessar Frontend
- **Sistema 1 (HTTPS):** https://system1.local.projetomensal.com.br
- **Sistema 2 (HTTPS):** https://system2.local.projetomensal.com.br
- **Localhost (HTTP):** http://localhost

#### Acessar Estatísticas do HAProxy
- **URL:** http://localhost:8404/stats
- **Usuário:** admin
- **Senha:** admin

#### Acessar Keycloak Admin
- **URL (via HAProxy):** https://system1.local.projetomensal.com.br/auth/
- **Usuário:** admin
- **Senha:** admin

### 6.4. Testar Balanceamento de Carga

**Método 1: Via Logs**
```powershell
# Terminal 1: Logs do frontend1
docker logs -f veterinaria-frontend1

# Terminal 2: Logs do frontend2
docker logs -f veterinaria-frontend2

# Terminal 3: Fazer requisições
curl http://localhost/
curl http://localhost/
curl http://localhost/

# Observe os logs alternando entre frontend1 e frontend2
```

**Método 2: Via HAProxy Stats**
1. Acesse http://localhost:8404/stats
2. Observe a coluna "Session rate" e "Total sessions"
3. Recarregue https://system1.local.projetomensal.com.br várias vezes
4. Veja os números aumentando igualmente em front-c1 e front-c2

**Método 3: Forçar Falha de um Servidor**
```powershell
# Parar uma réplica do frontend
docker stop veterinaria-frontend1

# Testar aplicação (deve continuar funcionando via frontend2)
curl http://localhost/

# HAProxy detecta falha e remove do pool automaticamente
# Verificar em: http://localhost:8404/stats (front-c1 fica vermelho)

# Religar servidor
docker start veterinaria-frontend1

# Após ~4 segundos, HAProxy detecta recuperação e adiciona de volta
```

### 6.5. Parar a Aplicação
```powershell
# Parar todos os containers
docker-compose -f docker-compose-haproxy.yml down

# Parar e remover volumes (CUIDADO: apaga dados do banco)
docker-compose -f docker-compose-haproxy.yml down -v
```

---

## 📊 7. Comparação: Antes vs Depois

### Arquitetura Anterior (Projeto Mensal 3)
```
Usuário → Nginx → Backend (1 instância) → MariaDB
                ↘ Keycloak
```

**Limitações:**
- ❌ Ponto único de falha (1 frontend, 1 backend por sistema)
- ❌ Sem balanceamento de carga
- ❌ Escalabilidade limitada
- ❌ Sem monitoramento de saúde dos servidores

### Arquitetura Atual (Projeto Mensal 4)
```
Usuário → HAProxy → Frontend (2 réplicas) → Backend (4 réplicas) → MariaDB
                           ↘ Keycloak
```

**Melhorias:**
- ✅ Alta disponibilidade (réplicas + health checks)
- ✅ Balanceamento de carga automático (Round-Robin)
- ✅ Escalabilidade horizontal (fácil adicionar mais réplicas)
- ✅ Monitoramento em tempo real (HAProxy Stats)
- ✅ TLS termination no HAProxy (reduz carga dos backends)
- ✅ Recuperação automática de falhas

---

## 🔒 8. Segurança

### 8.1. TLS/HTTPS
- **Certificados:** Self-signed wildcard (`*.local.projetomensal.com.br`)
- **Protocolos:** TLS 1.2 e 1.3
- **Ciphers:** HIGH:!aNULL:!MD5
- **HSTS:** `max-age=31536000; includeSubDomains; preload`

### 8.2. Headers de Segurança
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer-when-downgrade
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

### 8.3. Autenticação e Autorização
- **OAuth 2.0 / OIDC** via Keycloak
- **JWT Validation** com JWKS
- **Role-based Access Control:**
  - `ADMIN` → Acesso total
  - `USER_SISTEMA1` → CRUD Animais/Tutores
  - `USER_SISTEMA2` → CRUD Médicos/Consultas/Vacinas
  - `USER_BASICO` → Somente leitura

### 8.4. Banco de Dados
- **Conexão TLS obrigatória:** `sslMode=REQUIRED`
- **Usuários separados por schema:**
  - `veter_s1` → Acesso apenas `veterinaria_s1`
  - `veter_s2` → Acesso apenas `veterinaria_s2`

---

## 📈 9. Escalabilidade

### 9.1. Como Adicionar Mais Réplicas

**Adicionar 3ª réplica do Frontend:**
```yaml
frontend3:
  build: ./veterinaria-master
  container_name: veterinaria-frontend3
  networks:
    - veterinaria-net
  restart: unless-stopped
```

**Atualizar haproxy.cfg:**
```haproxy
backend frontend_servers
    server front-c1 frontend1:80 check
    server front-c2 frontend2:80 check
    server front-c3 frontend3:80 check  # Nova réplica
```

**Recarregar HAProxy (sem downtime):**
```powershell
docker-compose -f docker-compose-haproxy.yml up -d --build
```

### 9.2. Capacidade Estimada

| Componente | Réplicas | Req/s por Réplica | Total Req/s |
|------------|----------|-------------------|-------------|
| Frontend   | 2        | ~1000             | 2000        |
| Backend S1 | 2        | ~500              | 1000        |
| Backend S2 | 2        | ~500              | 1000        |

**Nota:** Com 2 réplicas de cada, o sistema suporta ~1000 requisições/segundo por sistema.

---

## 🐛 10. Troubleshooting

### Problema 1: Container não sobe
```powershell
# Ver logs do container
docker-compose -f docker-compose-haproxy.yml logs <nome_container>

# Exemplo
docker-compose -f docker-compose-haproxy.yml logs backend1
```

### Problema 2: Health Check falhando
```powershell
# Verificar saúde manualmente
docker exec veterinaria-backend1 curl http://localhost:8080/actuator/health

# Deve retornar: {"status":"UP"}
```

### Problema 3: HAProxy não roteia corretamente
```powershell
# Ver logs do HAProxy
docker logs veterinaria-haproxy

# Verificar configuração
docker exec veterinaria-haproxy cat /usr/local/etc/haproxy/haproxy.cfg
```

### Problema 4: Certificado não confiável
- **Esperado!** São certificados self-signed para desenvolvimento.
- No navegador: Clique em "Avançado" → "Ir para o site (não seguro)"

---

## 📝 11. Conclusão

Este projeto demonstra a implementação completa de uma arquitetura de microserviços com:

✅ **Conteinerização:** Todos os serviços rodando em Docker  
✅ **Balanceamento de Carga:** HAProxy com Round-Robin  
✅ **Alta Disponibilidade:** Réplicas + Health Checks  
✅ **Segurança:** TLS, JWT, RBAC  
✅ **Escalabilidade:** Fácil adicionar novas réplicas  
✅ **Monitoramento:** HAProxy Stats em tempo real  

A solução atende todos os requisitos do Projeto Mensal 4 e está pronta para produção (após trocar certificados self-signed por válidos).

---

**Desenvolvido por:** Carol Bueno Dávalos  
**GitHub:** https://github.com/carolbuenodavalos/veterinariaDocker  
**Data:** Novembro 2025
