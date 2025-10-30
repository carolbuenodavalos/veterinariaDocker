# 🎯 Comandos para Apresentação ao Professor

## ✅ Pré-requisitos Confirmados

- ✅ Git for Windows instalado (inclui OpenSSL 3.2.4)
- ✅ Docker Desktop rodando
- ✅ Arquivo HOSTS configurado
- ✅ Todos os containers em execução

---

## 🚀 1. Subir Todos os Containers

```powershell
# Na pasta raiz do projeto
cd C:\Users\carol\OneDrive\Documentos\veterinariaDockerter-main\veterinariaDockerter-main

# Subir todos os serviços (build + start)
docker-compose up -d --build
```

**Tempo esperado**: 3-5 minutos na primeira vez

---

## 📊 2. Verificar Status dos Containers

```powershell
# Listar containers em execução
docker ps

# Ver logs em tempo real (todos os serviços)
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f keycloak
docker-compose logs -f web
```

**Saída esperada**: 6 containers rodando
- `veterinaria-db` (MariaDB)
- `veterinaria-keycloak` (Keycloak)
- `veterinaria-backend` (Spring Boot - Sistema 1)
- `veterinaria-backend2` (Spring Boot - Sistema 2)
- `veterinaria-frontend` (Angular)
- `veterinaria-web` (Nginx)

---

## 🔐 3. Testar Conexão TLS com OpenSSL

### Opção 1: OpenSSL (mostra certificado completo)

```powershell
# Testar Sistema 1
& "C:\Program Files\Git\usr\bin\openssl.exe" s_client -connect system1.local.projetomensal.com.br:443 -servername system1.local.projetomensal.com.br -showcerts

# Testar Sistema 2
& "C:\Program Files\Git\usr\bin\openssl.exe" s_client -connect system2.local.projetomensal.com.br:443 -servername system2.local.projetomensal.com.br -showcerts
```

**O que observar na saída:**
- ✅ `CONNECTED(00000004)` → Conexão estabelecida
- ✅ `CN=*.local.projetomensal.com.br` → Certificado wildcard
- ✅ `verify return:1` → Handshake TLS bem-sucedido
- ✅ Validade: 26 Out 2025 até 26 Out 2026
- ✅ Cadeia: Certificado → Intermediário → CA

**Nota**: `unable to get local issuer certificate` é **esperado** (certificado self-signed)

### Opção 2: Curl (mais rápido)

```powershell
# Testar Sistema 1 (mostra handshake e redirecionamento)
curl.exe -v -k https://system1.local.projetomensal.com.br/

# Testar Sistema 2
curl.exe -v -k https://system2.local.projetomensal.com.br/
```

**Saída esperada:**
```
* Connected to system1.local.projetomensal.com.br (127.0.0.1) port 443
* ALPN: server accepted http/1.1
< HTTP/1.1 302 Moved Temporarily
< Location: https://system1.local.projetomensal.com.br/login
```

---

## 🔑 4. Acessar Keycloak e Verificar Usuários/Roles

### Keycloak Admin Console

```
URL: http://localhost:8180
Usuário: admin
Senha: admin
```

**Passos para demonstração:**
1. Login no Admin Console
2. Selecionar realm: `veterinaria`
3. Menu **Users** → Listar usuários:
   - `admin` → Roles: ADMIN
   - `usuario.sistema1` → Roles: USER_SISTEMA1
   - `usuario.sistema2` → Roles: USER_SISTEMA2
   - `usuario.basico` → Roles: USER_BASICO
4. Menu **Realm roles** → Mostrar as 4 roles criadas

---

## 🌐 5. Testar Login no Frontend

### Sistema 1 (Animais e Tutores)
```
URL: https://system1.local.projetomensal.com.br
```

### Sistema 2 (Médicos, Vacinas, Consultas)
```
URL: https://system2.local.projetomensal.com.br
```

### Credenciais para Teste

| Usuário | Senha | Role | Permissões |
|---------|-------|------|------------|
| `admin` | `admin123` | ADMIN | CRUD em tudo |
| `usuario.sistema1` | `sistema1` | USER_SISTEMA1 | CRUD Animais/Tutores, GET resto |
| `usuario.sistema2` | `sistema2` | USER_SISTEMA2 | CRUD Médicos/Consultas, GET resto |
| `usuario.basico` | `basico123` | USER_BASICO | Somente GET (leitura) |

**Demonstração sugerida:**
1. Logar como `admin` → Mostrar que consegue criar/editar/deletar em todos os módulos
2. Logar como `usuario.sistema1` → Tentar criar médico → Deve receber **403 Forbidden**
3. Logar como `usuario.basico` → Tentar criar animal → Deve receber **403 Forbidden**
4. Abrir DevTools (F12) → Network → Mostrar resposta 403 com header `Authorization: Bearer ...`

---

## 🧪 6. Testar API com Curl (Autorizado vs Negado)

### 6.1. Obter Token de Acesso

**Método 1: Via Frontend (mais fácil)**
1. Faça login no frontend (qualquer usuário)
2. Abra DevTools (F12) → Network
3. Localize uma chamada de API (ex: `/api/animais`)
4. Copie o header `Authorization: Bearer eyJhbGc...`
5. Use o token nos comandos abaixo

**Método 2: Via Password Grant (direto no Keycloak)**

