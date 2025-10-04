#!/bin/bash

# Script to upload all secrets to Cloudflare Workers
# Usage: ./scripts/upload-secrets.sh

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found!"
    exit 1
fi

echo "Uploading secrets to Cloudflare Workers..."
echo ""

success_count=0
fail_count=0

# Read .env file and upload each secret
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^#.* || -z "$value" ]] && continue

    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    # Skip if key or value is still empty after trim
    [[ -z "$key" || -z "$value" ]] && continue

    # Remove surrounding quotes
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

    echo "Uploading $key..."

    if echo "$value" | pnpm wrangler secret put "$key" > /dev/null 2>&1; then
        echo "  ✓ Success: $key"
        ((success_count++))
    else
        echo "  ✗ Failed: $key"
        ((fail_count++))
    fi

done < "$ENV_FILE"

echo ""
echo "Upload completed: $success_count succeeded, $fail_count failed"
