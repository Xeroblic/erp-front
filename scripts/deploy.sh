#!/bin/bash

# --- Configuración de colores ---
G='\033[0;32m'
B='\033[0;34m'
C='\033[0;36m'
W='\033[1;37m'
R='\033[1;31m'
NC='\033[0m'   

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

# --- FRAMES DE LA ANIMACIÓN (PROPORCIONADOS POR EL USUARIO) ---

f1() {
cat << 'EOF'
iiiiiiiiiiiiii:ii:::::...:......                             ...........::::
iiiiiiiiii:ii::..:.......         :.......:...........:........         ...:
iiiii:ii::.:....          .....:.....:::::::iii:iiii:ii:::::::::...:.....:..
iiiii::..::..   ...:.....:::iiiii:iiiiiii:iiiiiiiiiiiiiiiii:iiii:ii:iiiii:::
iii:i:::....:...::::::iiiiiiii:iiiiii:iiiiii:iiiiii:iiiiiiiiiiiiiiiiiiiiiiii
iiiiii:::::::::::iiiii:iiii::i:::::i:::::i::::::::i::::i::iiiiiiiiiiiiiiiii:
iiiiiii:iiiiii:iiiii:i:::::::: :: ::: ::: ::::: ::: ::: ::::i:ii:iiii:iii:i:
iiiiiiiiii:iiiii:i:::::::: ::    ::  ::  :: .. ..  ... ...: :: ::::i:::i::::
iiii:iiiiii::i::::i:::: :                                .... :::: :::::::..
iiiiiii::i::i::::::: :   ..d8"    d8b      ..         .  .    ... ::: :::...
i:iii:i:::::::::: :  .aT8888".`:. `"'  8    .:....:.   "b. ..    .... ......
ii:::::i:::::: :  .a88888888::.:::.::..     ..:..:..:.. 88b. ...     ... ,. 
:::i:::::::::  .aT8888888888:::::i:::;::...::.::.::.::..8888Tb. ...    ...   
i::::::::::  .dT888888888888b:i:;;i:i::i:::ii::;i;;;:i:d8888TTTb  ...  
:::::::: :  dTTT8888888888888b;ii;;i;i;iii;;iii;;i;i;:d888TTTTTTb
::::: : :  dTTTTTTTTTTTTTTTTTTTbiiii;;iiiiiiiiiii;idTTTTTTTIITTTTP          
:::::: :   "YTTTTTTTTTTTTTTTTTTTTTTIIIIIIIIIIIIIIIIIIIIIIIIIMRK""      . :  
::: : : :: ..   """"""YTTTIIIIIIIIIIIIIIIIIIIIIIIIIIIIITP"""          : .:: 
:::: ::: :: :::.....           """""""""""""""""""""""           .: ..::::::
: ::::::::::i:::::::::::::::.....  .    .  .   .   .   . . :  : ::::::i:::::
::::::::i::::ii:i:iii:ii::::::::::::::::::::::::::::::::::::::::ii:ii:i::i::
::::::::::i:i:iiiii:iii:i:ii:iiii:iiii:iiiii:iii:iiiii:ii:iiii:iiiiiiiiiii:i
::::::i::i:ii:iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
EOF
}

