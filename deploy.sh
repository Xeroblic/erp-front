#!/bin/bash

# 1. Validar que estamos en develop
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo "❌ Error: Debes estar en la rama 'develop' para correr este script."
  exit 1
fi

# 2. Pedir el mensaje del commit (soporta espacios)
echo "📝 Ingresa el mensaje del commit:"
read -r COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
  echo "❌ Error: El mensaje del commit no puede estar vacío."
  exit 1
fi

# 3. Git Add y Commit en develop
echo "📦 Guardando cambios..."
git add .
git commit -m "$COMMIT_MSG"

# 4. PRUEBA DE FUEGO: npm run build
echo "🚀 Ejecutando build de prueba..."
if npm run build; then
    echo "✅ Build exitoso. Procediendo con el despliegue..."
else
    echo "⚠️ Error: El BUILD falló. El proceso se detuvo para proteger 'main'."
    exit 1
fi

# 5. Push a develop
echo "⬆️ Subiendo a develop..."
git push origin develop

# 6. Salto a Main y Merge
echo "🔀 Mergeando a main..."
git checkout main
git merge develop
git push origin main

# 7. Volver a develop y seguir trabajando
echo "🔙 Volviendo a develop..."
git checkout develop

echo "🔥 ¡Todo listo! Iniciando entorno de desarrollo..."
npm run dev