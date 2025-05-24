#!/bin/bash

echo "Starting deployment..."

source /home/dekunin/.bash_profile

cd /var/apps/cycle-tracker || exit
git pull origin main
npm install
pm2 restart cycle-tracker

echo "Deployment complete!"
