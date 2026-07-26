#!/bin/bash
set -e

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile=false

echo "==> Pushing DB schema..."
pnpm --filter @workspace/db run push-force

echo "==> Post-merge setup complete."