```powershell
# Exemplo: obter token para usuario.sistema1
$response = curl.exe -X POST "http://localhost:8180/realms/veterinaria/protocol/openid-connect/token" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "grant_type=password&client_id=veterinaria-client&username=usuario.sistema1&password=sistema1" | ConvertFrom-Json

# Extrair o token
$TOKEN = $response.access_token
echo $TOKEN
```

### 6.2. Testar Endpoints Protegidos

#### Teste 1: Listar Animais (todos autenticados podem)

```powershell
# Com token válido → Deve retornar 200 OK
curl.exe -k -H "Authorization: Bearer $TOKEN" https://system1.local.projetomensal.com.br/api/animais
```

#### Teste 2: Criar Animal (só ADMIN e USER_SISTEMA1)

```powershell
# Com usuario.sistema1 ou admin → 201 Created
curl.exe -k -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" `
  -d '{"nome":"Rex","especie":"Cachorro","raca":"Labrador","tutorId":1}' `
  https://system1.local.projetomensal.com.br/api/animais

# Com usuario.basico → 403 Forbidden
```

#### Teste 3: Criar Médico (só ADMIN e USER_SISTEMA2)

```powershell
# Com usuario.sistema2 ou admin → 201 Created
curl.exe -k -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" `
  -d '{"nome":"Dr. Silva","crm":"12345-PR","especialidade":"Clínico Geral"}' `
  https://system2.local.projetomensal.com.br/api/medicos

# Com usuario.sistema1 → 403 Forbidden
```

#### Teste 4: Criar Vacina (só ADMIN)

```powershell
# Com admin → 201 Created
curl.exe -k -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" `
  -d '{"nome":"V10","fabricante":"Zoetis","lote":"ABC123"}' `
  https://system1.local.projetomensal.com.br/api/vacinas

# Com qualquer outro usuário → 403 Forbidden
```

---

## 📸 7. Evidências para Demonstração

### Capturas de Tela Recomendadas

1. **Terminal: `docker ps`**
   - Mostra 6 containers rodando

2. **Terminal: OpenSSL handshake**
   - Mostra conexão TLS, certificado wildcard, cadeia de certificados

3. **Terminal: Curl com -v**
   - Mostra HTTP/1.1 302, redirecionamento para /login

4. **Keycloak Admin: Users**
   - Lista os 4 usuários criados

5. **Keycloak Admin: Realm Roles**
   - Mostra as 4 roles (ADMIN, USER_SISTEMA1, USER_SISTEMA2, USER_BASICO)

6. **Keycloak Admin: Role Mappings de um usuário**
   - Mostra roles atribuídas (ex: usuario.sistema1 → USER_SISTEMA1)

7. **Browser DevTools: Network → 403 Forbidden**
   - Usuário sem permissão tentando criar recurso protegido

8. **Browser DevTools: Network → 200 OK**
   - Usuário com permissão acessando recurso protegido

9. **Terminal: Curl com token → 200 OK**
   - Chamada de API bem-sucedida

10. **Terminal: Curl com token → 403 Forbidden**
    - Chamada de API negada por falta de permissão

### Logs Importantes

```powershell
# Salvar logs em arquivos para anexar ao relatório
docker-compose logs backend > logs-backend.txt
docker-compose logs keycloak > logs-keycloak.txt
docker-compose logs web > logs-nginx.txt
```

---

## 🎬 Roteiro de Demonstração (5 minutos)

### 1. Infraestrutura (30s)
```powershell
docker ps
```
→ Mostrar 6 containers rodando

### 2. TLS e Certificados (1min)
```powershell
curl.exe -v -k https://system1.local.projetomensal.com.br/
```
→ Mostrar conexão TLS, certificado, redirecionamento

### 3. Keycloak - Usuários e Roles (1min)
- Abrir http://localhost:8180
- Login admin/admin
- Mostrar realm `veterinaria`
- Listar usuários e suas roles

### 4. Autenticação e Autorização (2min)
- Login como `admin` no frontend → CRUD funciona em tudo
- Login como `usuario.basico` → Tentar criar animal → 403 no DevTools
- Mostrar header `Authorization: Bearer ...` na Network

### 5. Testes de API (1.5min)
```powershell
# Listar (permitido)
curl.exe -k -H "Authorization: Bearer $TOKEN" https://system1.local.projetomensal.com.br/api/animais

# Criar vacina como usuario.sistema1 (negado)
curl.exe -k -X POST -H "Authorization: Bearer $TOKEN" https://system1.local.projetomensal.com.br/api/vacinas
```
→ Mostrar 200 OK vs 403 Forbidden

---

## 🔧 Comandos de Manutenção

```powershell
# Parar todos os containers
docker-compose down

# Reiniciar serviço específico
docker-compose restart backend

# Ver logs em tempo real
docker-compose logs -f

# Limpar tudo e recomeçar (CUIDADO: apaga dados)
docker-compose down -v
docker-compose up -d --build
```

---

## 📚 Arquivos de Referência

- `SETUP_COLABORADOR.md` → Guia completo de instalação
- `CONFIGURAR_HOSTS.txt` → Instruções para arquivo HOSTS
- `docker-compose.yml` → Orquestração dos containers
- `nginx-conf/default.conf` → Configuração de proxy e TLS
- `keycloak-config/veterinaria-realm.json` → Configuração do Keycloak

---

**Data de preparação**: 30/10/2025  
**Versão**: Pré-apresentação
