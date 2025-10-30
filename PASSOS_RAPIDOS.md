# 🚀 Passos Rápidos para Apresentação

## 1️⃣ Subir os containers
```powershell
docker-compose up -d --build
```

## 2️⃣ Verificar se está tudo rodando
```powershell
docker ps
```

## 3️⃣ Testar TLS com OpenSSL
```powershell
& "C:\Program Files\Git\usr\bin\openssl.exe" s_client -connect system1.local.projetomensal.com.br:443 -servername system1.local.projetomensal.com.br -showcerts
```

## 4️⃣ Testar TLS com Curl (alternativa)
```powershell
curl.exe -v -k https://system1.local.projetomensal.com.br/
```

## 5️⃣ Acessar Keycloak Admin
```
URL: http://localhost:8180
User: admin
Senha: admin
```
- Ir em **Users** → Verificar os 4 usuários
- Ir em **Realm roles** → Verificar as 4 roles

## 6️⃣ Testar Login no Frontend

**Sistema 1**: https://system1.local.projetomensal.com.br  
**Sistema 2**: https://system2.local.projetomensal.com.br

### ⚠️ Aceitar Certificado "Não Seguro"

**Isso é NORMAL!** São certificados self-signed para desenvolvimento.

**Chrome/Edge:**
1. Clique em **"Avançado"**
2. Clique em **"Ir para system1.local... (não seguro)"**

**Firefox:**
1. Clique em **"Avançado"**
2. Clique em **"Aceitar o risco e continuar"**

### Credenciais:
| Usuário | Senha | Permissões |
|---------|-------|------------|
| `admin` | `admin123` | CRUD em tudo |
| `usuario.sistema1` | `sistema1` | CRUD Animais/Tutores |
| `usuario.sistema2` | `sistema2` | CRUD Médicos/Consultas |
| `usuario.basico` | `basico123` | Somente leitura |

## 7️⃣ Demonstrar 403 (Acesso Negado)
1. Logar como `usuario.basico`
2. Tentar criar um animal
3. Abrir DevTools (F12) → Network → Ver resposta **403 Forbidden**

## 8️⃣ Parar os containers
```powershell
docker-compose down
```

---

**Pronto! 🎯**
