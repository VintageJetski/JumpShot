#!/bin/bash

# Fix imports for all files in client/src
find client/src -name "*.tsx" -o -name "*.ts" | while read file; do
  echo "Processing: $file"
  
  # Calculate the depth from this file to client/src
  relative_path=$(dirname "$file" | sed 's|client/src||' | sed 's|^/||')
  
  if [ -z "$relative_path" ]; then
    # File is in client/src root
    depth=0
  else
    # Count directory levels
    depth=$(echo "$relative_path" | tr '/' '\n' | wc -l)
  fi
  
  # Create the correct prefix to reach client/src
  prefix=""
  for ((i=0; i<depth; i++)); do
    prefix="../$prefix"
  done
  
  # Fix all import paths
  sed -i "s|from \"../ui/|from \"${prefix}components/ui/|g" "$file"
  sed -i "s|from \"../../ui/|from \"${prefix}components/ui/|g" "$file"
  sed -i "s|from \"../../../ui/|from \"${prefix}components/ui/|g" "$file"
  sed -i "s|from \"../hooks/|from \"${prefix}hooks/|g" "$file"
  sed -i "s|from \"../../hooks/|from \"${prefix}hooks/|g" "$file"
  sed -i "s|from \"../lib/|from \"${prefix}lib/|g" "$file"
  sed -i "s|from \"../../lib/|from \"${prefix}lib/|g" "$file"
  sed -i "s|from \"../components/|from \"${prefix}components/|g" "$file"
  sed -i "s|from \"../../components/|from \"${prefix}components/|g" "$file"
  sed -i "s|from \"../../../components/|from \"${prefix}components/|g" "$file"
  
  # Fix shared imports - always go up one more level to reach project root
  sed -i "s|from \"../../../shared/|from \"${prefix}../shared/|g" "$file"
  sed -i "s|from \"../../../../shared/|from \"${prefix}../shared/|g" "$file"
done
