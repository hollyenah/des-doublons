# Nettoyage Liste A

Petite web app **100 % locale** (un seul fichier `index.html`) pour nettoyer une liste A en supprimant les entrées déjà présentes dans une liste B.

## Principe

Pour chaque ligne de la **Liste B**, une **seule** occurrence correspondante est retirée de la **Liste A**.

- La comparaison est **sensible à la casse** (`Karen` ≠ `karen`).
- Si une ligne apparaît plusieurs fois dans B, autant d'occurrences sont retirées dans A.
- Si une ligne apparaît plusieurs fois dans A mais une seule fois dans B, une seule est retirée, les autres restent.
- L'ordre d'origine de la Liste A est conservé.

### Exemples

| Liste A | Liste B | Résultat |
|---|---|---|
| `Oranger → Luc`<br>`Oranger → Bob` | `Oranger → Luc`<br>`Oranger → Tim` | `Oranger → Bob` |
| `pomme → Karen` ×3<br>`pomme → Steph`<br>`pomme → Kim` | `pomme → Karen`<br>`pomme → Kim` | `pomme → Karen` ×2<br>`pomme → Steph` |

## Formats supportés

- `.txt` — une entrée par ligne
- `.csv` — séparateur `,`, `;` ou tabulation (détecté automatiquement) ; les cellules d'une même ligne sont jointes avec ` → `

> Les fichiers `.xlsx` ne sont **pas** supportés (volontairement).

## Utilisation

1. Télécharger ou cloner ce dossier.
2. Ouvrir `index.html` dans un navigateur (double-clic suffit).
3. Charger la **Liste A** et la **Liste B** :
   - par glisser-déposer, ou
   - en cliquant sur la zone correspondante.
4. Cliquer sur **Traiter les listes**.
5. Vérifier le décompte et l'aperçu, puis **Télécharger le .txt**.

## Confidentialité

Tout le traitement se fait **dans le navigateur**. Aucune donnée n'est envoyée à un serveur. L'app fonctionne hors ligne.

## Compatibilité

Testé sur Chrome, Firefox, Safari (macOS) et Edge.

## Technique

- HTML + CSS + JavaScript natif, **aucun framework**, **aucune dépendance externe**.
- Un seul fichier : `index.html`.
- Lecture des fichiers via `FileReader` (compatibilité Safari/macOS).
- Design sombre avec teal comme couleur principale.
