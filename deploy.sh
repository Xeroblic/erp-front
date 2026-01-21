#!/bin/bash

# --- Configuración de colores ---
G='\033[0;32m' # Verde
B='\033[0;34m' # Azul
C='\033[0;36m' # Cian
W='\033[1;37m' # Blanco
R='\033[1;31m' # Rojo Brillante
NC='\033[0m'   # Sin Color

# Función para la calavera de error
show_skull() {
    echo -e "${R}"
    cat << 'EOF'
                          oooo$$$$$$$$$$$$oooo
                      oo$$$$$$$$$$$$$$$$$$$$$$$$o
                   oo$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$o         o$   $$ o$
   o $ oo        o$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$o       $$ $$ $$o$
oo $ $ "$      o$$$$$$$$$    $$$$$$$$$$$$$    $$$$$$$$$o       $$$o$$o$
"$$$$$$o$     o$$$$$$$$$      $$$$$$$$$$$      $$$$$$$$$$o    $$$$$$$$
  $$$$$$$    $$$$$$$$$$$      $$$$$$$$$$$      $$$$$$$$$$$$$$$$$$$$$$$
  $$$$$$$$$$$$$$$$$$$$$$$    $$$$$$$$$$$$$    $$$$$$$$$$$$$$  """$$$
   "$$$""""$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$     "$$$
    $$$   o$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$     "$$$o
   o$$"   $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$       $$$o
   $$$    $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$" "$$$$$$ooooo$$$$o
  o$$$oooo$$$$$  $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$   o$$$$$$$$$$$$$$$$$
  $$$$$$$$"$$$$   $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$     $$$$""""""""
 """"       $$$$    "$$$$$$$$$$$$$$$$$$$$$$$$$$$$"      o$$$
            "$$$o     """$$$$$$$$$$$$$$$$$$"$$"         $$$
              $$$o          "$$""$$$$$$""""           o$$$
               $$$$o                 oo             o$$$"
                "$$$$o      o$$$$$$o"$$$$o        o$$$$
                  "$$$$$oo     ""$$$$o$$$$$o   o$$$$""
                     ""$$$$$oooo  "$$$o$$$$$$$$$"""
                        ""$$$$$$$oo $$$$$$$$$$
                                """"$$$$$$$$$$$
                                    $$$$$$$$$$$$
                                     $$$$$$$$$$"
                                       "$$$""""
EOF
    echo -e "${NC}"
}

