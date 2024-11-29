#!/bin/bash

# Archivo donde se guardarán los resultados del despliegue
RESULTS_FILE="deployment_summary_dev.txt"

# Limpiar el archivo de resultados anterior (si existe)
> $RESULTS_FILE

# Crear un array asociativo para almacenar las URLs base de las APIs desplegadas
declare -A BASE_URLS

# Recorrer todas las carpetas (servicios) que contengan un archivo `serverless.yml`
for dir in */; do
    if [ -f "$dir/serverless.yml" ]; then
        echo "Desplegando en DEV para la carpeta: $dir"
        
        # Cambiar al directorio del servicio
        cd "$dir" || exit
        
        # Ejecutar el despliegue con `serverless deploy`
        DEPLOY_OUTPUT=$(sls deploy --stage dev 2>&1)
        
        # Extraer la URL base del output de `sls deploy` utilizando un patrón regex
        BASE_URL=$(echo "$DEPLOY_OUTPUT" | grep -Eo 'https?://[a-zA-Z0-9\-]+\.execute-api\.[a-zA-Z0-9\-]+\.amazonaws\.com/dev')
        
        # Si se encuentra una URL, la almacena en el array asociativo
        if [ -n "$BASE_URL" ]; then
            BASE_URLS["$BASE_URL"]="$dir"
        fi
        
        # Regresar al directorio principal
        cd .. || exit
    fi
done

# Mostrar un resumen del despliegue
echo "Despliegue en DEV completado. Base URLs detectadas:"

# Recorrer el array asociativo e imprimir las URLs encontradas
for url in "${!BASE_URLS[@]}"; do
    echo "BaseURL de ${BASE_URLS[$url]}: $url"
done

# Guardar las URLs en el archivo de resultados
echo "Base URLs detectadas:" > $RESULTS_FILE
for url in "${!BASE_URLS[@]}"; do
    echo "BaseURL de ${BASE_URLS[$url]}: $url" >> $RESULTS_FILE
done