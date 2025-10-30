# Configuração do Keycloak - Sistema Veterinária

## 📋 Realm: veterinaria

Este arquivo contém a configuração completa do Keycloak para o sistema de veterinária.

---

## 🔐 Roles Criadas

| Role | Descrição | Permissões |
|------|-----------|------------|
| **ADMIN** | Administrador completo | Acesso total a todos os sistemas |
| **USER_BASICO** | Usuário básico | Somente visualização em todos os módulos |
| **USER_SISTEMA1** | Usuário do Sistema 1 | CRUD em Animais e Tutores |
| **USER_SISTEMA2** | Usuário do Sistema 2 | CRUD em Médicos, Vacinas e Consultas |

---

## 👥 Usuários de Teste Criados

| Usuário | Senha | Role | Email |
|---------|-------|------|-------|
| **admin** | admin123 | ADMIN | admin@veterinaria.com.br |
| **usuario.sistema1** | sistema1 | USER_SISTEMA1 | sistema1@veterinaria.com.br |
| **usuario.sistema2** | sistema2 | USER_SISTEMA2 | sistema2@veterinaria.com.br |
| **usuario.basico** | basico123 | USER_BASICO | basico@veterinaria.com.br |

---

## 📦 Importar Realm no Keycloak

### Opção 1: Via Interface Web (Recomendado)

1. Acesse o Keycloak Admin Console:
   ```
   http://localhost:8180
   ```

2. Faça login com as credenciais padrão:
   - **Username:** admin
   - **Password:** admin

3. No menu lateral esquerdo, clique na seta ao lado do nome do realm atual

4. Clique em **"Create Realm"** ou **"Add realm"**

5. Clique em **"Browse"** e selecione o arquivo `veterinaria-realm.json`

6. Clique em **"Create"**

### Opção 2: Via Docker (Importação Automática)

Adicione o volume no docker-compose.yml do Keycloak:

```yaml
keycloak:
  image: quay.io/keycloak/keycloak:23.0
  container_name: veterinaria-keycloak
  command: start-dev --import-realm
  environment:
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin
    KC_DB: dev-file
  ports:
    - "8180:8080"
  volumes:
    - ./keycloak-config:/opt/keycloak/data/import:ro
  networks:
    - veterinaria-net
  restart: unless-stopped
```

Depois execute:
```bash
docker compose down
docker compose up -d
```

---

## 🔧 Configuração dos Clientes

### Cliente Frontend: `veterinaria-frontend`
- **Tipo:** Public Client
- **URLs de Redirecionamento:**
  - `http://localhost:4200/*`
  - `http://localhost/*`
  - `https://system1.local.projetomensal.com.br/*`
  - `https://system2.local.projetomensal.com.br/*`
- **Web Origins:** Mesmas URLs acima
- **Protocolo:** openid-connect
- **PKCE:** Habilitado (S256)

### Cliente Backend: `veterinaria-backend`
- **Tipo:** Bearer Only
- **Protocolo:** openid-connect
- **Uso:** Validação de tokens JWT

---

## 🧪 Testar a Configuração

### 1. Verificar se o Keycloak está rodando:
```bash
docker ps | grep keycloak
```

### 2. Acessar o Admin Console:
```
http://localhost:8180
```

### 3. Verificar Realm criado:
- No canto superior esquerdo, deve aparecer "veterinaria" na lista de realms

### 4. Verificar Roles:
- Menu lateral: **Realm roles**
- Deve aparecer as 4 roles: ADMIN, USER_BASICO, USER_SISTEMA1, USER_SISTEMA2

### 5. Verificar Usuários:
- Menu lateral: **Users**
- Deve aparecer os 4 usuários de teste

### 6. Testar Login no Frontend:
```
http://localhost:4200
```

Tente fazer login com qualquer um dos usuários de teste.

---

## 🔄 Adicionar Novos Usuários

### Via Interface Web:

1. Acesse **Users** no menu lateral
2. Clique em **"Add user"**
3. Preencha os dados:
   - Username
   - Email
   - First Name
   - Last Name
4. Clique em **"Create"**
5. Na aba **"Credentials"**, defina a senha:
   - Password
   - Password confirmation
   - Desmarque "Temporary" se não quiser forçar mudança
