import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
flowchart TD
    Start([Debut]) --> A[Utilisateur acces\npage de connexion]
    A --> B[Saisir identifiant\net mot de passe]
    B --> C{Credentials\nvalides?}
    C -- Non --> D[Afficher erreur\nauthentification]
    D --> B
    C -- Oui --> E{isFirstLogin\n= true?}
    E -- Oui --> F[Bloquer navigation\nrediriger setup]
    F --> G[Saisir nom complet]
    G --> H[Choisir nouvel\nidentifiant]
    H --> I[Saisir nouveau\nmot de passe]
    I --> J[Confirmer\nmot de passe]
    J --> K{Validation\nformulaire?}
    K -- Erreurs --> L[Afficher messages\nerreur]
    L --> G
    K -- Valide --> M[Mettre a jour BD\nusername + password]
    M --> N[isFirstLogin = false\nnettoyer temp credentials]
    N --> O[Creer session\ncookie]
    E -- Non --> O
    O --> P{Role utilisateur?}
    P -- proviseur --> Q[Dashboard Proviseur\nTableau de bord stats]
    P -- titulaire --> R[Dashboard Titulaire\nGestion classe]
    P -- enseignant --> S[Dashboard Enseignant\nSaisie notes]
    P -- secretaire --> T[Dashboard Secretaire\nInscriptions]
    P -- parent --> U[Bulletin\nenfant]
    Q & R & S & T & U --> End([Fin])
`;

export default function DiagramActiviteAuth() {
  return <DiagramPage title="Diagramme d'activite — Authentification et Premier Acces" subtitle="Tous acteurs — login, setup 1er acces, redirection par role" diagram={D} />;
}
