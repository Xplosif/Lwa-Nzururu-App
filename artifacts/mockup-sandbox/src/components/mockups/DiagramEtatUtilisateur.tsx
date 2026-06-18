import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
stateDiagram-v2
    [*] --> CompteInactif : Proviseur cree compte\n(identifiants temporaires)

    state CompteInactif {
        [*] --> AttenteConnexion
        AttenteConnexion : isFirstLogin = true\nidentifiants temporaires actifs
    }

    CompteInactif --> ConfigurationInitiale : Premiere connexion reussie

    state ConfigurationInitiale {
        [*] --> SaisieNom
        SaisieNom --> SaisieIdentifiant
        SaisieIdentifiant --> SaisieMotDePasse
        SaisieMotDePasse --> Validation
    }

    ConfigurationInitiale --> CompteActif : Configuration completee\nisFirstLogin = false

    state CompteActif {
        [*] --> NavigationNormale
        NavigationNormale --> ModificationProfil : Acces Mon profil
        ModificationProfil --> NavigationNormale : Sauvegarde
    }

    CompteActif --> CompteSuprime : Proviseur supprime compte
    CompteSuprime --> [*]
`;

export default function DiagramEtatUtilisateur() {
  return <DiagramPage title="Diagramme d'etat — Cycle de vie d'un Compte Utilisateur" subtitle="Etats : Inactif → Configuration initiale → Actif → Supprime" diagram={D} />;
}
