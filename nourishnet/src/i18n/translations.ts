export type LangCode = "en" | "es" | "am" | "fr";

export interface Translations {
  // Nav
  navFindFood: string;
  navDonate: string;
  navVolunteer: string;
  navAbout: string;

  // Home hero
  homeHeroTitle: string;
  homeHeroSub: string;
  homeFindFood: string;
  homeIWantToHelp: string;
  homeLocations: string;
  homeOpportunities: string;
  homeCounties: string;
  homeHowCanWeHelp: string;
  homeChooseBelow: string;
  homeFindFoodDesc: string;
  homeDonateDesc: string;
  homeVolunteerDesc: string;
  homeGetStarted: string;
  homeHowItWorks: string;
  homeStep1Title: string;
  homeStep1Desc: string;
  homeStep2Title: string;
  homeStep2Desc: string;
  homeStep3Title: string;
  homeStep3Desc: string;

  // Consumer page
  consumerTitle: string;
  consumerSub: string;
  consumerSearchPlaceholder: string;
  consumerAllCounties: string;
  consumerAnyDay: string;
  consumerMyLocation: string;
  consumerLocating: string;
  consumerEmergencyBtn: string;
  consumerLocationsFound: string;

  // Emergency modal
  emergencyTitle: string;
  emergencySub: string;
  emergencyFinding: string;
  emergencyFindingNote: string;
  emergencyCallFree: string;
  emergencyCallAvail: string;
  emergencyOrVisit: string;
  emergencyCall: string;
  emergencyDirections: string;
  emergencyDenied: string;
  emergencyFailed: string;
  emergencyNoLocations: string;

  // Community Needs Board
  needsBoardTitle: string;
  needsBoardSub: string;
  needsBoardPostBtn: string;
  needsBoardCancel: string;
  needsBoardFormTitle: string;
  needsBoardAnon: string;
  needsBoardINeed: string;
  needsBoardZip: string;
  needsBoardUrgency: string;
  needsBoardTravel: string;
  needsBoardDetails: string;
  needsBoardDetailsPlaceholder: string;
  needsBoardSubmit: string;
  needsBoardSuccess: string;
  needsBoardEmpty: string;
  needsBoardEmptySub: string;
  needsBoardICanHelp: string;
  needsBoardFulfilled: string;
  needsBoardUrgencyToday: string;
  needsBoardUrgencyWeek: string;
  needsBoardUrgencyFlex: string;
  needsBoardMobilityWalk: string;
  needsBoardMobilityDelivery: string;
  needsBoardMobilityEither: string;

  // Donor page
  donorTitle: string;
  donorSub: string;
  donorMyLocation: string;
  donorNeedStats: string;
  donorFoodDesertMap: string;
  donorMyImpact: string;

  // Footer
  footerTagline: string;
}

