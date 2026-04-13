# Setup Kan para Equipo de Marketing (Costo $0)

Esta es una guía completa para configurar Kan como herramienta de gestión de proyectos para tu departamento de marketing, con costo $0 utilizando Supabase y Vercel.

## ✅ Estado Actual de Tu Instalación

Tu instancia de Kan está **completamente configurada** con:

- ✅ Base de datos PostgreSQL en Supabase (Plan Gratuito)
- ✅ Autenticación Better Auth (Email/Password)
- ✅ Variables de entorno configuradas
- ✅ Listo para producción

## Variables de Entorno Configuradas

| Variable | Valor | Propósito |
|----------|-------|----------|
| `BETTER_AUTH_SECRET` | ✅ Configurado | Encriptación de sesiones |
| `POSTGRES_URL` | ✅ Supabase | Base de datos |
| `NEXT_PUBLIC_BASE_URL` | ✅ Configurado | URL de la aplicación |
| `NEXT_PUBLIC_ALLOW_CREDENTIALS` | ✅ `true` | Habilitar login email/password |

## 🚀 Próximos Pasos

### 1. **Crear tu Primera Cuenta** (Local)
```
URL: http://localhost:3000
Email: tu@empresa.com
Password: Tu contraseña segura
```

### 2. **Deploy a Vercel** (Producción)
El proyecto está listo para deployar a Vercel de forma **gratuita**:

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio GitHub
3. Vercel auto-detectará las variables de entorno
4. Click en "Deploy"
5. ¡Listo! Tu URL será: `https://kan.vercel.app` (o similar)

### 3. **Invitar a tu Equipo de Marketing**
Una vez deployado, comparte tu URL y:
- El equipo puede registrarse con sus emails
- Crea proyectos/boards para cada campaña
- Colaboren en tiempo real

## 📊 Plan Gratuito Supabase

Tu plan incluye:

- 500 MB de base de datos
- Usuarios ilimitados
- Backups automáticos diarios
- SSL incluido
- API GraphQL automática

Es más que suficiente para un equipo de marketing.

## 💰 Presupuesto Mensual: $0

| Servicio | Plan | Costo |
|----------|------|-------|
| Supabase | Gratuito | $0 |
| Vercel | Hobby (Gratuito) | $0 |
| Dominio | Vercel.app | $0 |
| **Total Mensual** | | **$0** |

## 🔒 Seguridad

- ✅ HTTPS/SSL incluido en Vercel
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Sessiones seguras con Better Auth
- ✅ Base de datos cifrada en Supabase
- ✅ Backups automáticos incluidos

## 📝 Funcionalidades Disponibles

Tu equipo de marketing puede usar:

- **Boards:** Crear tableros por campaña (Email, Social, PPC, etc.)
- **Listas:** Organizar etapas (Planning, In Progress, Review, Done)
- **Cards:** Detalles de tareas con descripciones, comentarios
- **Colaboración:** Asignar tareas, mencionar equipo
- **Actividad:** Registro de todos los cambios
- **Comentarios:** Discusión en cada tarea

## 🛠 Personalización (Opcional)

Si necesitas agregar funcionalidades:

1. **Logo/Colors:** Edita `/apps/web/src/components/` 
2. **Dominios Personalizados:** Conecta tu dominio en Vercel
3. **OAuth (Google/Discord):** Agrega variables en Supabase
4. **Notificaciones por Email:** Configura SMTP (Resend, SendGrid - planes gratis disponibles)

## ⚠️ Limitaciones del Plan Gratuito

- Máximo 500 MB de datos (suficiente para años de datos de marketing)
- Si necesitas más: Supabase Pro = $5/mes (con hasta 8 GB)

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en Vercel dashboard
2. Verifica las variables de entorno en Supabase
3. Contacta a Vercel Support: vercel.com/help

## 🎯 Próximas Mejoras Recomendadas (Futuro)

1. Configurar Email Notifications (Resend gratis)
2. Agregar Google Calendar sync
3. Crear templates para campañas repetitivas
4. Configurar reportes semanales

---

**Versión:** 1.0  
**Última actualización:** Abril 2026  
**Equipo:** Marketing