render_final_art() {
    cat << 'EOF'
 iiiiiiiiiiiiii:ii:::::...:......                             ...........::::
 iiiiiiiiii:ii::..:.......         :.......:...........:........         ...:
 iiiii:ii::.:....          .....:.....:::::::iii:iiii:ii:::::::::...:.....:..
 iiiii::..::..   ...:.....:::iiiii:iiiiiii:iiiiiiiiiiiiiiiii:iiii:ii:iiiii:::
 iii:i:::....:...::::::iiiiiiii:iiiiii:iiiiii:iiiiii:iiiiiiiiiiiiiiiiiiiiiiii
 iiiiii:::::::::::iiiii:iiii::i:::::i:::::i::::::::i::::i::iiiiiiiiiiiiiiiii:
 iiiiiii:iiiiii:iiiii:i:::::::: :: ::: ::: ::::: ::: ::: ::::i:ii:iiii:iii:i:
 iiiiiiiiii:iiiii:i:::::::: ::    ::  ::  :: .. ..   ... ...: :: ::::i:::i::::
 iiii:iiiiii::i::::i:::: :           GRACIAS <3           .... :::: :::::::..
 iiiiiii::i::i::::::: :   ..d8"    d8b      ..         .  .    ... ::: :::...
 i:iii:i:::::::::: :   .aT8888".`:. `"'  8    .:....:.   "b. ..    .... ......
 ii:::::i:::::: :   .a88888888::.:::.::..     ..:..:..:.. 88b. ...     ... ,. 
 :::i:::::::::   .aT8888888888:::::i:::;::...::.::.::.::..8888Tb. ...     ...   
 i::::::::::   .dT888888888888b:i:;;i:i::i:::ii::;i;;;:i:d8888TTTb   ...  
 :::::::: :   dTTT8888888888888b;ii;;i;i;iii;;iii;;i;i;:d888TTTTTTb
 ::::: : :   dTTTTTTTTTTTTTTTTTTTbiiii;;iiiiiiiiiii;idTTTTTTTIITTTTP          
 :::::: :    "YTTTTTTTTTTTTTTTTTTTTTTIIIIIIIIIIIIIIIIIIIIIIIIIMRK""      . :  
 ::: : : :: ..   """"""YTTTIIIIIIIIIIIIIIIIIIIIIIIIIIIIITP"""          : .:: 
 :::: ::: :: :::.....           """"""""""""""""""""""""           .: ..::::::
 : ::::::::::i:::::::::::::::.....  .    .  .   .   .   . . :  : ::::::i:::::
 ::::::::i::::ii:i:iii:ii::::::::::::::::::::::::::::::::::::::::ii:ii:i::i::
 ::::::::::i:i:iiiii:iii:i:ii:iiii:iiii:iiiii:iii:iiiii:ii:iiii:iiiiiiiiiii:i
 : :::::i::i:ii:iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
EOF
}

finalizar() {
    for i in {1..3}
    do
        clear
        echo -e "${W}"
        render_final_art
        sleep 0.2
        clear
        echo -e "${G}"
        render_final_art
        sleep 0.2
    done
    echo -e "\n${G}>>> PROCESO ZENTRIA FINALIZADO CON ÉXITO <<<${NC}\n"
}

clear

# Banner de Bienvenida blindado
echo -e "${B}        _          ${NC}"
echo -ne "${B}       / \      _-' ${NC}" ; echo -e "${C} ________    _______  _____  ___  ___________  _______    __          __      ${NC}"
echo -ne "${B}     _/|  \-''- _ / ${NC}" ; echo -e "${C} (\"      \"\\  /\"     \"|(\"   \\|\"  \\(\"      _   \")/\"     \\  |\" \\        /\"\"\\     ${NC}"
echo -ne "${B}__-' { |          \\ ${NC}" ; echo -e "${C}  \\___/   :)(: ______)|.\\\\   \\   |)__/  \\\\__/|:        | ||  |      /    \\    ${NC}"
echo -ne "${B}    /             \\ ${NC}" ; echo -e "${C}    /   ___/  \\/    |  |: \\.   \\\\  |   \\\\_ /   |_____/   ) |:  |     /' /\\  \\   ${NC}"
echo -ne "${B}    /       \"o.  |o } ${NC}" ; echo -e "${C}  //   \\__   // ___)_ |.  \\   \\  . |   |.  |    //      /  |.  |    //  __'  \\  ${NC}"
echo -ne "${B}    |            \\ ;  ${NC}" ; echo -e "${C} (:   / \"\\ (:      \"||    \\   \\ |   \\:  |   |:  __   \\  /\\  |\\  /   /  \\\\  \\ ${NC}"
echo -ne "${B}                  ',  ${NC}" ; echo -e "${C}  \\_______) \\_______) \\___|\\____\\)    \\__|   |__|  \\___)(__\\_|_)(___/    \\___)${NC}"
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
    echo -e "${R}[ERROR] Mensaje vacio.${NC}"
    exit 1
fi

# 3. Git Add y Commit
echo -e "\n${B}[1/5] Guardando cambios...${NC}"
git add .
git commit -m "$COMMIT_MSG"

# 4. Build
echo -e "${B}[2/5] Corriendo npm run build...${NC}"
if npm run build; then
    echo -e "${G}[OK] Build exitoso.${NC}"
else
    show_skull
    exit 1
fi

# 5. Push develop
echo -e "\n${B}[3/5] Push a develop...${NC}"
git push origin develop

# 6. Merge a Main
echo -e "${B}[4/5] Merge a main...${NC}"
git checkout main > /dev/null 2>&1
git merge develop
git push origin main

# 7. Volver a develop
echo -e "${B}[5/5] Volviendo a develop...${NC}"
git checkout develop > /dev/null 2>&1

# Pregunta final
echo -ne "\n${W}¿Deseas iniciar el servidor de desarrollo (npm run dev)? (s/n): ${NC}"
read -r START_DEV

if [[ "$START_DEV" =~ ^[sS]$ ]]; then
    npm run dev
else
    finalizar
fi