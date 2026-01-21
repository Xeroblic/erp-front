#!/bin/bash

# --- Configuración de colores ---
G='\033[0;32m' # Verde
B='\033[0;34m' # Azul
C='\033[0;36m' # Cian (Para el logo nuevo)
W='\033[1;37m' # Blanco
R='\033[1;31m' # Rojo Brillante
NC='\033[0m'   # Sin Color

# Función para la calavera de error
show_skull() {
    echo -e "${R}"
    echo '                          oooo$$$$$$$$$$$$oooo'
    echo '                      oo$$$$$$$$$$$$$$$$$$$$$$$$o'
    echo '                   oo$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$o         o$   $$ o$'
    echo '   o $ oo        o$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$o       $$ $$ $$o$'
    echo 'oo $ $ "$      o$$$$$$$$$    $$$$$$$$$$$$$    $$$$$$$$$o       $$$o$$o$'
    echo '"$$$$$$o$     o$$$$$$$$$      $$$$$$$$$$$      $$$$$$$$$$o    $$$$$$$$'
    echo '  $$$$$$$    $$$$$$$$$$$      $$$$$$$$$$$      $$$$$$$$$$$$$$$$$$$$$$$'
    echo '  $$$$$$$$$$$$$$$$$$$$$$$    $$$$$$$$$$$$$    $$$$$$$$$$$$$$  """$$$'
    echo '   "$$$""""$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$     "$$$'
    echo '    $$$   o$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$     "$$$o'
    echo '   o$$"   $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$       $$$o'
    echo '   $$$    $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$" "$$$$$$ooooo$$$$o'
    echo '  o$$$oooo$$$$$  $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$   o$$$$$$$$$$$$$$$$$'
    echo '  $$$$$$$$"$$$$   $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$     $$$$""""""""'
    echo ' """"       $$$$    "$$$$$$$$$$$$$$$$$$$$$$$$$$$$"      o$$$'
    echo '            "$$$o     """$$$$$$$$$$$$$$$$$$"$$"         $$$'
    echo '              $$$o          "$$""$$$$$$""""           o$$$'
    echo '               $$$$o                 oo             o$$$"'
    echo '                "$$$$o      o$$$$$$o"$$$$o        o$$$$'
    echo '                  "$$$$$oo     ""$$$$o$$$$$o   o$$$$""'
    echo '                     ""$$$$$oooo  "$$$o$$$$$$$$$"""'
    echo '                        ""$$$$$$$oo $$$$$$$$$$'
    echo '                                """"$$$$$$$$$$$'
    echo '                                    $$$$$$$$$$$$'
    echo '                                     $$$$$$$$$$"'
    echo '                                       "$$$""""'
    echo -e "${NC}"
}

clear

# Banner de Bienvenida: Dragon (Azul) + Zentria (Cian)
echo -e "${B}        _          ${NC}"
echo -e "${B}       / \      _-'${NC}${C}   ________    _______  _____  ___  ___________  _______    __          __ ${NC}"
echo -e "${B}     _/|  \-''- _ /${NC}${C} (\"      \"\\  /\"     \"|(\"   \\|\"  \\(\"      _   \")/\"     \\  |\" \\        /\"\"\\     ${NC}"
echo -e "${B}__-' { |          \\${NC}${C}  \\___/   :)(: ______)|.\\\\   \\   |)__/  \\\\__/|:        | ||  |      /    \\    ${NC}"
echo -e "${B}    /             \\${NC}${C}    /   ___/  \\/    |  |: \\.   \\\\  |   \\\\_ /   |_____/   ) |:  |     /' /\\  \\   ${NC}"
echo -e "${B}    /       \"o.  |o }${NC}${C}  //   \\__   // ___)_ |.  \\   \\  . |   |.  |    //      /  |.  |    //  __'  \\  ${NC}"
echo -e "${B}    |            \\ ; ${NC}${C} (:   / \"\\ (:      \"||    \\   \\ |   \\:  |   |:  __   \\  /\\  |\\  /   /  \\\\  \\ ${NC}"
echo -e "${B}                  ', ${NC}${C}  \\_______) \\_______) \\___|\\____\\)    \\__|   |__|  \\___)(__\\_|_)(___/    \\___)${NC}"
echo -e "${B}       \\         __\\${NC}"
echo -e "${B}         ''-_    \\.//${NC}"
echo -e "${B}           / '-____'${NC}"
echo -e "${B}          /         ${NC}"
echo -e "${B}        _'          ${NC}"
echo -e "${B}      _-'           ${NC}"

echo -e "\n${W}--- SISTEMA DE DESPLIEGUE INICIADO ---${NC}\n"

# 1. Validar branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${R}[ERROR] Branch actual incorrecta ($CURRENT_BRANCH).${NC}"
    show_skull
    exit 1
fi

# 2. Input del mensaje
echo -e "${W}>> Mensaje del commit:${NC}"
read -r COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    echo -e "${R}[ERROR] El mensaje es obligatorio para continuar.${NC}"
    exit 1
fi

# 3. Git Add y Commit
echo -e "\n${B}[1/5] Congelando cambios actuales...${NC}"
git add .
git commit -m "$COMMIT_MSG"

# 4. Build con validacion
echo -e "${B}[2/5] Verificando estabilidad del proyecto (npm run build)...${NC}"
if npm run build; then
    echo -e "${G}[OK] Build completado sin errores.${NC}"
else
    echo -e "\n${R}!!! ERROR DE COMPILACION DETECTADO !!!${NC}"
    show_skull
    exit 1
fi

# 5. Push develop
echo -e "\n${B}[3/5] Actualizando servidor (develop)...${NC}"
git push origin develop

# 6. Merge a Main
echo -e "${B}[4/5] Promocionando cambios a producción (main)...${NC}"
git checkout main > /dev/null 2>&1
git merge develop
git push origin main

# 7. Volver a develop
echo -e "${B}[5/5] Restaurando entorno de trabajo...${NC}"
git checkout develop > /dev/null 2>&1

echo -e "\n${G}>>> PROCESO ZENTRIA FINALIZADO CON ÉXITO <<<${NC}\n"

# Iniciar dev
npm run dev