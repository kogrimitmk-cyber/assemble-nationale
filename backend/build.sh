#!/usr/bin/env bash
# Script de build Render (execute a chaque deploiement).
set -o errexit

pip install -r requirements.txt

# Fichiers statiques (admin Django + DRF) servis par WhiteNoise
python manage.py collectstatic --no-input

# Schema de base de donnees
python manage.py migrate

# Donnees de demonstration (idempotent : ne fait rien si la base est deja peuplee)
# >>> A RETIRER quand les vraies donnees officielles seront saisies. <<<
python manage.py seed_demo

# Groupes d'acces (Secretariat / Lecture seule) + secretaire de demo (idempotent)
python manage.py setup_roles
