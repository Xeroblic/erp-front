#!/bin/bash

# --- Configuración de colores y estilo ---
# Usamos códigos ANSI para darle estilo sin emojis
G='\033[0;32m' # Verde
B='\033[0;34m' # Azul
W='\033[1;37m' # Blanco Brillante
R='\033[0;31m' # Rojo
NC='\033[0m'    # No Color

clear

# Banner ASCII Inicial
echo -e "${B}"
echo "  ________________________________________________"
echo " |                                                |"
echo " |   ZENTRIA DEPLOYMENT SYSTEM - V1.0             |"
echo " |________________________________________________|"
echo -e "${NC}"

# 1. Validar que estamos en develop
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${R}[ERROR] Branch actual: $CURRENT_BRANCH${NC}"
    echo -e "${R}Debes estar en 'develop' para ejecutar el deploy.${NC}"
    exit 1
fi

# 2. Input del mensaje
echo -e "${W}>> Mensaje del commit:${NC}"
read -r COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    echo -e "${R}[ERROR] El commit no puede estar vacio.${NC}"
    exit 1
fi

# 3. Git Add y Commit
echo -e "\n${B}[1/5] Indexando y guardando cambios...${NC}"
git add .
git commit -m "$COMMIT_MSG"

# 4. PRUEBA DE FUEGO con simulacion de carga
echo -e "${B}[2/5] Iniciando compilacion de prueba (npm run build)...${NC}"
echo -ne "${W}PROCESANDO [          ] (0%)\r"
sleep 0.5
echo -ne "${W}PROCESANDO [#####     ] (50%)\r"

if npm run build; then
    echo -ne "${G}PROCESANDO [##########] (100%)${NC}\n"
    echo -e "${G}[OK] Build completado con exito.${NC}"
else
    echo -e "\n${R}[FALLO] Error en el Build. Abortando merge a main.${NC}"
    exit 1
fi

# 5. Push a develop
echo -e "\n${B}[3/5] Sincronizando rama 'develop'...${NC}"
git push origin develop

# 6. Salto a Main y Merge
echo -e "${B}[4/5] Transfiriendo cambios a 'main'...${NC}"
git checkout main > /dev/null 2>&1
git merge develop
git push origin main

# 7. Retorno
echo -e "${B}[5/5] Finalizando tareas de limpieza...${NC}"
git checkout develop > /dev/null 2>&1

echo -e "\n${G}------------------------------------------------${NC}"
echo -e "${G}  DESPLIEGE FINALIZADO CORRECTAMENTE${NC}"
echo -e "${G}------------------------------------------------${NC}"

# Reiniciar entorno
echo -e "${W}>> Reiniciando entorno de desarrollo (npm run dev)...${NC}\n"
npm run dev