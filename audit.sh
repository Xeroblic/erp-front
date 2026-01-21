#!/bin/bash

# --- Colores ---
G='\033[0;32m'; C='\033[0;36m'; W='\033[1;37m'; R='\033[1;31m'; Y='\033[1;33m'; NC='\033[0m'

show_header() {
    clear
    echo -e "${C}  ______   __    __  _______   ______  ________ "
    echo " /      \ /  |  /  |/       \ /      |/        |"
    echo "(/888888  |88 |  88 |8888888  |888888/ 88888888   88"
    echo "(88 |__88 |88 |  88 |88 |  88 |  88 |     88 |    "
    echo "(88    88 |88 \__88 |88 |  88 |  88 |     88 |    88"
    echo "(88888888 |88    88/ 88 |  88 |  88 |     88 |    88"
    echo "(88 |  88 | 888888/  88/   88/   88/      88/     88"
    echo -e " -----------------------------------------------${NC}"
    echo -e "${W}         ZENTRIA TURBO AUDIT - MULTICORE MODE${NC}"
}

# Analizador de logs para encontrar archivos y líneas exactas
parse_details() {
    local type=$1
    local file=$2
    echo -e "\n${R}📍 MAPA DE ERRORES DETECTADOS:${NC}"
    
    if [ "$type" == "tsc" ]; then
        # Extrae: ruta/al/archivo.tsx (línea,columna)
        grep "error TS" "$file" | awk -F': ' '{print $1 " -> " $2}' | sed 's/^/  ⚠️  /' | head -n 20
    elif [ "$type" == "lint" ]; then
        # Extrae: ruta/archivo: línea:columna error mensaje
        grep -E "error|warning" "$file" | grep -v "npm ERR" | awk '{print $1 " " $2 " " $3}' | sed 's/^/  🔧  /' | head -n 20
    fi
}

# Función para auditoría total en paralelo (LA MÁS RÁPIDA)
fast_audit() {
    show_header
    echo -e "${Y}🚀 Iniciando Auditoría Total en paralelo...${NC}"
    
    # Lanzamos procesos al mismo tiempo
    npx tsc --noEmit > /tmp/tsc_out 2>&1 &
    pid_tsc=$!
    
    npm run lint > /tmp/lint_out 2>&1 &
    pid_lint=$!
    
    echo -ne "${W}>> Procesando TypeScript y Linter simultáneamente... ${NC}"
    
    # Esperamos a ambos
    wait $pid_tsc
    res_tsc=$?
    wait $pid_lint
    res_lint=$?
    
    # Resultados
    if [ $res_tsc -eq 0 ]; then echo -e "\n${G}[OK] TypeScript impecable.${NC}"; else 
        echo -e "\n${R}[FAIL] Errores en TypeScript:${NC}"; parse_details "tsc" "/tmp/tsc_out"; fi
        
    if [ $res_lint -eq 0 ]; then echo -e "${G}[OK] Linter sin observaciones.${NC}"; else 
        echo -e "${R}[FAIL] Errores de Estilo:${NC}"; parse_details "lint" "/tmp/lint_out"; fi

    # Audit va al final porque depende de la red
    echo -ne "${W}>> Revisando Seguridad... ${NC}"
    npm audit > /tmp/audit_out 2>&1
    if [ $? -eq 0 ]; then echo -e "${G}[OK] Librerías seguras.${NC}"; else
        echo -e "${Y}[WARNING] Riesgos encontrados.${NC}"
        grep -E "high|critical" /tmp/audit_out | head -n 5; fi
}

while true; do
    show_header
    echo -e "${W}1) Full Turbo Audit (Paralelo - Recomendado)${NC}"
    echo -e "${W}2) TypeScript (TSC)${NC}"
    echo -e "${W}3) Linter (ESLint)${NC}"
    echo -e "${W}4) Security (Audit)${NC}"
    echo -e "${R}5) Salir${NC}"
    echo -ne "\n${C}Opcion: ${NC}"
    read -r opt

    case $opt in
        1) fast_audit; read -p "Enter para volver..." ;;
        2) 
            echo -ne "Analizando tipos... "
            npx tsc --noEmit > /tmp/tsc_out 2>&1
            if [ $? -eq 0 ]; then echo -e "${G}PASÓ${NC}"; else parse_details "tsc" "/tmp/tsc_out"; fi
            read -p "Enter..." ;;
        3) 
            echo -ne "Analizando estilo... "
            npm run lint > /tmp/lint_out 2>&1
            if [ $? -eq 0 ]; then echo -e "${G}PASÓ${NC}"; else parse_details "lint" "/tmp/lint_out"; fi
            read -p "Enter..." ;;
        4) 
            npm audit; read -p "Enter..." ;;
        5) exit 0 ;;
        *) sleep 1 ;;
    esac
done