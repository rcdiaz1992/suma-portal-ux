#!/bin/bash
echo "Actualizando LIBs dependencias..."
rm -rf .angular
rm -rf node_modules/@aduana
rm -rf package-lock.json
npm cache clean --force
npm install
