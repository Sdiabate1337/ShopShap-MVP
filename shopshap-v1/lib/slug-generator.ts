// ✅ Version robuste avec fallback
export function generateSlug(name: string): string {
  // Nettoyer le nom d'entrée
  let slug = name
    .toLowerCase()
    .trim();

  // Si le nom est vide, utiliser un fallback
  if (!slug) {
    return 'boutique-' + Date.now();
  }

  // Remplacer les caractères accentués
  const accentMap: { [key: string]: string } = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
    'ý': 'y', 'ÿ': 'y',
    'ç': 'c', 'ñ': 'n'
  };

  // Appliquer la map des accents
  for (const [accented, plain] of Object.entries(accentMap)) {
    slug = slug.replace(new RegExp(accented, 'g'), plain);
  }

  // Remplacer les espaces et caractères spéciaux
  slug = slug
    .replace(/\s+/g, '-') // Espaces → tirets
    .replace(/[^a-z0-9-]/g, '') // Garder seulement lettres, chiffres, tirets
    .replace(/-+/g, '-') // Éviter les tirets multiples
    .replace(/^-+|-+$/g, ''); // Supprimer tirets début/fin

  // Si le slug est vide après nettoyage, utiliser un fallback
  if (!slug || slug.length < 2) {
    slug = 'boutique-' + Math.random().toString(36).substring(2, 8);
  }

  // Limiter la longueur
  return slug.substring(0, 50);
}

// ✅ Tester avec votre cas spécifique
console.log('Test "Diabate Sekou":', generateSlug('Diabate Sekou')); // devrait donner "diabate-sekou"
console.log('Test "DIABATE SÉKOU":', generateSlug('DIABATE SÉKOU')); // devrait donner "diabate-sekou"
console.log('Test "Diabaté Sékou":', generateSlug('Diabaté Sékou')); // devrait donner "diabate-sekou"