f2() {
cat << 'EOF'
iiiiiiiiiiiiii:ii:::::...:......                             ...........::::
iiiiiiiiii:ii::..:.......         :.......:...........:........         ...:
iiiii:ii::.:....          .....:.....:::::::iii:iiii:ii:::::::::...:.....:..
iiiii::..::..   ...:.....:::iiiii:iiiiiii:iiiiiiiiiiiiiiiii:iiii:ii:iiiii:::
iii:i:::....:...::::::iiiiiiii:iiiiii:iiiiii:iiiiii:iiiiiiiiiiiiiiiiiiiiiiii
iiiiii:::::::::::iiiii:iiii::i:::::i:::::i::::::::i::::i::iiiiiiiiiiiiiiiii:
iiiiiii:iiiiii:iiiii:i:::::::: :: ::: ::: ::::: ::: ::: ::::i:ii:iiii:iii:i:
iiiiiiiiii:iiiii:i:::::::: ::    ::  ::  :: .. ..  ... ...: :: ::::i:::i::::
iiii:iiiiii::i::::i:::: :                                .... :::: :::::::..
iiiiiii::i::i::::::: :   ..d8"    d8b      ..         .  .    ... ::: :::...
i:iii:i:::::::::: :  .aT8888".`:. `"'  8    .:....:.   "b. ..    .... ......
ii:::::i:::::: :  .a88888888::.:::.::..     ..:..:..:.. 88b. ...     ... ,. 
:::i:::::::::  .aT8888888888:::::i:::;::...::.::.::.::..8888Tb. ...    ...   
i::::::::::  .dT888888888888b:i:;;i:i::i:::ii::;i;;;:i:d8888TTTb  ...  
:::::::: :  dTTT8888888888888b;ii;;i;i;iii;;iii;;i;i;:d888TTTTTTb
::::: : :  dTTTTTTTTTTTTTTTTTTTbiiii;;iiiiiiiiiii;idTTTTTTTIITTTTP          
:::::: :   "YTTTTTTTTTTTTTTTTTTTTTTIIIIIIIIIIIIIIIIIIIIIIIIIMRK""      . :  
::: : : :::::.. """"""YTTTIIIIIIIIIIIIIIIIIIIIIIIIIIIIITP"""     .:::::: .:: 
:::: ::: :: :::::::::::::::::::::::::::::::::::::::::...........::::::::::::
: ::::::::::i:::::::::::::::::::::::::::::::::::::::::::::::  : ::::::i:::::
::::::::i::::ii:i:iii:ii::::::::::::::::::::::::::::::::::::::::ii:ii:i::i::
::::::::::i:i:iiiii:iii:i:ii:iiii:iiii:iiiii:iii:iiiii:ii:iiii:iiiiiiiiiii:i
::::::i::i:ii:iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
EOF
}

f3() {
cat << 'EOF'
iiiiiiiiiiiiii:ii:::::...:......                             ...........::::
iiiiiiiiii:ii::..:.......         :.......:...........:........         ...:
iiiii:ii::.:....          .....:.....:::::::iii:iiii:ii:::::::::...:.....:..
iiiii::..::..   ...:.....:::iiiii:iiiiiii:iiiiiiiiiiiiiiiii:iiii:ii:iiiii:::
iii:i:::....:...::::::iiiiiiii:iiiiii:iiiiii:iiiiii:iiiiiiiiiiiiiiiiiiiiiiii
iiiiii:::::::::::iiiii:iiii::i:::::i:::::i::::::::i::::i::iiiiiiiiiiiiiiiii:
iiiiiii:iiiiii:iiiii:i:::::::: :: ::: ::: ::::: ::: ::: ::::i:ii:iiii:iii:i:
iiiiiiiiii:iiiii:i:::::::: ::    ::  ::  :: .. ..  ... ...: :: ::::i:::i::::
iiii:iiiiii::i::::i:::: :                                .... :::: :::::::..
iiiiiii::i::i::::::: :   ..d8"    d8b      ..         .  .    ... ::: :::...
i:iii:i:::::::::: :  .aT8888".`:. `"'  8    .:....:.   "b. ..    .... ......
ii:::::i:::::: :  .a88888888::.:::.::..     ..:..:..:.. 88b. ...     ... ,. 
:::i:::::::::  .aT8888888888:::::i:::;::...::.::.::.::..8888Tb. ...    ...   
i::::::::::  .dT888888888888b:i:;;i:i::i:::ii::;i;;;:i:d8888TTTb  ...  
:::::::: :  dTTT8888888888888b;ii;;i;i;iii;;iii;;i;i;:d888TTTTTTb       .:::
::::: : :  dTTTTTTTTTTTTTTTTTTTbiiii;;iiiiiiiiiii;idTTTTTTTIITTTTP    ..:::: 
:::::: : :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::  
::: : : :::::.iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii.:::::: .:: 
:::: ::: :: :::::::::::::::::::::::::::::::::::::::::iiiiiiiiiii::::::::::::
: ::::::::::i:::::::::::::::::::::::::::::::::::::::::::::::iiii::::::i:::::
::::::::i::::ii:i:iii:ii:::::::::::::::::::::::::::::::::::::ii:ii:ii:i::i::
::::::::::i:i:iiiii:iii:i:ii:iiii:iiii:iiiii:iii:iiiii:ii:iiii:iiiiiiiiiii:i
::::::i::i:ii:iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
EOF
}

f4() {
cat << 'EOF'
iiiiiiiiiiiiii:ii:::::...:......                             ...........::::
iiiiiiiiii:ii::..:.......         :.......:...........:........         ...:
iiiii:ii::.:....          .....:.....:::::::iii:iiii:ii:::::::::...:.....:..
iiiii::..::..   ...:.....:::iiiii:iiiiiii:iiiiiiiiiiiiiiiii:iiii:ii:iiiii:::
iii:i:::....:...::::::iiiiiiii:iiiiii:iiiiii:iiiiii:iiiiiiiiiiiiiiiiiiiiiiii
iiiiii:::::::::::iiiii:iiii::i::iiiii::iiiiii:iiii:iii:i::iiiiiiiiiiiiiiiii:
iiiiiii:iiiiii:iiiii:i::iii:iiii:iiiiii:iiii:ii:::iiiiiii:::i:ii:iiii:iii:i:
iiiiiiiiii:iiiii:i::::::::i::iiiii:::iiiiiiiiiiiii:iiiiiiii: :: ::::i:::i:::
iiii:iiiiii:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:...:i:i:i:i:i:i:i:i:i:i:i:i:::::::
iiiiiii:i:i:i:i:i:i:i:i: ..d8"    d8b      ..         .  .i:i:i:i:i:i:::...
i:iii:i:::::::::: :   .aT8888".`:. `"'  8    .:....:.   "b. ..    .... .....
ii:::::i:::::: :   .a88888888::.:::.::..     ..:..:..:.. 88b. ...     ... ,. 
:::i:::::::::   .aT8888888888:::::i:::;::...::.::.::.::..8888Tb. ...    ...   
i::::::::::   .dT888888888888b:i:;;i:i::i:::ii::;i;;;:i:d8888TTTb  ...  
:::::::: : :::::.. """"""YTTTIIIIIIIIIIIIIIIIIIIIIIIIIIIIITP"""      .::::::
:::: ::: :: :::::::::::::::::::::::::::::::::::::::::...........::::::::::::
: ::::::::::i:::::::::::::::::::::::::::::::::::::::::::::::  : ::::::i:::::
::::::::i::::ii:i:iii:ii::::::::::::::::::::::::::::::::::::::::ii:ii:i::i::
::: : : :::::.iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii.:::::: .:: 
:::: ::: :: :::::::::::::::::::::::::::::::::::::::::iiiiiiiiiii::::::::::::
: ::::::::::i:::::::::::::::::::::::::::::::::::::::::::::::iiii::::::i:::::
::::::::i::::ii:i:iii:ii:::::::::::::::::::::::::::::::::::::ii:ii:ii:i::i::
::::::::::i:i:iiiii:iii:i:ii:iiii:iiii:iiiii:iii:iiiii:ii:iiii:iiiiiiiiiii:i
::::::i::i:ii:iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
EOF
}