const en: Translations = {
  navFindFood: "Find Food",
  navDonate: "Donate",
  navVolunteer: "Volunteer",
  navAbout: "About",

  homeHeroTitle: "Food Assistance,\nRight Where You Need It",
  homeHeroSub: "NourishNet connects people in Maryland and the DC metro area with food pantries, donation drop-offs, and volunteer opportunities — all in one place.",
  homeFindFood: "🍎 Find Food Near Me",
  homeIWantToHelp: "🙋 I Want to Help",
  homeLocations: "Locations",
  homeOpportunities: "Opportunities",
  homeCounties: "Counties Covered",
  homeHowCanWeHelp: "How Can We Help?",
  homeChooseBelow: "Choose what you're looking for",
  homeFindFoodDesc: "Locate food pantries, banks, and meal programs near you in Maryland and the DC metro area.",
  homeDonateDesc: "See what's needed and where to drop off food, produce, or monetary donations.",
  homeVolunteerDesc: "Find volunteer shifts — sorting, gardening, client services, and more.",
  homeGetStarted: "Get Started →",
  homeHowItWorks: "How It Works",
  homeStep1Title: "Search",
  homeStep1Desc: "Enter your city, ZIP, or address to find nearby resources.",
  homeStep2Title: "Browse",
  homeStep2Desc: "Filter by county, day, type of help, and see details for each location.",
  homeStep3Title: "Go",
  homeStep3Desc: "Get directions, call ahead, and visit. Always confirm hours first.",

  consumerTitle: "Find Food Near You",
  consumerSub: "Search by city, ZIP, county, or address to find food pantries, banks, and meal programs in Maryland and DC.",
  consumerSearchPlaceholder: "Enter ZIP code to sort by distance…",
  consumerAllCounties: "All counties",
  consumerAnyDay: "Any day",
  consumerMyLocation: "📍 My Location",
  consumerLocating: "Locating…",
  consumerEmergencyBtn: "🚨 I Need Food Right Now",
  consumerLocationsFound: "locations found",

  emergencyTitle: "🚨 I Need Food Right Now",
  emergencySub: "Nearest open food locations near you",
  emergencyFinding: "Finding your location…",
  emergencyFindingNote: "Please allow location access when prompted.",
  emergencyCallFree: "Call 211 — Free Helpline",
  emergencyCallAvail: "Available 24/7 · Food, shelter, and crisis help",
  emergencyOrVisit: "Or visit one of these locations near you:",
  emergencyCall: "📞 Call",
  emergencyDirections: "🗺 Directions",
  emergencyDenied: "Location access denied. Please allow location in your browser and try again.",
  emergencyFailed: "Could not detect your location. Try entering your ZIP code instead.",
  emergencyNoLocations: "No nearby locations found with coordinates.",

  needsBoardTitle: "🤝 Community Needs Board",
  needsBoardSub: "Anonymously post what you need — a nearby donor or volunteer may be able to help.",
  needsBoardPostBtn: "+ Post a Need",
  needsBoardCancel: "✕ Cancel",
  needsBoardFormTitle: "What do you need?",
  needsBoardAnon: "No name, no ID, no judgment — completely anonymous.",
  needsBoardINeed: "I need",
  needsBoardZip: "Near ZIP code",
  needsBoardUrgency: "How urgent?",
  needsBoardTravel: "Can you travel?",
  needsBoardDetails: "Details (optional)",
  needsBoardDetailsPlaceholder: "e.g. Halal-certified, for family of 4, infant formula size 1…",
  needsBoardSubmit: "Post Request",
  needsBoardSuccess: "✅ Your request is posted anonymously. A nearby volunteer or donor may reach out.",
  needsBoardEmpty: "No active requests right now.",
  needsBoardEmptySub: "If you need something specific, click \"Post a Need.\"",
  needsBoardICanHelp: "✋ I Can Help",
  needsBoardFulfilled: "Recently Fulfilled",
  needsBoardUrgencyToday: "⚡ Need today",
  needsBoardUrgencyWeek: "📅 This week",
  needsBoardUrgencyFlex: "🕐 Flexible",
  needsBoardMobilityWalk: "🚶 Can walk",
  needsBoardMobilityDelivery: "🏠 Need delivery",
  needsBoardMobilityEither: "🚶/🏠 Either",

  donorTitle: "Donate Food or Funds",
  donorSub: "locations across Maryland where you can donate food, produce, or funds.",
  donorMyLocation: "📍 My Location",
  donorNeedStats: "📊 Need Stats",
  donorFoodDesertMap: "🗺 Food Desert Map",
  donorMyImpact: "💛 My Impact",

  footerTagline: "Open-source class project · Data may be incomplete · Always confirm with the organization",
};

