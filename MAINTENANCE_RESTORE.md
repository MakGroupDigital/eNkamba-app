# Retour apres maintenance

Cette version active temporairement une page globale de maintenance serveur.

Point de restauration avant maintenance :

```bash
git checkout main
git reset --hard pre-maintenance-2026-06-08
```

Option recommandee si le commit de maintenance est deja partage :

```bash
git checkout main
git pull origin main
git revert <commit-maintenance>
git push origin main
```

Fichiers concernes par le mode maintenance :

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/server-maintenance-page.tsx`
