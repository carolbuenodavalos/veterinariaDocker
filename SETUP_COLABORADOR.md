# 🚀 Guia de Setup para Colaboradores

## ⚠️ ATENÇÃO: Modificações Necessárias

Este projeto está configurado com **caminhos absolutos específicos do Windows da Carol**. Você precisa ajustar alguns arquivos antes de rodar.

---

## 📋 Checklist de Configuração

### 1️⃣ Clonar o Repositório

```powershell
git clone https://github.com/carolbuenodavalos/veterinariaDocker.git
cd veterinariaDocker
```

### 2️⃣ **CRÍTICO**: Atualizar Caminhos no `docker-compose.yml`

Abra o arquivo `docker-compose.yml` e **substitua TODOS os caminhos** que começam com:
```
C:/Users/carol/OneDrive/Documentos/veterinariaDockerter-main/veterinariaDockerter-main/
```

Por:
```
./
```

**Exemplo de transformação:**

❌ **ANTES** (caminho absoluto da Carol):
```yaml
volumes:
  - "C:/Users/carol/OneDrive/Documentos/veterinariaDockerter-main/veterinariaDockerter-main/veterinariaBack/docker/db-init:/docker-entrypoint-initdb.d:ro"
```

✅ **DEPOIS** (caminho relativo):
```yaml
volumes:
  - "./veterinariaBack/docker/db-init:/docker-entrypoint-initdb.d:ro"
```

**Seções a modificar** (total de 9 volumes):

#### Service: `mariadb`
```yaml
volumes:
  - db_data:/var/lib/mysql
  - "./veterinariaBack/docker/db-init:/docker-entrypoint-initdb.d:ro"
  - "./veterinariaBack/docker/mariadb/my.cnf:/etc/mysql/conf.d/ssl.cnf:ro"
  - "./certs:/etc/ssl-projetomensal.com.br:ro"
```

#### Service: `keycloak`
```yaml
volumes:
  - "./keycloak-config:/opt/keycloak/data/import:ro"
```

#### Service: `backend`
```yaml
build: "./veterinariaBack"
```

#### Service: `backend2`
```yaml
build: "./veterinariaBack"
```

#### Service: `frontend`
```yaml
build: "./veterinaria-master"
```

#### Service: `web`
```yaml
volumes:
  - frontend_dist:/usr/share/nginx/html:ro
  - "./nginx-conf:/etc/nginx/conf.d:ro"
  - "./certs:/etc/ssl-projetomensal.com.br:ro"
```

---

### 3️⃣ Configurar o Arquivo HOSTS (Windows)

1. **Abra o Notepad como ADMINISTRADOR**:
   - Clique com botão direito no ícone do Notepad
   - Selecione "Executar como administrador"

2. **Abra o arquivo**: `C:\Windows\System32\drivers\etc\hosts`

3. **Adicione no final do arquivo**:
```
# Sistema Veterinária - Desenvolvimento
127.0.0.1    system1.local.projetomensal.com.br
127.0.0.1    system2.local.projetomensal.com.br
```

4. **Salve** (Ctrl+S) e feche

5. **Teste no PowerShell**:
```powershell
ping system1.local.projetomensal.com.br
```
Deve responder de `127.0.0.1`

---

### 4️⃣ Pré-requisitos

- **Docker Desktop** instalado e rodando
- **Node.js 18+** e **npm** (para builds do Angular)
- **Java 17+** e **Maven** (para builds do Spring Boot)
- **Git** configurado

---

### 5️⃣ Subir a Aplicação

```powershell
# Certifique-se de estar na pasta raiz do projeto
cd veterinariaDocker

# Subir todos os containers
docker-compose up -d --build

# Acompanhar os logs (opcional)
docker-compose logs -f
```

**Tempo esperado**: ~3-5 minutos (primeira vez com build)

---

### 6️⃣ Acessar a Aplicação

#### **Sistema 1** (Animais e Tutores):
- 🔗 https://system1.local.projetomensal.com.br

#### **Sistema 2** (Médicos, Vacinas e Consultas):
- 🔗 https://system2.local.projetomensal.com.br

#### **Desenvolvimento HTTP** (sem HTTPS):
- 🔗 http://localhost:4200

#### **Keycloak Admin Console**:
- 🔗 http://localhost:8180
- User: `admin` / Password: `admin`