const es: Translations = {
  navFindFood: "Buscar Comida",
  navDonate: "Donar",
  navVolunteer: "Voluntario",
  navAbout: "Acerca de",

  homeHeroTitle: "Asistencia Alimentaria,\nDonde la Necesitas",
  homeHeroSub: "NourishNet conecta a personas en Maryland y el área metropolitana de DC con despensas de alimentos, puntos de donación y oportunidades de voluntariado.",
  homeFindFood: "🍎 Buscar Comida",
  homeIWantToHelp: "🙋 Quiero Ayudar",
  homeLocations: "Ubicaciones",
  homeOpportunities: "Oportunidades",
  homeCounties: "Condados Cubiertos",
  homeHowCanWeHelp: "¿Cómo Podemos Ayudar?",
  homeChooseBelow: "Elige lo que buscas",
  homeFindFoodDesc: "Encuentra despensas de alimentos y programas de comidas cerca de ti.",
  homeDonateDesc: "Ve qué se necesita y dónde entregar alimentos o donaciones.",
  homeVolunteerDesc: "Encuentra turnos de voluntariado — clasificación, jardines, servicios al cliente.",
  homeGetStarted: "Comenzar →",
  homeHowItWorks: "Cómo Funciona",
  homeStep1Title: "Buscar",
  homeStep1Desc: "Ingresa tu ciudad, código postal o dirección para encontrar recursos cercanos.",
  homeStep2Title: "Explorar",
  homeStep2Desc: "Filtra por condado, día, tipo de ayuda y ve detalles de cada ubicación.",
  homeStep3Title: "Ir",
  homeStep3Desc: "Obtén indicaciones, llama antes de ir y visita. Confirma los horarios primero.",

  consumerTitle: "Encuentra Comida Cerca de Ti",
  consumerSub: "Busca por ciudad, código postal, condado o dirección para encontrar despensas y bancos de alimentos.",
  consumerSearchPlaceholder: "Ingresa código postal para ordenar por distancia…",
  consumerAllCounties: "Todos los condados",
  consumerAnyDay: "Cualquier día",
  consumerMyLocation: "📍 Mi Ubicación",
  consumerLocating: "Localizando…",
  consumerEmergencyBtn: "🚨 Necesito Comida Ahora",
  consumerLocationsFound: "ubicaciones encontradas",

  emergencyTitle: "🚨 Necesito Comida Ahora",
  emergencySub: "Lugares de comida más cercanos abiertos ahora",
  emergencyFinding: "Encontrando tu ubicación…",
  emergencyFindingNote: "Permite el acceso a la ubicación cuando se solicite.",
  emergencyCallFree: "Llama al 211 — Línea Gratuita",
  emergencyCallAvail: "Disponible 24/7 · Alimentos, refugio y ayuda en crisis",
  emergencyOrVisit: "O visita uno de estos lugares cerca de ti:",
  emergencyCall: "📞 Llamar",
  emergencyDirections: "🗺 Cómo llegar",
  emergencyDenied: "Acceso a ubicación denegado. Permite el acceso en tu navegador e intenta de nuevo.",
  emergencyFailed: "No se pudo detectar tu ubicación. Intenta ingresar tu código postal.",
  emergencyNoLocations: "No se encontraron ubicaciones cercanas con coordenadas.",

  needsBoardTitle: "🤝 Tablero de Necesidades",
  needsBoardSub: "Publica lo que necesitas anónimamente — un donante o voluntario cercano puede ayudar.",
  needsBoardPostBtn: "+ Publicar Necesidad",
  needsBoardCancel: "✕ Cancelar",
  needsBoardFormTitle: "¿Qué necesitas?",
  needsBoardAnon: "Sin nombre, sin ID, sin prejuicios — completamente anónimo.",
  needsBoardINeed: "Necesito",
  needsBoardZip: "Cerca del código postal",
  needsBoardUrgency: "¿Qué tan urgente?",
  needsBoardTravel: "¿Puedes desplazarte?",
  needsBoardDetails: "Detalles (opcional)",
  needsBoardDetailsPlaceholder: "ej. Certificado halal, para familia de 4, fórmula infantil talla 1…",
  needsBoardSubmit: "Publicar Solicitud",
  needsBoardSuccess: "✅ Tu solicitud fue publicada anónimamente.",
  needsBoardEmpty: "No hay solicitudes activas en este momento.",
  needsBoardEmptySub: "Si necesitas algo específico, haz clic en \"Publicar Necesidad.\"",
  needsBoardICanHelp: "✋ Puedo Ayudar",
  needsBoardFulfilled: "Recientemente Cumplidas",
  needsBoardUrgencyToday: "⚡ Hoy",
  needsBoardUrgencyWeek: "📅 Esta semana",
  needsBoardUrgencyFlex: "🕐 Flexible",
  needsBoardMobilityWalk: "🚶 Puedo caminar",
  needsBoardMobilityDelivery: "🏠 Necesito entrega",
  needsBoardMobilityEither: "🚶/🏠 Cualquiera",

  donorTitle: "Donar Alimentos o Fondos",
  donorSub: "ubicaciones en Maryland donde puedes donar alimentos, productos o fondos.",
  donorMyLocation: "📍 Mi Ubicación",
  donorNeedStats: "📊 Estadísticas",
  donorFoodDesertMap: "🗺 Mapa de Desiertos",
  donorMyImpact: "💛 Mi Impacto",

  footerTagline: "Proyecto de código abierto · Los datos pueden ser incompletos · Confirma siempre con la organización",
};

