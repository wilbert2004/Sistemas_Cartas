# Guía de Redirecciones Seguras entre Entornos

Este documento describe cómo manejar redirecciones seguras entre localhost (desarrollo) y producción (Vercel).

## ✅ Arreglado

### 1. **URLs Hardcodeadas Eliminadas**

- ❌ ANTES: `redirectTo: 'http://localhost:3000/update-password'`
- ✅ AHORA: Usa `window.location.origin` en cliente + `NEXT_PUBLIC_SITE_URL` en servidor

**Archivo:** `src/services/auth.service.ts` - Función `enviarCorreoRecuperacion()`

```typescript
// Patrón correcto para construir URLs
const baseUrl =
  typeof window !== "undefined"
    ? window.location.origin // Cliente: http://localhost:3000
    : (process.env.NEXT_PUBLIC_SITE_URL ?? // SSR: usa env var
      "http://localhost:3000"); // Fallback

redirectTo: `${baseUrl}/update-password`;
```

### 2. **Helper Reutilizable Creado**

**Archivo:** `src/lib/getBaseUrl.ts`

```typescript
import { getBaseUrl } from "@/lib/getBaseUrl";

// En endpoints:
const baseUrl = getBaseUrl(request); // Automáticamente detecta el ambiente
```

Ventajas:

- No duplicar lógica en cada endpoint
- Consistencia entre todos los endpoints
- Fácil de mantener

### 3. **Variables de Entorno Agregadas**

**Archivo:** `.env.local`

```
# URL base del sitio (se usa en email links, webhooks callbacks, etc.)
# En local: http://localhost:3000
# En producción: configura la URL de tu dominio
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🔍 Patrones Implementados

### Patrón 1: Redirecciones Relativas (✅ Correcto)

```typescript
// ✅ BIEN - Funciona en cualquier entorno
router.replace("/dashboard");
router.push("/login");
redirect("/update-password");
```

### Patrón 2: URLs Dinámicas (✅ Correcto)

```typescript
// ✅ BIEN - Cliente
const baseUrl = window.location.origin;
const fullUrl = `${baseUrl}/callback`;

// ✅ BIEN - Servidor
const baseUrl = getBaseUrl(request);
const fullUrl = `${baseUrl}/callback`;
```

### Patrón 3: Variables de Entorno (✅ Correcto)

```typescript
// ✅ BIEN - Público (accesible en cliente)
process.env.NEXT_PUBLIC_SITE_URL;

// ✅ BIEN - Privado (solo servidor)
process.env.MERCADOPAGO_WEBHOOK_SECRET;
```

## ❌ Antipatrones (Evitar)

```typescript
// ❌ MAL - Hardcodeado
redirectTo: "http://localhost:3000/update-password";
redirectTo: "https://sistemas-cartas.vercel.app/dashboard";
href: "http://localhost:3000/login";

// ❌ MAL - Variables privadas en cliente
window.location.href = process.env.BACKEND_URL; // undefined en cliente!

// ❌ MAL - fetch sin protocolo completo
fetch("/api/..."); // OK si es relativo, MALO si mezclas http/https
```

## 🚀 Configuración por Entorno

### Local (`npm run dev`)

```
.env.local debe tener:
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # ← IMPORTANTE
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_PUBLIC_KEY=TEST-...
```

**Verificar:**

- ✅ Login en `http://localhost:3000` funciona
- ✅ Dashboard se mantiene en `http://localhost:3000`
- ✅ No hay redirecciones a `https://sistemas-cartas.vercel.app`

### Producción (Vercel)

1. **Ir a Vercel Dashboard**
2. **Project Settings → Environment Variables**
3. **Agregar para todas las ramas (Production/Preview/Development):**

```
NEXT_PUBLIC_SUPABASE_URL=https://rqgevatbiqabjyzwiors.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=https://sistemas-cartas.vercel.app  # ← Tu URL de producción

SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_PUBLIC_KEY=...
MERCADOPAGO_WEBHOOK_SECRET=...

CRON_SECRET=tu_secret_aqui
```

4. **Redeploy** después de agregar variables

## 🔧 Endpoints Actualizar Automáticamente

Estos endpoints ahora usan `getBaseUrl()` correctamente:

- ✅ `src/app/api/crear-suscripcion/route.ts` - MercadoPago callbacks
- ✅ `src/services/auth.service.ts` - Recuperación de contraseña
- ✅ `src/lib/getBaseUrl.ts` - Helper reutilizable

## 🐛 Debugging: Si Sigue Redirigiendo a Vercel

### Checklist:

1. **Verificar browser console (F12)**
   - ¿Hay errores de red?
   - ¿Qué URL se ve en la barra de direcciones?
   - ¿Se ve `localhost:3000` o el dominio de Vercel?

2. **Verificar terminal del servidor (`npm run dev`)**
   - ¿Hay errores en los logs?
   - ¿Se hace fetch a endpoints correctos?

3. **Verificar `LocalStorage` y `Cookies`**

   ```javascript
   // En console (F12):
   localStorage.clear();
   sessionStorage.clear();
   document.cookie.split(";").forEach((c) => {
     document.cookie =
       c.split("=")[0].trim() +
       "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
   });
   location.reload();
   ```

4. **Verificar `.env.local`**

   ```bash
   # Terminal (en la carpeta del proyecto):
   cat .env.local | grep -E "SITE_URL|VERCEL"
   ```

   - ¿Hay referencias a Vercel?
   - ¿`NEXT_PUBLIC_SITE_URL` está en `http://localhost:3000`?

5. **Reiniciar servidor dev**

   ```bash
   # Termina npm run dev (Ctrl+C)
   # y vuelve a ejecutar:
   npm run dev
   ```

6. **Limpiar caché de Next.js**
   ```bash
   rm -rf .next
   npm run dev
   ```

## 📝 Cambios Realizados

**Fecha:** 7 de abril de 2026

### Archivos Modificados:

1. ✅ `.env.local` - Agregado `NEXT_PUBLIC_SITE_URL`
2. ✅ `src/services/auth.service.ts` - `enviarCorreoRecuperacion()` ahora usa `window.location.origin`
3. ✅ `src/lib/getBaseUrl.ts` - CREADO - Helper reutilizable
4. ✅ `src/app/api/crear-suscripcion/route.ts` - Ahora importa y usa `getBaseUrl()`

### Resultado Esperado:

- ✅ En localhost → todo permanece en `localhost:3000`
- ✅ En producción → todo está en `https://sistemas-cartas.vercel.app`
- ✅ No hay redirecciones cruzadas entre ambientes

## 📚 Recursos

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [MDN: window.location.origin](https://developer.mozilla.org/en-US/docs/Web/API/window.location)
