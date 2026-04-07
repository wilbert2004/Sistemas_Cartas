#!/bin/bash
# Script de verificación rápida para redirecciones seguras entre entornos

echo "🔍 Verificando configuración de redirecciones..."
echo ""

# 1. Verificar .env.local
echo "1️⃣ Verificando .env.local..."
if grep -q "NEXT_PUBLIC_SITE_URL=http://localhost:3000" .env.local; then
    echo "   ✅ NEXT_PUBLIC_SITE_URL está configurado correctamente"
else
    echo "   ❌ NEXT_PUBLIC_SITE_URL no está en .env.local o tiene valor incorrecto"
    echo "   Agreaga: NEXT_PUBLIC_SITE_URL=http://localhost:3000"
fi
echo ""

# 2. Verificar que no haya hardcodes a Vercel
echo "2️⃣ Buscando URLs hardcodeadas a Vercel/producción..."
if grep -r "sistemas-cartas\.vercel\|https://[a-z]*\.vercel\|https://[a-z]*-[a-z]*\.app" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"; then
    echo "   ⚠️  Se encontraron referencias a URLs de producción"
else
    echo "   ✅ No hay URLs hardcodeadas a producción"
fi
echo ""

# 3. Verificar que getBaseUrl esté usado
echo "3️⃣ Verificando que getBaseUrl se usa correctamente..."
if [[ -f "src/lib/getBaseUrl.ts" ]]; then
    echo "   ✅ src/lib/getBaseUrl.ts existe"
    if grep -q "import { getBaseUrl }" src/app/api/crear-suscripcion/route.ts; then
        echo "   ✅ crear-suscripcion/route.ts importa getBaseUrl"
    else
        echo "   ❌ crear-suscripcion/route.ts no importa getBaseUrl"
    fi
else
    echo "   ❌ src/lib/getBaseUrl.ts no existe"
fi
echo ""

# 4. Verificar que window.location.origin se usa en auth
echo "4️⃣ Verificando enviarCorreoRecuperacion..."
if grep -q "window.location.origin" src/services/auth.service.ts; then
    echo "   ✅ auth.service.ts usa window.location.origin"
else
    echo "   ❌ auth.service.ts no usa window.location.origin correctamente"
fi
echo ""

# 5. Sugerencias para verificación manual
echo "5️⃣ Pasos para verificación manual en el navegador:"
echo "   a) Abre http://localhost:3000"
echo "   b) Presiona F12 (DevTools)"
echo "   c) Abre la pestaña 'Network'"
echo "   d) Intenta hacer login"
echo "   e) Verifica que TODAS las requests sean a localhost"
echo "      (NO debe haber requests a sistemas-cartas.vercel.app)"
echo ""

echo "✅ Verificación completada"
echo ""
echo "Para más información, consulta: REDIRECTS-GUIDE.md"
