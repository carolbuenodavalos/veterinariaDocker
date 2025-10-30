# 🚨 TROUBLESHOOTING - Containers não sobem

## ❌ Problema 1: Só `veterinaria-db` e `veterinaria-web` iniciam

Se apenas 2 containers estão rodando (db e web), é porque **os outros estão falhando no build**.

## ❌ Problema 2: `veterinaria-web` e `veterinaria-db` NÃO iniciam

Se web e db **NÃO ESTÃO** subindo, o problema é diferente (provavelmente volumes/caminhos).

---

## � **ERRO CRÍTICO: Certificados e scripts do banco não encontrados**

### ❌ Mensagem de erro:
```
no such file or directory: './certs/...'
no such file or directory: './veterinariaBack/docker/db-init/...'
```

### ✅ **SOLUÇÃO IMEDIATA:**

O problema é que essas pastas **NÃO estão no Git** (estão no .gitignore por segurança).

#### **Opção 1: Criar certificados temporários (MAIS RÁPIDO - 2 minutos)**

Execute estes comandos na pasta raiz do projeto:

```powershell
# 1. Criar pasta de certificados
New-Item -ItemType Directory -Force -Path "certs"

# 2. Criar certificados dummy (temporários para teste)
cd certs
New-Item -ItemType File -Force -Path "fullchain.pem"
New-Item -ItemType File -Force -Path "wildcard.key"
New-Item -ItemType File -Force -Path "ca.crt"
New-Item -ItemType File -Force -Path "wildcard_rsa.key"
cd ..

# 3. Criar pasta de scripts do banco
New-Item -ItemType Directory -Force -Path "veterinariaBack\docker\db-init"
New-Item -ItemType Directory -Force -Path "veterinariaBack\docker\mariadb"

# 4. Criar arquivo de configuração do MySQL
@"
[mysqld]
ssl-ca=/etc/ssl-projetomensal.com.br/ca.crt
ssl-cert=/etc/ssl-projetomensal.com.br/fullchain.pem
ssl-key=/etc/ssl-projetomensal.com.br/wildcard_rsa.key
"@ | Out-File -FilePath "veterinariaBack\docker\mariadb\my.cnf" -Encoding utf8

# 5. Criar script de inicialização do banco
@"
-- Criação dos schemas
CREATE DATABASE IF NOT EXISTS veterinaria_s1;
CREATE DATABASE IF NOT EXISTS veterinaria_s2;

-- Criação dos usuários
CREATE USER IF NOT EXISTS 'veter_s1'@'%' IDENTIFIED BY 'vetS1!2025';
CREATE USER IF NOT EXISTS 'veter_s2'@'%' IDENTIFIED BY 'vetS2!2025';

-- Permissões
GRANT ALL PRIVILEGES ON veterinaria_s1.* TO 'veter_s1'@'%';
GRANT ALL PRIVILEGES ON veterinaria_s2.* TO 'veter_s2'@'%';
FLUSH PRIVILEGES;
"@ | Out-File -FilePath "veterinariaBack\docker\db-init\00-init.sql" -Encoding utf8

# 6. Agora tente subir novamente
docker-compose down -v
docker-compose up -d --build
```

**IMPORTANTE:** Estes certificados são **VAZIOS** (apenas para o Docker não dar erro). O TLS **NÃO VAI FUNCIONAR** com eles. Você vai precisar dos certificados reais para HTTPS.

#### **Opção 2: Desabilitar TLS temporariamente (MAIS SIMPLES)**

Edite o `docker-compose.yml` e **comente** as linhas de certificados:

```yaml
services:
  mariadb:
    # ...
    volumes:
      - db_data:/var/lib/mysql
      - "./veterinariaBack/docker/db-init:/docker-entrypoint-initdb.d:ro"
      # - "./veterinariaBack/docker/mariadb/my.cnf:/etc/mysql/conf.d/ssl.cnf:ro"  # COMENTE
      # - "./certs:/etc/ssl-projetomensal.com.br:ro"  # COMENTE
  
  web:
    # ...
    volumes:
      - frontend_dist:/usr/share/nginx/html:ro
      # - "./nginx-conf:/etc/nginx/conf.d:ro"  # COMENTE (temporário)
      # - "./certs:/etc/ssl-projetomensal.com.br:ro"  # COMENTE
```

E ajuste a connection string do backend (remover TLS):

```yaml
services:
  backend:
    environment:
      SPRING_DATASOURCE_URL: "jdbc:mariadb://mariadb:3306/veterinaria_s1"  # SEM ?sslMode=REQUIRED
```

