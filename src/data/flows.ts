export const FLOWS: {
  code: string;
  label: string;
  groups: TFlowGroups[];
  icon?: string;
  descripiton?: string;
  color?: string;
  customIcon?: string;
}[] = [
  /* ───────────────── Verhuren ───────────────── */
  {
    code: "CUS_Verhuren_Woning",
    label: "Woning",
    descripiton:
      "Het tekenen van huurcontracten en betalen van beginfacturen voor woonruimte",
    groups: ["verhuren"],
    customIcon: "home-outline",
    color: "#03A9F4",
  },

  /* ───────────── Huurcontract beëindigen ───────────── */
  {
    code: "CUS_Huurcontract_be_indigen_Woonruimte",
    label: "Woning",
    descripiton:
      "Het beëindigen van huurcontracten voor woonruimte, garages, bergingen en parkeerplaatsen",
    groups: ["huurcontract"],
    customIcon: "home-outline",
    color: "#03A9F4",
  },
  {
    code: "CUS_Huurcontract_be_indigen_Overlijden",
    label: "Bij overlijden",
    descripiton:
      "Het beëindigen van huurcontracten wanneer huurder is overleden",
    groups: ["huurcontract"],
    customIcon: "person-remove-outline",
    color: "#2196F3",
  },
  {
    code: "CUS_Huurcontract_be_indigen_Wijzigen",
    label: "Inspectieafspraak wijzigen",
    descripiton:
      "Het wijzigen van inspectieafspraken van een beëindigd huurcontract",
    groups: ["huurcontract"],
    customIcon: "calendar-outline",
    color: "#FF9800",
  },
  {
    code: "CUS_Huurcontract_be_indigen_Laatste_huurdag_wijzigen",
    label: "Laatste huurdag wijzigen",
    descripiton:
      "Het wijzigen van de laatste huurdag van een beëindigd huurcontract",
    groups: ["huurcontract"],
    customIcon: "time-outline",
    color: "#4CAF50",
  },
  {
    code: "CUS_Huurcontract_be_indigen_Annuleren",
    label: "Annuleren",
    descripiton: "Het annuleren van een beëindigd huurcontract",
    groups: ["huurcontract"],
    customIcon: "close-circle-outline",
    color: "#FBC02D",
  },
  {
    code: "CUS_Huurcontract_be_indigen___Commerci_le_ruimte",
    label: "Commerciële ruimte",
    descripiton: "Het beëindigen van een huurcontract voor een bedrijfsruimte",
    groups: ["huurcontract"],
    customIcon: "business-outline",
    color: "#9C27B0",
  },

  /* ───────────────── Reparatieverzoek ───────────────── */
  {
    code: "CUS_Reparatieverzoek",
    label: "Reparatie melden",
    descripiton: "Het plannen van reparatieverzoeken",
    groups: ["reparatieverzoek", "home"],
    customIcon: "hammer",
    color: "#FF6B6B",
  },
  {
    code: "CUS_Reparatieverzoek_Wijzigen",
    label: "Reparatieafspraak wijzigen",
    descripiton: "Het wijzigen van reparatieverzoeken",
    groups: ["reparatieverzoek"],
    customIcon: "create",
    color: "#3742FA",
  },
  {
    code: "CUS_Reparatieverzoek_Annuleren",
    label: "Afspraak afzeggen",
    descripiton: "Het annuleren van reparatieverzoeken",
    groups: ["reparatieverzoek"],
    customIcon: "close-circle",
    color: "#FF4757",
  },

  /* ───────────────── Leefbaarheid ───────────────── */
  {
    code: "CUS_Leefbaarheid___Overlast",
    label: "Overlast melden",
    descripiton: "Het melden van overlast",
    groups: ["leefbaarheid"],
    customIcon: "volume-high",
    color: "#FF7675",
  },
  {
    code: "CUS_Leefbaarheid___Illegale_activiteiten",
    label: "Woonfraude melden",
    descripiton: "Het melden van illegale activiteit in de buurt",
    groups: ["leefbaarheid"],
    customIcon: "warning",
    color: "#FDCB6E",
  },
  {
    code: "CUS_Leefbaarheid___Zorg",
    label: "Zorgelijke situatie melden",
    descripiton: "Het melden van situatie wanneer iemand zorg nodig heeft",
    groups: ["leefbaarheid"],
    customIcon: "heart",
    color: "#FD79A8",
  },
  {
    code: "CUS_Leefbaarheid___Agressie",
    label: "Melden agressie, intimidatie of bedreiging van een buur",
    descripiton: "Het melden van agressief gedrag",
    groups: ["leefbaarheid"],
    customIcon: "shield",
    color: "#A29BFE",
  },
  {
    code: "CUS_Leefbaarheid_Leefomgeving",
    label: "Melding woonomgeving",
    descripiton: "Het melden van verbeteringen kwaliteit woonomgeving",
    groups: ["leefbaarheid"],
    customIcon: "leaf",
    color: "#00B894",
  },
  {
    code: "CUS_Leefbaarheid_Suggestie",
    label: "Suggestie doen",
    descripiton: "Het melden van suggesties om leefbaarheid te verbeteren",
    groups: ["leefbaarheid", "home"],
    customIcon: "bulb",
    color: "#FDCB6E",
  },
  {
    code: "CUS_Leefbaarheid___Buurtfonds",
    label: "Buurtfonds aanvragen",
    descripiton: "Het aanvragen van een buurtfonds",
    groups: ["leefbaarheid"],
    customIcon: "wallet",
    color: "#6C5CE7",
  },

  /* ───────────────── Betalen ───────────────── */
  {
    code: "CUS_Betalen_Online",
    label: "Online betalen",
    descripiton: "Het online betalen via iDEAL",
    groups: ["finance"],
    customIcon: "wallet-outline",
    color: "#2196F3",
  },
  {
    code: "CUS_Betalingsregeling",
    label: "Betalingsregeling afsluiten",
    descripiton: "Het afsluiten van betalingsregelingen",
    groups: ["finance"],
    customIcon: "time-outline",
    color: "#FF9800",
  },
  {
    code: "CUS_Betalen_Betaalwijze_Automatisch",
    label: "Betalen met automatische incasso",
    descripiton: "Het wijzigen van betaalwijze naar automatische incasso",
    groups: ["finance"],
    customIcon: "sync-outline",
    color: "#9C27B0",
  },
  {
    code: "CUS_Betalen_Betaalwijze_Betaallink",
    label: "Betalen met betaallink",
    descripiton: "Het aanpassen van de betaalwijze naar betaallink",
    groups: ["finance"],
    customIcon: "link-outline",
    color: "#f44336",
  },
  {
    code: "CUS_Betaalgegevens_aanpassen",
    label: "Betalingsgegevens wijzigen",
    descripiton: "Het wijzigen van betalingsgegevens",
    groups: ["finance"],
    customIcon: "create-outline",
    color: "#689F38",
  },
  {
    code: "CUS_Betalen_Betaalwijze_Handmatig",
    label: "Handmatig betalen",
    descripiton: "Het aanpassen van de betaalwijze naar handmatig betalen",
    groups: ["finance"],
    customIcon: "hand-right-outline",
    color: "#FBC02D",
  },

  /* ───────────────── Diensten ───────────────── */
  {
    code: "CUS_Serviceabonnement_aanvragen",
    label: "Onderhoudsabonnement afsluiten",
    descripiton: "Het aanvragen van serviceabonnementen",
    groups: ["diensten"],
    customIcon: "construct-outline",
    color: "#03A9F4",
  },
  {
    code: "CUS_Serviceabonnement_opzeggen",
    label: "Onderhoudsabonnement opzeggen",
    descripiton: "Het afmelden van serviceabonnementen",
    groups: ["diensten"],
    customIcon: "remove-circle-outline",
    color: "#f44336",
  },
  {
    code: "CUS_Sleutels_aanvragen",
    label: "Sleutels aanvragen",
    descripiton: "Het bestellen van nieuwe sleutels",
    groups: ["diensten"],
    customIcon: "key-outline",
    color: "#689F38",
  },
  {
    code: "CUS_Naamplaatje_bestellen",
    label: "Naamplaatje(s) aanvragen",
    descripiton: "Het bestellen van naamplaatjes",
    groups: ["diensten"],
    customIcon: "pricetag-outline",
    color: "#E91E63",
  },

  /* ───────────────── Contract ───────────────── */
  {
    code: "CUS_Woning_veranderen",
    label: "Woningverbetering aanvragen",
    descripiton: "Het aanvragen van toestemming om woning te veranderen (ZAV)",
    groups: ["contract"],
    customIcon: "hammer-outline",
    color: "#FF9800",
  },
  {
    code: "CUS_Woning_veranderen_Verhoging",
    label: "Woningverbetering met huurverhoging",
    descripiton:
      "Woningverbetering met huurverhoging (ZAV met huurverhoging)",
    groups: ["contract"],
    customIcon: "trending-up-outline",
    color: "#f44336",
  },
  {
    code: "CUS_Woning_ruilen",
    label: "Woningruil aanvragen",
    descripiton: "Het aanvragen van toestemming om de woning te ruilen",
    groups: ["contract"],
    customIcon: "swap-horizontal-outline",
    color: "#2196F3",
  },
  {
    code: "CUS_Schade_melden",
    label: "Schadeclaim indienen",
    descripiton: "Het indienen van een schadeclaim",
    groups: ["contract"],
    customIcon: "alert-circle",
    color: "#FF6B35",
  },
  {
    code: "CUS_Contract_Huurprijzen",
    label: "Wijziging in huurprijs aanvragen",
    descripiton: "Dialoog  voor het aanvragen van een wijziging in huurprijzen",
    groups: ["contract"],
    customIcon: "cash-outline",
    color: "#4CAF50",
  },
  {
    code: "CUS_Contract_wijzigen___Tenaamstelling_wijzigen",
    label: "Tenaamstelling wijzigen",
    descripiton: "Het wijzigen van tenaamstelling van huurcontracten",
    groups: ["contract"],
    customIcon: "person-circle-outline",
    color: "#9C27B0",
  },
  {
    code: "CUS_Contract_wijzigen___Inwoning",
    label: "Toestemming voor inwoning aanvragen",
    descripiton: "Het aanvragen van toestemming voor inwoning",
    groups: ["contract"],
    customIcon: "people-outline",
    color: "#FBC02D",
  },
  {
    code: "CUS_Contract_wijzigen___Huisbewaring",
    label: "Toestemming voor huisbewaring aanvragen",
    descripiton: "Het aanvragen van toestemming voor huisbewaring",
    groups: ["contract"],
    customIcon: "shield-checkmark-outline",
    color: "#03A9F4",
  },
  {
    code: "CUS_Contract_Verhuurdersverklaring",
    label: "Verhuurdersverklaring aanvragen",
    descripiton: "Het aanvragen van een verhuurdersverklaring",
    groups: ["contract"],
    customIcon: "document-text-outline",
    color: "#E91E63",
  },

  /* ───────────────── Contact ───────────────── */
  {
    code: "CUS_Service_en_contact",
    label: "Contactformulier",
    descripiton: "Het doorgeven van allerlei vragen",
    groups: ["contact"],
    customIcon: "help-circle",
    color: "#2196F3",
  },
  {
    code: "CUS_Klacht_melden",
    label: "Klachten en complimenten",
    descripiton:
      "Het melden van klachten of complimenten over de dienstverlening",
    groups: ["contact"],
    customIcon: "chatbubble-ellipses",
    color: "#FF9500",
  },

  /* ─────────────── Digitaal contact ─────────────── */
  {
    code: "CUS_Contract_wijzigen___Contactgegevens_wijzigen",
    label: "Contactgegevens wijzigen",
    descripiton: "Het wijzigen van contactgegevens",
    groups: ["account"],
    customIcon: "call-outline",
    color: "#388E3C",
  },
  {
    code: "CUS_Contract_Inzage_persoonsgegevens",
    label: "Inzage persoonsgegevens aanvragen",
    descripiton:
      "Het aanvragen van inzage over het gebruik van persoonsgegevens",
    groups: ["account"],
    customIcon: "eye-outline",
    color: "#1976D2",
  },
  {
    code: "CUS_Contact_Login",
    label: "Account aanmaken",
    descripiton: "Het aanvragen en registreren van een nieuwe login",
    groups: ["account"],
    customIcon: "person-add-outline",
    color: "#3F51B5",
  },
  {
    code: "CUS_Contact_Wachtwoord",
    label: "Wachtwoord herstellen",
    descripiton: "Het herstellen van het wachtwoord",
    groups: ["account"],
    customIcon: "lock-open-outline",
    color: "#FF6B35",
  },
  {
    code: "CUS_Contact_Gebruikersnaam",
    label: "Gebruikersnaam wijzigen",
    descripiton: "Het wijzigen van de gebruikersnaam",
    groups: ["account"],
    customIcon: "create-outline",
    color: "#FF6F00",
  },
];

export const AUTHENTICATION_FLOWS = [
  {
    label: "Login aanvragen",
    value: "request-login" as const,
    flowCode: "CUS_Contact_Login",
    code: "login_aanvragen",
  },
  {
    label: "Wachtwoord herstellen",
    value: "reset-password" as const,
    flowCode: "CUS_Contact_Wachtwoord",
    code: "login_wachtwoord",
  },
  {
    label: "Gebruikersnaam wijzigen",
    value: "reset-username" as const,
    flowCode: "CUS_Contact_Gebruikersnaam",
    code: "login_gebruikersnaam",
  },
];