const am: Translations = {
  navFindFood: "ምግብ ፈልግ",
  navDonate: "ለግስ",
  navVolunteer: "በፈቃደኝነት",
  navAbout: "ስለ እኛ",

  homeHeroTitle: "የምግብ እርዳታ,\nሲፈልጉት ያለበት ቦታ",
  homeHeroSub: "NourishNet በሜሪላንድ እና DC አካባቢ የምግብ ባንኮችን፣ የልገሳ ማቆሚያዎችን እና የበጎ ፈቃደኝነት እድሎችን ያገናኛል።",
  homeFindFood: "🍎 ምግብ ፈልግ",
  homeIWantToHelp: "🙋 መርዳት እፈልጋለሁ",
  homeLocations: "ቦታዎች",
  homeOpportunities: "እድሎች",
  homeCounties: "የተሸፈኑ ካውንቲዎች",
  homeHowCanWeHelp: "እንዴት መርዳት እንችላለን?",
  homeChooseBelow: "የሚፈልጉትን ይምረጡ",
  homeFindFoodDesc: "በአቅራቢያዎ ያሉ የምግብ ባንኮች እና ፕሮግራሞችን ያግኙ።",
  homeDonateDesc: "ምን እንደሚፈለግ ይመልከቱ እና ምግብ ወይም ልገሳ የት ማስቀመጥ እንደሚቻል ይወቁ።",
  homeVolunteerDesc: "የበጎ ፈቃደኝነት ዕድሎችን ያግኙ — መደርደር፣ ጓሮ አትክልት፣ እና ሌሎችም።",
  homeGetStarted: "ጀምር →",
  homeHowItWorks: "እንዴት ይሰራል",
  homeStep1Title: "ፈልግ",
  homeStep1Desc: "አቅራቢያ ያሉ ሀብቶችን ለማግኘት ከተማዎን፣ ZIP ወይም አድራሻዎን ያስገቡ።",
  homeStep2Title: "ዳስስ",
  homeStep2Desc: "በካውንቲ፣ ቀን እና የእርዳታ ዓይነት ይጣሩ፣ እያንዳንዱ ቦታ ዝርዝር መረጃ ይመልከቱ።",
  homeStep3Title: "ሂድ",
  homeStep3Desc: "አቅጣጫ ያግኙ፣ አስቀድመው ይደውሉ እና ይጎብኙ። ሰዓቶቹን ሁልጊዜ ያረጋግጡ።",

  consumerTitle: "ምግብ በቅርቡ ፈልግ",
  consumerSub: "በሜሪላንድ እና DC የምግብ ባንኮችን ለማግኘት ከተማ፣ ZIP ወይም አድራሻ ይፈልጉ።",
  consumerSearchPlaceholder: "ርቀት ለመደርደር ZIP ያስገቡ…",
  consumerAllCounties: "ሁሉም ካውንቲዎች",
  consumerAnyDay: "ማንኛውም ቀን",
  consumerMyLocation: "📍 ቦታዬ",
  consumerLocating: "እየተለየ…",
  consumerEmergencyBtn: "🚨 አሁን ምግብ ያስፈልገኛል",
  consumerLocationsFound: "ቦታዎች ተገኝተዋል",

  emergencyTitle: "🚨 አሁን ምግብ ያስፈልገኛል",
  emergencySub: "በአቅራቢያዎ ያሉ ክፍት የምግብ ቦታዎች",
  emergencyFinding: "ቦታዎን እያገኘ…",
  emergencyFindingNote: "ሲጠየቁ የቦታ መዳረሻ ይፍቀዱ።",
  emergencyCallFree: "211 ይደውሉ — ነጻ የእርዳታ መስመር",
  emergencyCallAvail: "24/7 ይገኛል · ምግብ፣ መጠለያ እና አደጋ እርዳታ",
  emergencyOrVisit: "ወይም ከእነዚህ ቦታዎች አንዱን ይጎብኙ:",
  emergencyCall: "📞 ይደውሉ",
  emergencyDirections: "🗺 አቅጣጫ",
  emergencyDenied: "የቦታ ፍቃድ ተከልክሏል። በአሳሽዎ ፍቃድ ይስጡ እና እንደገና ይሞክሩ።",
  emergencyFailed: "ቦታዎን ማወቅ አልተቻለም። ZIP ኮድዎን ያስገቡ።",
  emergencyNoLocations: "ቅርብ ቦታዎች አልተገኙም።",

  needsBoardTitle: "🤝 የማህበረሰብ ፍላጎት ሰሌዳ",
  needsBoardSub: "ምን እንደሚፈልጉ ሚስጥራዊ ያስቀምጡ — ቅርብ ያለ ለጋሽ ወይም በጎ ፈቃደኛ ሊረዳ ይችላል።",
  needsBoardPostBtn: "+ ፍላጎት ለጥፍ",
  needsBoardCancel: "✕ ሰርዝ",
  needsBoardFormTitle: "ምን ያስፈልጋል?",
  needsBoardAnon: "ስም የለም፣ መታወቂያ የለም — ሙሉ ሚስጥራዊ።",
  needsBoardINeed: "የምፈልገው",
  needsBoardZip: "ቅርቡ ZIP ኮድ",
  needsBoardUrgency: "ምን ያህል አስቸኳይ?",
  needsBoardTravel: "መጓዝ ይችላሉ?",
  needsBoardDetails: "ዝርዝሮች (አማራጭ)",
  needsBoardDetailsPlaceholder: "ለ4 ቤተሰብ፣ ሃላል ምግብ…",
  needsBoardSubmit: "ጥያቄ ለጥፍ",
  needsBoardSuccess: "✅ ጥያቄዎ ሚስጥራዊ ሆኖ ተለጥፏል።",
  needsBoardEmpty: "አሁን ንቁ ጥያቄዎች የሉም።",
  needsBoardEmptySub: "የሚፈልጉትን ለማስቀመጥ \"ፍላጎት ለጥፍ\" ይጫኑ።",
  needsBoardICanHelp: "✋ ልርዳ እችላለሁ",
  needsBoardFulfilled: "ቅርቡን የተሟሉ",
  needsBoardUrgencyToday: "⚡ ዛሬ",
  needsBoardUrgencyWeek: "📅 ይህ ሳምንት",
  needsBoardUrgencyFlex: "🕐 ተለዋዋጭ",
  needsBoardMobilityWalk: "🚶 መሄድ እችላለሁ",
  needsBoardMobilityDelivery: "🏠 ማስተላለፍ ያስፈልጋል",
  needsBoardMobilityEither: "🚶/🏠 ሁለቱም",

  donorTitle: "ምግብ ወይም ገንዘብ ለግሱ",
  donorSub: "ምግብ ወይም ገንዘብ መለገስ የሚቻልባቸው ቦታዎች።",
  donorMyLocation: "📍 ቦታዬ",
  donorNeedStats: "📊 ስታቲስቲክስ",
  donorFoodDesertMap: "🗺 የምግብ ምድረ በዳ ካርታ",
  donorMyImpact: "💛 ተጽዕኖዬ",

  footerTagline: "ክፍት ምንጭ · ውሂቡ ያልተሟላ ሊሆን ይችላል · ሁልጊዜ ከድርጅቱ ያረጋግጡ",
};