6. Clique em **"Set password"**
7. Na aba **"Role mapping"**, clique em **"Assign role"**
8. Selecione as roles desejadas (ADMIN, USER_BASICO, USER_SISTEMA1, USER_SISTEMA2)
9. Clique em **"Assign"**

---

## 📊 Matriz de Permissões

### Sistema 1 (Animais e Tutores)

| Operação | ADMIN | USER_BASICO | USER_SISTEMA1 | USER_SISTEMA2 |
|----------|-------|-------------|---------------|---------------|
| Listar Animais | ✅ | ✅ | ✅ | ❌ |
| Criar Animal | ✅ | ❌ | ✅ | ❌ |
| Editar Animal | ✅ | ❌ | ✅ | ❌ |
| Excluir Animal | ✅ | ❌ | ✅ | ❌ |
| Listar Tutores | ✅ | ✅ | ✅ | ❌ |
| Criar Tutor | ✅ | ❌ | ✅ | ❌ |
| Editar Tutor | ✅ | ❌ | ✅ | ❌ |
| Excluir Tutor | ✅ | ❌ | ✅ | ❌ |

### Sistema 2 (Médicos, Vacinas e Consultas)

| Operação | ADMIN | USER_BASICO | USER_SISTEMA1 | USER_SISTEMA2 |
|----------|-------|-------------|---------------|---------------|
| Listar Médicos | ✅ | ✅ | ❌ | ✅ |
| Criar Médico | ✅ | ❌ | ❌ | ✅ |
| Editar Médico | ✅ | ❌ | ❌ | ✅ |
| Excluir Médico | ✅ | ❌ | ❌ | ✅ |
| Listar Vacinas | ✅ | ✅ | ❌ | ✅ |
| Criar Vacina | ✅ | ❌ | ❌ | ✅ |
| Editar Vacina | ✅ | ❌ | ❌ | ✅ |
| Excluir Vacina | ✅ | ❌ | ❌ | ✅ |
| Listar Consultas | ✅ | ✅ | ❌ | ✅ |
| Criar Consulta | ✅ | ❌ | ❌ | ✅ |
| Editar Consulta | ✅ | ❌ | ❌ | ✅ |
| Excluir Consulta | ✅ | ❌ | ❌ | ✅ |

---

## 🔗 URLs Importantes

- **Keycloak Admin Console:** http://localhost:8180
- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:8080/api
- **Keycloak JWKS (Sistema 1):** http://localhost:8180/realms/veterinaria/protocol/openid-connect/certs
- **Keycloak JWKS (Sistema 2):** http://localhost:8180/realms/veterinaria/protocol/openid-connect/certs

---

## 🐛 Troubleshooting

### Problema: Realm não aparece na lista
**Solução:** Verifique se o arquivo JSON foi importado corretamente. Tente criar o realm manualmente.

### Problema: Usuários não conseguem fazer login
**Solução:** 
1. Verifique se o usuário está habilitado (Enabled = true)
2. Verifique se a senha foi definida corretamente
3. Verifique se o email está verificado (Email Verified = true)

### Problema: Acesso negado mesmo com role correta
**Solução:**
1. Verifique se a role foi atribuída ao usuário em "Role mapping"
2. Faça logout e login novamente para renovar o token
3. Verifique os logs do navegador (F12) para ver as roles no token

### Problema: CORS error
**Solução:**
1. Verifique se as URLs estão corretas em "Web Origins" do cliente
2. Adicione `*` temporariamente para testar
3. Configure corretamente o proxy do Angular (`proxy.conf.json`)

---

## 📝 Notas Importantes

⚠️ **Segurança:**
- As senhas dos usuários de teste são **apenas para desenvolvimento**
- Em produção, use senhas fortes e habilite "Temporary password" para forçar mudança
- Configure SSL/TLS em produção
- Habilite autenticação de dois fatores (2FA) para usuários ADMIN

⚠️ **Configuração:**
- O Keycloak está configurado com `sslRequired: "none"` para desenvolvimento
- Em produção, altere para `sslRequired: "external"` ou `"all"`
- Configure SMTP para recuperação de senha e verificação de email

---

## 📚 Documentação Adicional

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Spring Security OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)
- [Angular Keycloak Integration](https://www.npmjs.com/package/keycloak-js)