Depois:
```powershell
docker-compose down -v
docker-compose up -d --build
```

**IMPORTANTE:** Com isso você vai conseguir **testar o projeto**, mas **SEM HTTPS** (só HTTP na porta 4200).

#### **Opção 3: Pegar os arquivos da Carol (MELHOR para apresentação)**

Fale com a Carol para ela te enviar:
1. A pasta `certs/` completa (com certificados)
2. A pasta `veterinariaBack/docker/` completa (com scripts SQL)
3. A pasta `nginx-conf/` completa (com configurações)

---

## �🔧 SOLUÇÃO ESPECÍFICA: Web e DB não sobem

### Causa provável: **Volumes com caminhos incorretos**

#### 1️⃣ **Verificar logs específicos**

Peça para ele executar:

```powershell
# Ver erro do MariaDB
docker-compose logs mariadb

# Ver erro do Nginx
docker-compose logs web
```

**Erros comuns:**
- `no such file or directory` → Caminho está errado no docker-compose.yml
- `permission denied` → Problema de permissão no Windows

#### 2️⃣ **SOLUÇÃO RÁPIDA: Remover volumes problemáticos temporariamente**

Se os caminhos estão dando erro, teste SEM os volumes primeiro:

**Abra `docker-compose.yml` e COMENTE as linhas de volumes:**

**Service: mariadb**
```yaml
services:
  mariadb:
    image: mariadb:10.6
    # ... outras configs ...
    volumes:
      - db_data:/var/lib/mysql
      # COMENTE estas 3 linhas temporariamente:
      # - "./veterinariaBack/docker/db-init:/docker-entrypoint-initdb.d:ro"
      # - "./veterinariaBack/docker/mariadb/my.cnf:/etc/mysql/conf.d/ssl.cnf:ro"
      # - "./certs:/etc/ssl-projetomensal.com.br:ro"
```

**Service: web**
```yaml
services:
  web:
    image: nginx:alpine
    # ... outras configs ...
    volumes:
      - frontend_dist:/usr/share/nginx/html:ro
      # COMENTE estas 2 linhas temporariamente:
      # - "./nginx-conf:/etc/nginx/conf.d:ro"
      # - "./certs:/etc/ssl-projetomensal.com.br:ro"
```

Depois:
```powershell
docker-compose down -v
docker-compose up -d mariadb web
```

**Se subir:** O problema são os caminhos dos volumes.  
**Se não subir:** O problema é outro (portas, memória, etc.).

#### 3️⃣ **Verificar se as pastas existem NO PC DELE**

```powershell
# Ele deve estar na pasta raiz e executar:
ls veterinariaBack\docker\db-init
ls veterinariaBack\docker\mariadb
ls nginx-conf
ls certs
```

**Todos devem existir.** Se algum der erro, o clone do Git está incompleto.

#### 4️⃣ **Sintaxe YAML: Verificar barras**

