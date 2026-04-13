# Kan - Deployment Vercel + Supabase (Costo $0)

Guía rápida para deployar tu instancia de Kan en Vercel con base de datos Supabase, **completamente gratis**.

## ⚡ Quick Start (5 minutos)

### 1. Variables de Entorno Necesarias

Tienes que agregar estas 3 variables en Vercel dashboard:

```env
BETTER_AUTH_SECRET=tu_clave_generada_aqui (32+ caracteres)
NEXT_PUBLIC_BASE_URL=https://tu-app.vercel.app
POSTGRES_URL=postgresql://user:pass@host/database (de Supabase)
```

**Cómo obtener POSTGRES_URL de Supabase:**
1. Ve a supabase.com → Tu proyecto
2. Settings → Database → URI (copiar la string)
3. Pegar en Vercel → Settings → Environment Variables

### 2. Deploy a Vercel

```bash
# Opción 1: Desde v0 (recomendado)
Click "Publish" en v0 → Connect to Vercel → Selecciona tu repo

# Opción 2: Git
git push origin main
# Vercel se redesplegará automáticamente
```

### 3. Verificar Deployment

- URL: `https://tu-app.vercel.app`
- Intenta crear una cuenta
- ¡Listo!

## 📋 Checklist Pre-Deployment

- [ ] BETTER_AUTH_SECRET generado y agregado (32+ caracteres)
- [ ] POSTGRES_URL de Supabase agregado
- [ ] NEXT_PUBLIC_BASE_URL = tu URL de Vercel
- [ ] Base de datos Supabase con migraciones aplicadas
- [ ] Variables en Vercel Settings → Environment Variables

## 🔍 Troubleshooting

### Error: "Invalid BETTER_AUTH_SECRET"
- Asegúrate que tenga **32 caracteres mínimo**
- Regenera: `openssl rand -base64 26 | tr -dc 'a-zA-Z0-9' | head -c 32`

### Error: "Cannot connect to database"
- Verifica que POSTGRES_URL sea correcto en Supabase
- Revisa que la BD tenga las migraciones aplicadas
- Asegúrate que no haya firewalls bloqueando la conexión

### Página en blanco
- Revisa Build logs en Vercel dashboard
- Busca errores en "Runtime Errors"
- Verifica que todas las env vars estén correctas

## 🚀 Next Steps

1. **Invitar equipo:** Comparte tu URL
2. **Personalizar:** Cambia colores/logo (opcional)
3. **Dominio personalizado:** Conecta tu dominio en Vercel (gratis)
4. **Analytics:** Habilita PostHog (opcional)
5. **Email:** Configura Resend para notificaciones (gratis hasta 100 emails/día)

## 💾 Backups

Supabase automáticamente hace backups diarios. Para manual:

1. Supabase dashboard → Backups
2. Click "Create Backup"
3. O exporta SQL: `pg_dump -U user dbname > backup.sql`

## 📈 Escalamiento

Si creces más allá del plan gratuito:

- **Supabase Hobby:** $5/mes - 8GB BD
- **Vercel Pro:** $20/mes - Build minutes ilimitados

Pero para un equipo pequeño, **gratis es más que suficiente**.

---

**Documentación completa:** Ver `SETUP_MARKETING_TEAM.md`
