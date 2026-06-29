# WeWillRackYou

Application web mobile-first de gestion d'inventaire pour PME agricole (entrepôt, sacs, QR codes, paiements Ferme du kikiriki).

## Prérequis

- Node.js 20+
- Docker et Docker Compose (pour PostgreSQL)

## Démarrage en développement

1. Copier les variables d'environnement :

```bash
cp .env.example .env
```

2. Lancer PostgreSQL :

```bash
docker compose up db -d
```

3. Appliquer le schéma et le seed :

```bash
npm install
npx prisma db push
npm run db:seed
```

4. Lancer l'application :

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

**Compte initial :** `admin` / `admin123` (à changer en production).

## Fonctionnalités

- Connexion obligatoire, sessions longue durée (~400 jours)
- Carte 3D de l'entrepôt (8 rangées × 9 colonnes × 4 niveaux)
- Entrées à ID incrémental avec QR codes (`/entree/{id}`)
- Gros sacs (céréale, poids, humidité) ou autres objets
- Décommission avec liste de paiement « Ferme du kikiriki »
- Administration des utilisateurs et archives

## Déploiement VPS (production)

### 1. Préparer le serveur

- Ubuntu 22.04+ ou équivalent
- Docker et Docker Compose installés
- Nom de domaine pointant vers le VPS

### 2. Configurer l'environnement

Créer un fichier `.env` à la racine :

```env
DATABASE_URL=postgresql://wewillrackyou:MOT_DE_PASSE_FORT@db:5432/wewillrackyou
AUTH_SECRET=cle-secrete-longue-et-aleatoire-minimum-32-caracteres
AUTH_URL=https://votre-domaine.fr
```

Modifier `docker-compose.yml` pour utiliser un mot de passe PostgreSQL fort.

### 3. Lancer les services

```bash
docker compose up -d --build
```

### 4. Initialiser la base

```bash
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```

### 5. HTTPS avec Nginx et Let's Encrypt

Exemple de configuration Nginx (`/etc/nginx/sites-available/wewillrackyou`) :

```nginx
server {
    listen 80;
    server_name votre-domaine.fr;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.fr;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.fr/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Obtenir le certificat :

```bash
sudo certbot --nginx -d votre-domaine.fr
```

## Structure des positions

Format : `{rangée}{niveau}{colonne}` — ex. `A11` = rangée A, niveau 1, colonne 1.

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run db:push` | Synchroniser le schéma Prisma |
| `npm run db:seed` | Créer l'utilisateur admin |
| `npm run db:studio` | Interface Prisma Studio |