No Windows, os caminhos relativos devem usar **/** (barra normal), não **\\**:

❌ **ERRADO:**
```yaml
volumes:
  - ".\\certs:/etc/ssl-projetomensal.com.br:ro"
```

✅ **CORRETO:**
```yaml
volumes:
  - "./certs:/etc/ssl-projetomensal.com.br:ro"
```

#### 5️⃣ **Problema de permissões no Windows**

Se o erro for `permission denied`, pode ser o Docker Desktop sem permissão para acessar a pasta.

**Solução:**
1. Abrir **Docker Desktop**
2. Settings → Resources → **File Sharing**
3. Adicionar a pasta do projeto
4. Apply & Restart

---

## ✅ SOLUÇÃO PASSO A PASSO (Problema 1)

### 1️⃣ **Verificar os logs de erro**

```powershell
# Ver logs de TODOS os serviços (mostra onde está falhando)
docker-compose logs

# Ver logs de um serviço específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs keycloak
```

**Procure por erros tipo:**
- `Error: ENOENT: no such file or directory`
- `Cannot find module`
- `npm ERR!`
- `Maven build failed`

---

### 2️⃣ **CONFIRMAR que os caminhos foram ajustados**

Abra o arquivo `docker-compose.yml` e **CONFIRME** que TODOS os caminhos estão assim:

#### ❌ **ERRADO** (caminhos absolutos da Carol):
```yaml
volumes:
  - "C:/Users/carol/OneDrive/Documentos/veterinariaDockerter-main/veterinariaDockerter-main/certs:/etc/ssl-projetomensal.com.br:ro"
```

#### ✅ **CORRETO** (caminhos relativos):
```yaml
volumes:
  - "./certs:/etc/ssl-projetomensal.com.br:ro"
```

---

### 3️⃣ **Verificar se as pastas existem**

Execute na pasta raiz do projeto:

```powershell
# Verificar se as pastas principais existem
ls veterinariaBack
ls veterinaria-master
ls keycloak-config
ls certs
ls nginx-conf
```

**Todos devem mostrar conteúdo.** Se aparecer erro, o clone do Git pode estar incompleto.

---

### 4️⃣ **Parar tudo e recomeçar do zero**

```powershell
# Parar e remover containers/volumes
docker-compose down -v

# Limpar imagens antigas (opcional, mas recomendado)
docker system prune -f

# Subir novamente com rebuild forçado
docker-compose up -d --build --force-recreate
```

---

### 5️⃣ **Verificar pré-requisitos instalados**

O build precisa de:

- ✅ **Docker Desktop** rodando
- ✅ **Espaço em disco** (mínimo 5GB livres)
- ✅ **Memória RAM** (Docker Desktop precisa de pelo menos 4GB)

**Verificar configuração do Docker Desktop:**
1. Abrir Docker Desktop
2. Settings → Resources
3. Confirmar:
   - Memory: **4GB ou mais**
   - Disk image size: **suficiente**

---

### 6️⃣ **Problema específico: Frontend não builda**

Se o **frontend** falhar:

```powershell
# Ver logs específicos
docker-compose logs frontend

# Erro comum: falta de memória no npm install
# Solução: aumentar memória do Docker Desktop
```

**Alternativa:** Buildar manualmente antes:

```powershell
cd veterinaria-master
npm install
npm run build
cd ..
docker-compose up -d
```

---

### 7️⃣ **Problema específico: Backend não builda**

Se o **backend** falhar:

```powershell
# Ver logs específicos
docker-compose logs backend

# Erro comum: Maven download de dependências falhando
# Solução: verificar conexão de internet
```

**Alternativa:** Buildar manualmente antes:

```powershell
cd veterinariaBack
./mvnw clean package -DskipTests
cd ..
docker-compose up -d
```

---

### 8️⃣ **Problema específico: Keycloak não sobe**

Se o **Keycloak** falhar:

```powershell
# Ver logs específicos
docker-compose logs keycloak

# Erro comum: pasta keycloak-config não encontrada
# Solução: confirmar que existe ./keycloak-config/veterinaria-realm.json
```

---

## 🔍 **Comandos de Diagnóstico**

Execute esses comandos e me envie a saída:

```powershell
# 1. Verificar containers
docker-compose ps

# 2. Verificar imagens
docker images | Select-String veterinaria

# 3. Verificar se está na pasta correta
pwd

# 4. Verificar estrutura de pastas
ls

# 5. Ver último erro
docker-compose logs --tail=50
```

---

## 📋 **Checklist Final**

- [ ] Estou na pasta raiz do projeto (tem docker-compose.yml)
- [ ] Ajustei TODOS os caminhos para `./` no docker-compose.yml
- [ ] As pastas existem (veterinariaBack, veterinaria-master, certs, etc.)
- [ ] Docker Desktop está rodando
- [ ] Tenho espaço em disco (5GB+)
- [ ] Docker tem 4GB+ de RAM configurado
- [ ] Executei `docker-compose down -v` antes de tentar novamente

---

## 🆘 **Se nada funcionar:**

### **Opção 1: Build manual**

```powershell
# Parar tudo
docker-compose down -v

# Buildar backend manualmente
cd veterinariaBack
./mvnw clean package -DskipTests
cd ..

# Buildar frontend manualmente
cd veterinaria-master
npm install
npm run build
cd ..

# Subir só os serviços que funcionam
docker-compose up -d mariadb keycloak web
```

### **Opção 2: Usar meu PC**

Se o PC dele não tiver recursos suficientes, pode:
1. Pegar os containers buildados do meu PC
2. Exportar as imagens Docker
3. Importar no PC dele

---

## 💡 **Erro Comum: Porta em Uso**

Se aparecer erro de porta em uso:

```powershell
# Verificar portas ocupadas
netstat -ano | findstr :8080
netstat -ano | findstr :8180
netstat -ano | findstr :3307
netstat -ano | findstr :443

# Matar processo na porta (substitua PID)
taskkill /PID <numero> /F

# OU mudar a porta no docker-compose.yml
# Exemplo: mudar "8080:8080" para "8081:8080"
```

---

**Última atualização:** 30/10/2025  
**Contato:** Carol (caso precise de suporte adicional)