f5() {
cat << 'EOF'
iiiiiiiiiiiiii:ii:::::...:......                             ...........::::
iiiiiiiiii:ii::..:.......         :.......:...........:........         ...:
iiiii:ii::.:....          .....:.....:::::::iii:iiii:ii:::::::::...:.....:..
iiiii::..::..   ...:.....:::iiiii:iiiiiii:iiiiiiiiiiiiiiiii:iiii:ii:iiiii:::
iii:i:::....:...::::::iiiiiiii:iiiiii:iiiiii:iiiiii:iiiiiiiiiiiiiiiiiiiiiiii
iiiiii:::::::::::iiiii:iiii::iiiiii:iiiiii:iiiiii:iiiiii::iiiiiiiiiiiiiiiii:
iiiiiii:iiiiii:iiiii:i:::::iiii::iiii:iii:iii:ii:iiiiiiii:::i:ii:iiii:iii:i:
iiiiiiiiii:iiiii:i:iiiii:ii::iiii::ii::  :: iiiiiiiiiii ...: :: ::::i:::i:::
iiii:iiiiii:i::::: :::: ::::::i:  i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:::::::
iiiiiii:i: : :::i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i:i i:i:i:..
i:iii:i:i:::::i::ii¨   ,T8888".`:. `"'  8    .:....:.   "b.::.i:i:::i:i:i:i..
ii:::::i:i:i:i:i":: .aT8888888::.:::.::..     ..:..:..:..   :::i:::i:i:i:,.:
::::::::iii:::¨¨¨ .,,aT88888888b;ii;;i;i;iii;;iii;;i;i88:      ..:I:iiii:i:i
::::: : :  iiiiiiiiiiiiiiiiiiiibiiii;;iiiiiiiiiii;i8888i  :i:iI:i:iii.i:i:i 
:::::: : :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::  
::: : : :::::.iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii.:::::: .:: 
:::: ::: :: :::::::::::::::::::::::::::::::::::::::::iiiiiiiiiii::::::::::::
: ::::::::::i:::::::::::::::::::::::::::::::::::::::::::::::iiii::::::i:::::
::::::::i::::ii:i:iii:ii:::::::::::::::::::::::::::::::::::::ii:ii:ii:i::i::
EOF
}