---

### 7️⃣ Aceitar Certificado Self-Signed

⚠️ **Aviso de segurança é NORMAL** (certificados autoassinados para desenvolvimento)

**Chrome/Edge:**
1. Clique em "Avançado"
2. Clique em "Ir para system1.local... (não seguro)"

**Firefox:**
1. Clique em "Avançado"
2. Clique em "Aceitar o risco e continuar"

---

## 👥 Credenciais de Teste

### ADMIN (Acesso Total)
- Username: `admin`
- Password: `admin123`
- Permissões: CRUD em tudo

### Usuario Sistema 1 (Animais/Tutores)
- Username: `usuario.sistema1`
- Password: `sistema1`
- Permissões: CRUD em Animais e Tutores, GET em Médicos/Consultas/Vacinas

### Usuario Sistema 2 (Médicos/Consultas)
- Username: `usuario.sistema2`
- Password: `sistema2`
- Permissões: CRUD em Médicos e Consultas, GET em resto

### Usuario Básico (Somente Leitura)
- Username: `usuario.basico`
- Password: `basico123`
- Permissões: Somente GET em tudo

---

## 🔌 Portas Utilizadas

| Serviço | Porta | URL |
|---------|-------|-----|
| **Frontend HTTPS** | 443 | https://system1.local.projetomensal.com.br |
| **Frontend HTTP** | 4200 | http://localhost:4200 |
| **Backend 1 API** | 8080 | http://localhost:8080/api |
| **Keycloak** | 8180 | http://localhost:8180 |
| **MariaDB** | 3307 | localhost:3307 |

---

## 🛠️ Comandos Úteis

```powershell
# Parar todos os containers
docker-compose down

# Reiniciar com rebuild
docker-compose up -d --build

# Ver logs de um serviço específico
docker-compose logs -f backend

# Ver status dos containers
docker ps

# Limpar volumes e recomeçar do zero (CUIDADO: apaga dados)
docker-compose down -v
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to Docker daemon"
- Certifique-se de que o **Docker Desktop está rodando**

### Erro: "Port already in use"
- Verifique se algum serviço está usando as portas (4200, 8080, 8180, 3307, 443)
- Pare o serviço conflitante ou altere a porta no `docker-compose.yml`

### Erro: "No such file or directory"
- Verifique se você **atualizou os caminhos no docker-compose.yml**
- Certifique-se de estar na **pasta raiz do projeto**

### Página não carrega (ERR_CONNECTION_REFUSED)
- Verifique se o arquivo HOSTS foi configurado corretamente
- Execute `ping system1.local.projetomensal.com.br` para testar

### Certificado não é aceito
- É esperado! São certificados self-signed para desenvolvimento
- Clique em "Avançado" e aceite o risco

---

## 📚 Arquitetura do Projeto

```
├── veterinaria-master/          # Frontend Angular 18
├── veterinariaBack/             # Backend Spring Boot 3.4
├── keycloak-config/             # Configuração do Keycloak (realm)
├── nginx-conf/                  # Configuração do Nginx (proxy reverso)
├── certs/                       # Certificados TLS (self-signed)
├── docker-compose.yml           # Orquestração Docker ⚠️ AJUSTAR CAMINHOS
└── CONFIGURAR_HOSTS.txt         # Instruções de setup do hosts
```

---

## 🔐 Segurança

### Alterações de Segurança Recentes:
- ✅ Console logs otimizados (verbose removido, HTTP status mantido)
- ✅ Permissões de role granulares no backend (5 controllers)
- ✅ Headers de segurança no Nginx (HSTS, CSP, Permissions-Policy, etc.)
- ✅ CORS corrigido para domínios específicos
- ✅ Endpoint de teste removido do backend

### Para Produção:
- 🔄 Substituir certificados self-signed por Let's Encrypt
- 🔄 Executar OWASP ZAP scan
- 🔄 Revisar CSP e Permissions-Policy conforme necessidade

---

## 📞 Suporte

Se tiver problemas:
1. **Consulte o TROUBLESHOOTING.md** → Soluções para problemas comuns
2. Verifique se todas as modificações foram feitas
3. Confira os logs: `docker-compose logs -f`
4. Entre em contato com a Carol

---

**Última atualização**: 30/10/2025 (versão após push no GitHub)
