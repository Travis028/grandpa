#!/bin/bash
# Exit on error
set -o errexit

# 1. Build the Vite React Frontend
echo "Building the frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Install Backend Dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Build complete."
