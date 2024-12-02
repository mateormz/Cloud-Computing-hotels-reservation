#!/bin/bash

# Definir el directorio principal donde están las APIs
base_dir=$(pwd)

# Encontrar todos los subdirectorios que contienen un archivo 'serverless.yml'
api_dirs=()
for dir in */; do
  if [ -f "$dir/serverless.yml" ]; then
    api_dirs+=("$dir")
  fi
done

# Función para hacer deploy y ejecutar sls info
deploy_api() {
  api_dir=$1
  echo "Desplegando API en el directorio: $api_dir"
  
  # Realizar el despliegue en el entorno 'dev'
  cd "$base_dir/$api_dir"
  sls deploy --stage dev
  
  # Ejecutar sls info para verificar el despliegue
  sls info --stage dev
  
  # Volver al directorio original
  cd "$base_dir"
}

# Desplegar todas las APIs
for api in "${api_dirs[@]}"; do
  deploy_api "$api"
done