const fr: Translations = {
  navFindFood: "Trouver de l'Aide",
  navDonate: "Donner",
  navVolunteer: "Bénévole",
  navAbout: "À propos",

  homeHeroTitle: "Aide Alimentaire,\nLà Où Vous en Avez Besoin",
  homeHeroSub: "NourishNet connecte les personnes du Maryland et de la région de DC avec des banques alimentaires, des points de dépôt et des opportunités de bénévolat.",
  homeFindFood: "🍎 Trouver de la Nourriture",
  homeIWantToHelp: "🙋 Je Veux Aider",
  homeLocations: "Emplacements",
  homeOpportunities: "Opportunités",
  homeCounties: "Comtés Couverts",
  homeHowCanWeHelp: "Comment Pouvons-Nous Aider?",
  homeChooseBelow: "Choisissez ce que vous cherchez",
  homeFindFoodDesc: "Trouvez des banques alimentaires et des programmes de repas près de chez vous.",
  homeDonateDesc: "Voyez ce dont on a besoin et où déposer des dons alimentaires ou financiers.",
  homeVolunteerDesc: "Trouvez des créneaux de bénévolat — tri, jardinage, services aux clients.",
  homeGetStarted: "Commencer →",
  homeHowItWorks: "Comment Ça Marche",
  homeStep1Title: "Chercher",
  homeStep1Desc: "Entrez votre ville, code postal ou adresse pour trouver des ressources à proximité.",
  homeStep2Title: "Parcourir",
  homeStep2Desc: "Filtrez par comté, jour, type d'aide et consultez les détails.",
  homeStep3Title: "Y Aller",
  homeStep3Desc: "Obtenez un itinéraire, appelez à l'avance et visitez. Confirmez les horaires.",

  consumerTitle: "Trouver de la Nourriture Près de Vous",
  consumerSub: "Recherchez par ville, code postal, comté ou adresse pour trouver des banques alimentaires au Maryland et à DC.",
  consumerSearchPlaceholder: "Entrez un code postal pour trier par distance…",
  consumerAllCounties: "Tous les comtés",
  consumerAnyDay: "N'importe quel jour",
  consumerMyLocation: "📍 Ma Position",
  consumerLocating: "Localisation…",
  consumerEmergencyBtn: "🚨 J'ai Besoin de Nourriture",
  consumerLocationsFound: "emplacements trouvés",

  emergencyTitle: "🚨 J'ai Besoin de Nourriture",
  emergencySub: "Lieux d'aide alimentaire ouverts les plus proches",
  emergencyFinding: "Recherche de votre position…",
  emergencyFindingNote: "Autorisez l'accès à la position quand on vous le demande.",
  emergencyCallFree: "Appelez le 211 — Ligne Gratuite",
  emergencyCallAvail: "Disponible 24h/24 · Nourriture, hébergement et aide en crise",
  emergencyOrVisit: "Ou visitez l'un de ces endroits près de chez vous:",
  emergencyCall: "📞 Appeler",
  emergencyDirections: "🗺 Itinéraire",
  emergencyDenied: "Accès à la position refusé. Autorisez dans votre navigateur et réessayez.",
  emergencyFailed: "Impossible de détecter votre position. Essayez d'entrer votre code postal.",
  emergencyNoLocations: "Aucun emplacement proche trouvé.",

  needsBoardTitle: "🤝 Tableau des Besoins",
  needsBoardSub: "Publiez anonymement ce dont vous avez besoin — un bénévole ou donateur proche peut aider.",
  needsBoardPostBtn: "+ Publier un Besoin",
  needsBoardCancel: "✕ Annuler",
  needsBoardFormTitle: "De quoi avez-vous besoin?",
  needsBoardAnon: "Pas de nom, pas de pièce d'identité — complètement anonyme.",
  needsBoardINeed: "J'ai besoin de",
  needsBoardZip: "Près du code postal",
  needsBoardUrgency: "Quelle urgence?",
  needsBoardTravel: "Pouvez-vous vous déplacer?",
  needsBoardDetails: "Détails (optionnel)",
  needsBoardDetailsPlaceholder: "ex. Certifié halal, pour une famille de 4, lait maternisé taille 1…",
  needsBoardSubmit: "Publier la Demande",
  needsBoardSuccess: "✅ Votre demande a été publiée anonymement.",
  needsBoardEmpty: "Aucune demande active pour le moment.",
  needsBoardEmptySub: "Si vous avez besoin de quelque chose, cliquez sur \"Publier un Besoin.\"",
  needsBoardICanHelp: "✋ Je Peux Aider",
  needsBoardFulfilled: "Récemment Réalisées",
  needsBoardUrgencyToday: "⚡ Aujourd'hui",
  needsBoardUrgencyWeek: "📅 Cette semaine",
  needsBoardUrgencyFlex: "🕐 Flexible",
  needsBoardMobilityWalk: "🚶 Je peux marcher",
  needsBoardMobilityDelivery: "🏠 Besoin de livraison",
  needsBoardMobilityEither: "🚶/🏠 L'un ou l'autre",

  donorTitle: "Donner de la Nourriture ou des Fonds",
  donorSub: "emplacements dans le Maryland où vous pouvez faire des dons.",
  donorMyLocation: "📍 Ma Position",
  donorNeedStats: "📊 Statistiques",
  donorFoodDesertMap: "🗺 Carte des Déserts",
  donorMyImpact: "💛 Mon Impact",

  footerTagline: "Projet open-source · Les données peuvent être incomplètes · Confirmez toujours avec l'organisation",
};

export const TRANSLATIONS: Record<LangCode, Translations> = { en, es, am, fr };

export const LANG_NAMES: Record<LangCode, string> = {
  en: "English",
  es: "Español",
  am: "አማርኛ",
  fr: "Français",
};