finalizar() {
    for k in {1..3}
    do
        clear; echo -e "${G}"; f1; sleep 0.1
        clear; echo -e "${G}"; f2; sleep 0.1
        clear; echo -e "${G}"; f3; sleep 0.1
        clear; echo -e "${G}"; f4; sleep 0.1
        clear; echo -e "${G}"; f5; sleep 0.1
        clear; echo -e "${G}"; f4; sleep 0.1
        clear; echo -e "${G}"; f3; sleep 0.1
        clear; echo -e "${G}"; f2; sleep 0.1
        clear; echo -e "${G}"; f1; sleep 0.1
    done
    clear; echo -e "${G}"; f1
    echo -e "\n${G}>>> PROCESO ZENTRIA FINALIZADO CON ÉXITO <<<${NC}\n"
}

# --- EL SCRIPT DE DEPLOY ---
clear
# Banner de Bienvenida blindado a lo pana si o si
echo -e "${B}        _          ${NC}"
echo -ne "${B}       / \      _-' ${NC}" ; echo -e "${C} ________    _______  _____  ___  ___________  _______    __          __      ${NC}"
echo -ne "${B}     _/|  \-''- _ / ${NC}" ; echo -e "${C} (\"      \"\\  /\"     \"|(\"   \\|\   \\(\"       _   \")/\"     \\  |\" \\ /\"\"\\     ${NC}"
echo -ne "${B}__-' { |          \\ ${NC}" ; echo -e "${C}  \\___/   :)(: ______)|.\\\\   \\      |__/  \\\\__/|:        | ||  |      /    \\    ${NC}"
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

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${R}[ERROR] Branch actual incorrecta ($CURRENT_BRANCH).${NC}"
    show_skull; exit 1
fi

echo -e "${W}>> Mensaje del commit:${NC}"
read -r COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then echo -e "${R}[ERROR] Mensaje vacio.${NC}"; exit 1; fi

echo -e "\n${B}[1/5] Guardando cambios...${NC}"
git add .; git commit -m "$COMMIT_MSG"

echo -e "${B}[2/5] Corriendo npm run build...${NC}"
if npm run build; then echo -e "${G}[OK] Build exitoso.${NC}"; else show_skull; exit 1; fi

echo -e "\n${B}[3/5] Push a develop...${NC}"; git push origin develop
echo -e "${B}[4/5] Merge a main...${NC}"; git checkout main > /dev/null 2>&1; git merge develop; git push origin main
echo -e "${B}[5/5] Volviendo a develop...${NC}"; git checkout develop > /dev/null 2>&1

echo -ne "\n${W}¿Deseas iniciar el servidor de desarrollo (npm run dev)? (s/n): ${NC}"
read -r START_DEV

if [[ "$START_DEV" =~ ^[sS]$ ]]; then
    npm run dev
else
    finalizar
fi
