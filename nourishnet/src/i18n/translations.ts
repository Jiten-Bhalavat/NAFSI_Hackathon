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
  homeHeroSub: "NourishNet connects people in Maryland and the DC metro area with food pantries, donation drop-offs, and volunteer opportunities ΓÇö all in one place.",
  homeFindFood: "≡ƒìÄ Find Food Near Me",
  homeIWantToHelp: "≡ƒÖï I Want to Help",
  homeLocations: "Locations",
  homeOpportunities: "Opportunities",
  homeCounties: "Counties Covered",
  homeHowCanWeHelp: "How Can We Help?",
  homeChooseBelow: "Choose what you're looking for",
  homeFindFoodDesc: "Locate food pantries, banks, and meal programs near you in Maryland and the DC metro area.",
  homeDonateDesc: "See what's needed and where to drop off food, produce, or monetary donations.",
  homeVolunteerDesc: "Find volunteer shifts ΓÇö sorting, gardening, client services, and more.",
  homeGetStarted: "Get Started ΓåÆ",
  homeHowItWorks: "How It Works",
  homeStep1Title: "Search",
  homeStep1Desc: "Enter your city, ZIP, or address to find nearby resources.",
  homeStep2Title: "Browse",
  homeStep2Desc: "Filter by county, day, type of help, and see details for each location.",
  homeStep3Title: "Go",
  homeStep3Desc: "Get directions, call ahead, and visit. Always confirm hours first.",

  consumerTitle: "Find Food Near You",
  consumerSub: "Search by city, ZIP, county, or address to find food pantries, banks, and meal programs in Maryland and DC.",
  consumerSearchPlaceholder: "Enter ZIP code to sort by distanceΓÇª",
  consumerAllCounties: "All counties",
  consumerAnyDay: "Any day",
  consumerMyLocation: "≡ƒôì My Location",
  consumerLocating: "LocatingΓÇª",
  consumerEmergencyBtn: "≡ƒÜ¿ I Need Food Right Now",
  consumerLocationsFound: "locations found",

  emergencyTitle: "≡ƒÜ¿ I Need Food Right Now",
  emergencySub: "Nearest open food locations near you",
  emergencyFinding: "Finding your locationΓÇª",
  emergencyFindingNote: "Please allow location access when prompted.",
  emergencyCallFree: "Call 211 ΓÇö Free Helpline",
  emergencyCallAvail: "Available 24/7 ┬╖ Food, shelter, and crisis help",
  emergencyOrVisit: "Or visit one of these locations near you:",
  emergencyCall: "≡ƒô₧ Call",
  emergencyDirections: "≡ƒù║ Directions",
  emergencyDenied: "Location access denied. Please allow location in your browser and try again.",
  emergencyFailed: "Could not detect your location. Try entering your ZIP code instead.",
  emergencyNoLocations: "No nearby locations found with coordinates.",

  needsBoardTitle: "≡ƒñ¥ Community Needs Board",
  needsBoardSub: "Anonymously post what you need ΓÇö a nearby donor or volunteer may be able to help.",
  needsBoardPostBtn: "+ Post a Need",
  needsBoardCancel: "Γ£ò Cancel",
  needsBoardFormTitle: "What do you need?",
  needsBoardAnon: "No name, no ID, no judgment ΓÇö completely anonymous.",
  needsBoardINeed: "I need",
  needsBoardZip: "Near ZIP code",
  needsBoardUrgency: "How urgent?",
  needsBoardTravel: "Can you travel?",
  needsBoardDetails: "Details (optional)",
  needsBoardDetailsPlaceholder: "e.g. Halal-certified, for family of 4, infant formula size 1ΓÇª",
  needsBoardSubmit: "Post Request",
  needsBoardSuccess: "Γ£à Your request is posted anonymously. A nearby volunteer or donor may reach out.",
  needsBoardEmpty: "No active requests right now.",
  needsBoardEmptySub: "If you need something specific, click \"Post a Need.\"",
  needsBoardICanHelp: "Γ£ï I Can Help",
  needsBoardFulfilled: "Recently Fulfilled",
  needsBoardUrgencyToday: "ΓÜí Need today",
  needsBoardUrgencyWeek: "≡ƒôà This week",
  needsBoardUrgencyFlex: "≡ƒòÉ Flexible",
  needsBoardMobilityWalk: "≡ƒÜ╢ Can walk",
  needsBoardMobilityDelivery: "≡ƒÅá Need delivery",
  needsBoardMobilityEither: "≡ƒÜ╢/≡ƒÅá Either",

  donorTitle: "Donate Food or Funds",
  donorSub: "locations across Maryland where you can donate food, produce, or funds.",
  donorMyLocation: "≡ƒôì My Location",
  donorNeedStats: "≡ƒôè Need Stats",
  donorFoodDesertMap: "≡ƒù║ Food Desert Map",
  donorMyImpact: "≡ƒÆ¢ My Impact",

  footerTagline: "Open-source class project ┬╖ Data may be incomplete ┬╖ Always confirm with the organization",
};

const es: Translations = {
  navFindFood: "Buscar Comida",
  navDonate: "Donar",
  navVolunteer: "Voluntario",
  navAbout: "Acerca de",

  homeHeroTitle: "Asistencia Alimentaria,\nDonde la Necesitas",
  homeHeroSub: "NourishNet conecta a personas en Maryland y el ├írea metropolitana de DC con despensas de alimentos, puntos de donaci├│n y oportunidades de voluntariado.",
  homeFindFood: "≡ƒìÄ Buscar Comida",
  homeIWantToHelp: "≡ƒÖï Quiero Ayudar",
  homeLocations: "Ubicaciones",
  homeOpportunities: "Oportunidades",
  homeCounties: "Condados Cubiertos",
  homeHowCanWeHelp: "┬┐C├│mo Podemos Ayudar?",
  homeChooseBelow: "Elige lo que buscas",
  homeFindFoodDesc: "Encuentra despensas de alimentos y programas de comidas cerca de ti.",
  homeDonateDesc: "Ve qu├⌐ se necesita y d├│nde entregar alimentos o donaciones.",
  homeVolunteerDesc: "Encuentra turnos de voluntariado ΓÇö clasificaci├│n, jardines, servicios al cliente.",
  homeGetStarted: "Comenzar ΓåÆ",
  homeHowItWorks: "C├│mo Funciona",
  homeStep1Title: "Buscar",
  homeStep1Desc: "Ingresa tu ciudad, c├│digo postal o direcci├│n para encontrar recursos cercanos.",
  homeStep2Title: "Explorar",
  homeStep2Desc: "Filtra por condado, d├¡a, tipo de ayuda y ve detalles de cada ubicaci├│n.",
  homeStep3Title: "Ir",
  homeStep3Desc: "Obt├⌐n indicaciones, llama antes de ir y visita. Confirma los horarios primero.",

  consumerTitle: "Encuentra Comida Cerca de Ti",
  consumerSub: "Busca por ciudad, c├│digo postal, condado o direcci├│n para encontrar despensas y bancos de alimentos.",
  consumerSearchPlaceholder: "Ingresa c├│digo postal para ordenar por distanciaΓÇª",
  consumerAllCounties: "Todos los condados",
  consumerAnyDay: "Cualquier d├¡a",
  consumerMyLocation: "≡ƒôì Mi Ubicaci├│n",
  consumerLocating: "LocalizandoΓÇª",
  consumerEmergencyBtn: "≡ƒÜ¿ Necesito Comida Ahora",
  consumerLocationsFound: "ubicaciones encontradas",

  emergencyTitle: "≡ƒÜ¿ Necesito Comida Ahora",
  emergencySub: "Lugares de comida m├ís cercanos abiertos ahora",
  emergencyFinding: "Encontrando tu ubicaci├│nΓÇª",
  emergencyFindingNote: "Permite el acceso a la ubicaci├│n cuando se solicite.",
  emergencyCallFree: "Llama al 211 ΓÇö L├¡nea Gratuita",
  emergencyCallAvail: "Disponible 24/7 ┬╖ Alimentos, refugio y ayuda en crisis",
  emergencyOrVisit: "O visita uno de estos lugares cerca de ti:",
  emergencyCall: "≡ƒô₧ Llamar",
  emergencyDirections: "≡ƒù║ C├│mo llegar",
  emergencyDenied: "Acceso a ubicaci├│n denegado. Permite el acceso en tu navegador e intenta de nuevo.",
  emergencyFailed: "No se pudo detectar tu ubicaci├│n. Intenta ingresar tu c├│digo postal.",
  emergencyNoLocations: "No se encontraron ubicaciones cercanas con coordenadas.",

  needsBoardTitle: "≡ƒñ¥ Tablero de Necesidades",
  needsBoardSub: "Publica lo que necesitas an├│nimamente ΓÇö un donante o voluntario cercano puede ayudar.",
  needsBoardPostBtn: "+ Publicar Necesidad",
  needsBoardCancel: "Γ£ò Cancelar",
  needsBoardFormTitle: "┬┐Qu├⌐ necesitas?",
  needsBoardAnon: "Sin nombre, sin ID, sin prejuicios ΓÇö completamente an├│nimo.",
  needsBoardINeed: "Necesito",
  needsBoardZip: "Cerca del c├│digo postal",
  needsBoardUrgency: "┬┐Qu├⌐ tan urgente?",
  needsBoardTravel: "┬┐Puedes desplazarte?",
  needsBoardDetails: "Detalles (opcional)",
  needsBoardDetailsPlaceholder: "ej. Certificado halal, para familia de 4, f├│rmula infantil talla 1ΓÇª",
  needsBoardSubmit: "Publicar Solicitud",
  needsBoardSuccess: "Γ£à Tu solicitud fue publicada an├│nimamente.",
  needsBoardEmpty: "No hay solicitudes activas en este momento.",
  needsBoardEmptySub: "Si necesitas algo espec├¡fico, haz clic en \"Publicar Necesidad.\"",
  needsBoardICanHelp: "Γ£ï Puedo Ayudar",
  needsBoardFulfilled: "Recientemente Cumplidas",
  needsBoardUrgencyToday: "ΓÜí Hoy",
  needsBoardUrgencyWeek: "≡ƒôà Esta semana",
  needsBoardUrgencyFlex: "≡ƒòÉ Flexible",
  needsBoardMobilityWalk: "≡ƒÜ╢ Puedo caminar",
  needsBoardMobilityDelivery: "≡ƒÅá Necesito entrega",
  needsBoardMobilityEither: "≡ƒÜ╢/≡ƒÅá Cualquiera",

  donorTitle: "Donar Alimentos o Fondos",
  donorSub: "ubicaciones en Maryland donde puedes donar alimentos, productos o fondos.",
  donorMyLocation: "≡ƒôì Mi Ubicaci├│n",
  donorNeedStats: "≡ƒôè Estad├¡sticas",
  donorFoodDesertMap: "≡ƒù║ Mapa de Desiertos",
  donorMyImpact: "≡ƒÆ¢ Mi Impacto",

  footerTagline: "Proyecto de c├│digo abierto ┬╖ Los datos pueden ser incompletos ┬╖ Confirma siempre con la organizaci├│n",
};

const am: Translations = {
  navFindFood: "ßê¥ßîìßëÑ ßìêßêìßîì",
  navDonate: "ßêêßîìßê╡",
  navVolunteer: "ßëáßìêßëâßï░ßè¥ßèÉßë╡",
  navAbout: "ßê╡ßêê ßèÑßè¢",

  homeHeroTitle: "ßï¿ßê¥ßîìßëÑ ßèÑßê¡ßï│ßë│,\nßê▓ßìêßêìßîëßë╡ ßï½ßêêßëáßë╡ ßëªßë│",
  homeHeroSub: "NourishNet ßëáßê£ßê¬ßêïßèòßï╡ ßèÑßèô DC ßèáßè½ßëúßëó ßï¿ßê¥ßîìßëÑ ßëúßèòßè«ßë╜ßèòßìú ßï¿ßêìßîêßê│ ßê¢ßëåßêÜßï½ßïÄßë╜ßèò ßèÑßèô ßï¿ßëáßîÄ ßìêßëâßï░ßè¥ßèÉßë╡ ßèÑßï╡ßêÄßë╜ßèò ßï½ßîêßèôßè¢ßêìßìó",
  homeFindFood: "≡ƒìÄ ßê¥ßîìßëÑ ßìêßêìßîì",
  homeIWantToHelp: "≡ƒÖï ßêÿßê¡ßï│ßë╡ ßèÑßìêßêìßîïßêêßêü",
  homeLocations: "ßëªßë│ßïÄßë╜",
  homeOpportunities: "ßèÑßï╡ßêÄßë╜",
  homeCounties: "ßï¿ßë░ßê╕ßìêßèæ ßè½ßïìßèòßë▓ßïÄßë╜",
  homeHowCanWeHelp: "ßèÑßèòßï┤ßë╡ ßêÿßê¡ßï│ßë╡ ßèÑßèòßë╜ßêïßêêßèò?",
  homeChooseBelow: "ßï¿ßêÜßìêßêìßîëßë╡ßèò ßï¡ßê¥ßê¿ßîí",
  homeFindFoodDesc: "ßëáßèáßëàßê½ßëóßï½ßïÄ ßï½ßêë ßï¿ßê¥ßîìßëÑ ßëúßèòßè«ßë╜ ßèÑßèô ßìòßê«ßîìßê½ßê₧ßë╜ßèò ßï½ßîìßèÖßìó",
  homeDonateDesc: "ßê¥ßèò ßèÑßèòßï░ßêÜßìêßêêßîì ßï¡ßêÿßêìßè¿ßë▒ ßèÑßèô ßê¥ßîìßëÑ ßïêßï¡ßê¥ ßêìßîêßê│ ßï¿ßë╡ ßê¢ßê╡ßëÇßêÿßîÑ ßèÑßèòßï░ßêÜßë╗ßêì ßï¡ßïêßëüßìó",
  homeVolunteerDesc: "ßï¿ßëáßîÄ ßìêßëâßï░ßè¥ßèÉßë╡ ßïòßï╡ßêÄßë╜ßèò ßï½ßîìßèÖ ΓÇö ßêÿßï░ßê¡ßï░ßê¡ßìú ßîôßê« ßèáßë╡ßè¡ßêìßë╡ßìú ßèÑßèô ßêîßêÄßë╜ßê¥ßìó",
  homeGetStarted: "ßîÇßê¥ßê¡ ΓåÆ",
  homeHowItWorks: "ßèÑßèòßï┤ßë╡ ßï¡ßê░ßê½ßêì",
  homeStep1Title: "ßìêßêìßîì",
  homeStep1Desc: "ßèáßëàßê½ßëóßï½ ßï½ßêë ßêÇßëÑßë╢ßë╜ßèò ßêêßê¢ßîìßèÿßë╡ ßè¿ßë░ßê¢ßïÄßèòßìú ZIP ßïêßï¡ßê¥ ßèáßï╡ßê½ßê╗ßïÄßèò ßï½ßê╡ßîêßëíßìó",
  homeStep2Title: "ßï│ßê╡ßê╡",
  homeStep2Desc: "ßëáßè½ßïìßèòßë▓ßìú ßëÇßèò ßèÑßèô ßï¿ßèÑßê¡ßï│ßë│ ßïôßï¡ßèÉßë╡ ßï¡ßîúßê⌐ßìú ßèÑßï½ßèòßï│ßèòßï▒ ßëªßë│ ßï¥ßê¡ßï¥ßê¡ ßêÿßê¿ßîâ ßï¡ßêÿßêìßè¿ßë▒ßìó",
  homeStep3Title: "ßêéßï╡",
  homeStep3Desc: "ßèáßëàßîúßî½ ßï½ßîìßèÖßìú ßèáßê╡ßëÇßï╡ßêÿßïì ßï¡ßï░ßïìßêë ßèÑßèô ßï¡ßîÄßëÑßèÖßìó ßê░ßïôßë╢ßë╣ßèò ßêüßêìßîèßï£ ßï½ßê¿ßîïßîìßîíßìó",

  consumerTitle: "ßê¥ßîìßëÑ ßëáßëàßê¡ßëí ßìêßêìßîì",
  consumerSub: "ßëáßê£ßê¬ßêïßèòßï╡ ßèÑßèô DC ßï¿ßê¥ßîìßëÑ ßëúßèòßè«ßë╜ßèò ßêêßê¢ßîìßèÿßë╡ ßè¿ßë░ßê¢ßìú ZIP ßïêßï¡ßê¥ ßèáßï╡ßê½ßê╗ ßï¡ßìêßêìßîëßìó",
  consumerSearchPlaceholder: "ßê¡ßëÇßë╡ ßêêßêÿßï░ßê¡ßï░ßê¡ ZIP ßï½ßê╡ßîêßëíΓÇª",
  consumerAllCounties: "ßêüßêëßê¥ ßè½ßïìßèòßë▓ßïÄßë╜",
  consumerAnyDay: "ßê¢ßèòßè¢ßïìßê¥ ßëÇßèò",
  consumerMyLocation: "≡ƒôì ßëªßë│ßï¼",
  consumerLocating: "ßèÑßï¿ßë░ßêêßï¿ΓÇª",
  consumerEmergencyBtn: "≡ƒÜ¿ ßèáßêüßèò ßê¥ßîìßëÑ ßï½ßê╡ßìêßêìßîêßè¢ßêì",
  consumerLocationsFound: "ßëªßë│ßïÄßë╜ ßë░ßîêßè¥ßë░ßïïßêì",

  emergencyTitle: "≡ƒÜ¿ ßèáßêüßèò ßê¥ßîìßëÑ ßï½ßê╡ßìêßêìßîêßè¢ßêì",
  emergencySub: "ßëáßèáßëàßê½ßëóßï½ßïÄ ßï½ßêë ßè¡ßììßë╡ ßï¿ßê¥ßîìßëÑ ßëªßë│ßïÄßë╜",
  emergencyFinding: "ßëªßë│ßïÄßèò ßèÑßï½ßîêßèÿΓÇª",
  emergencyFindingNote: "ßê▓ßîáßï¿ßëü ßï¿ßëªßë│ ßêÿßï│ßê¿ßê╗ ßï¡ßììßëÇßï▒ßìó",
  emergencyCallFree: "211 ßï¡ßï░ßïìßêë ΓÇö ßèÉßî╗ ßï¿ßèÑßê¡ßï│ßë│ ßêÿßê╡ßêÿßê¡",
  emergencyCallAvail: "24/7 ßï¡ßîêßè¢ßêì ┬╖ ßê¥ßîìßëÑßìú ßêÿßîáßêêßï½ ßèÑßèô ßèáßï░ßîï ßèÑßê¡ßï│ßë│",
  emergencyOrVisit: "ßïêßï¡ßê¥ ßè¿ßèÑßèÉßïÜßêà ßëªßë│ßïÄßë╜ ßèáßèòßï▒ßèò ßï¡ßîÄßëÑßèÖ:",
  emergencyCall: "≡ƒô₧ ßï¡ßï░ßïìßêë",
  emergencyDirections: "≡ƒù║ ßèáßëàßîúßî½",
  emergencyDenied: "ßï¿ßëªßë│ ßììßëâßï╡ ßë░ßè¿ßêìßè¡ßêÅßêìßìó ßëáßèáßê│ßê╜ßïÄ ßììßëâßï╡ ßï¡ßê╡ßîí ßèÑßèô ßèÑßèòßï░ßîêßèô ßï¡ßê₧ßè¡ßê⌐ßìó",
  emergencyFailed: "ßëªßë│ßïÄßèò ßê¢ßïêßëà ßèáßêìßë░ßë╗ßêêßê¥ßìó ZIP ßè«ßï╡ßïÄßèò ßï½ßê╡ßîêßëíßìó",
  emergencyNoLocations: "ßëàßê¡ßëÑ ßëªßë│ßïÄßë╜ ßèáßêìßë░ßîêßèÖßê¥ßìó",

  needsBoardTitle: "≡ƒñ¥ ßï¿ßê¢ßêàßëáßê¿ßê░ßëÑ ßììßêïßîÄßë╡ ßê░ßêîßï│",
  needsBoardSub: "ßê¥ßèò ßèÑßèòßï░ßêÜßìêßêìßîë ßêÜßê╡ßîÑßê½ßïè ßï½ßê╡ßëÇßê¥ßîí ΓÇö ßëàßê¡ßëÑ ßï½ßêê ßêêßîïßê╜ ßïêßï¡ßê¥ ßëáßîÄ ßìêßëâßï░ßè¢ ßêèßê¿ßï│ ßï¡ßë╜ßêïßêìßìó",
  needsBoardPostBtn: "+ ßììßêïßîÄßë╡ ßêêßîÑßìì",
  needsBoardCancel: "Γ£ò ßê░ßê¡ßï¥",
  needsBoardFormTitle: "ßê¥ßèò ßï½ßê╡ßìêßêìßîïßêì?",
  needsBoardAnon: "ßê╡ßê¥ ßï¿ßêêßê¥ßìú ßêÿßë│ßïêßëéßï½ ßï¿ßêêßê¥ ΓÇö ßêÖßêë ßêÜßê╡ßîÑßê½ßïèßìó",
  needsBoardINeed: "ßï¿ßê¥ßìêßêìßîêßïì",
  needsBoardZip: "ßëàßê¡ßëí ZIP ßè«ßï╡",
  needsBoardUrgency: "ßê¥ßèò ßï½ßêàßêì ßèáßê╡ßë╕ßè│ßï¡?",
  needsBoardTravel: "ßêÿßîôßï¥ ßï¡ßë╜ßêïßêë?",
  needsBoardDetails: "ßï¥ßê¡ßï¥ßê«ßë╜ (ßèáßê¢ßê½ßî¡)",
  needsBoardDetailsPlaceholder: "ßêê4 ßëñßë░ßê░ßëÑßìú ßêâßêïßêì ßê¥ßîìßëÑΓÇª",
  needsBoardSubmit: "ßîÑßï½ßëä ßêêßîÑßìì",
  needsBoardSuccess: "Γ£à ßîÑßï½ßëäßïÄ ßêÜßê╡ßîÑßê½ßïè ßêåßèû ßë░ßêêßîÑßìÅßêìßìó",
  needsBoardEmpty: "ßèáßêüßèò ßèòßëü ßîÑßï½ßëäßïÄßë╜ ßï¿ßêëßê¥ßìó",
  needsBoardEmptySub: "ßï¿ßêÜßìêßêìßîëßë╡ßèò ßêêßê¢ßê╡ßëÇßêÿßîÑ \"ßììßêïßîÄßë╡ ßêêßîÑßìì\" ßï¡ßî½ßèæßìó",
  needsBoardICanHelp: "Γ£ï ßêìßê¡ßï│ ßèÑßë╜ßêïßêêßêü",
  needsBoardFulfilled: "ßëàßê¡ßëíßèò ßï¿ßë░ßêƒßêë",
  needsBoardUrgencyToday: "ΓÜí ßï¢ßê¼",
  needsBoardUrgencyWeek: "≡ƒôà ßï¡ßêà ßê│ßê¥ßèòßë╡",
  needsBoardUrgencyFlex: "≡ƒòÉ ßë░ßêêßïïßïïßî¡",
  needsBoardMobilityWalk: "≡ƒÜ╢ ßêÿßêäßï╡ ßèÑßë╜ßêïßêêßêü",
  needsBoardMobilityDelivery: "≡ƒÅá ßê¢ßê╡ßë░ßêïßêêßìì ßï½ßê╡ßìêßêìßîïßêì",
  needsBoardMobilityEither: "≡ƒÜ╢/≡ƒÅá ßêüßêêßë▒ßê¥",

  donorTitle: "ßê¥ßîìßëÑ ßïêßï¡ßê¥ ßîêßèòßïÿßëÑ ßêêßîìßê▒",
  donorSub: "ßê¥ßîìßëÑ ßïêßï¡ßê¥ ßîêßèòßïÿßëÑ ßêÿßêêßîêßê╡ ßï¿ßêÜßë╗ßêìßëúßë╕ßïì ßëªßë│ßïÄßë╜ßìó",
  donorMyLocation: "≡ƒôì ßëªßë│ßï¼",
  donorNeedStats: "≡ƒôè ßê╡ßë│ßë▓ßê╡ßë▓ßè¡ßê╡",
  donorFoodDesertMap: "≡ƒù║ ßï¿ßê¥ßîìßëÑ ßê¥ßï╡ßê¿ ßëáßï│ ßè½ßê¡ßë│",
  donorMyImpact: "≡ƒÆ¢ ßë░ßî╜ßïòßèûßï¼",

  footerTagline: "ßè¡ßììßë╡ ßê¥ßèòßî¡ ┬╖ ßïìßêéßëí ßï½ßêìßë░ßêƒßêï ßêèßêåßèò ßï¡ßë╜ßêïßêì ┬╖ ßêüßêìßîèßï£ ßè¿ßï╡ßê¡ßîàßë▒ ßï½ßê¿ßîïßîìßîí",
};

const fr: Translations = {
  navFindFood: "Trouver de l'Aide",
  navDonate: "Donner",
  navVolunteer: "B├⌐n├⌐vole",
  navAbout: "├Ç propos",

  homeHeroTitle: "Aide Alimentaire,\nL├á O├╣ Vous en Avez Besoin",
  homeHeroSub: "NourishNet connecte les personnes du Maryland et de la r├⌐gion de DC avec des banques alimentaires, des points de d├⌐p├┤t et des opportunit├⌐s de b├⌐n├⌐volat.",
  homeFindFood: "≡ƒìÄ Trouver de la Nourriture",
  homeIWantToHelp: "≡ƒÖï Je Veux Aider",
  homeLocations: "Emplacements",
  homeOpportunities: "Opportunit├⌐s",
  homeCounties: "Comt├⌐s Couverts",
  homeHowCanWeHelp: "Comment Pouvons-Nous Aider?",
  homeChooseBelow: "Choisissez ce que vous cherchez",
  homeFindFoodDesc: "Trouvez des banques alimentaires et des programmes de repas pr├¿s de chez vous.",
  homeDonateDesc: "Voyez ce dont on a besoin et o├╣ d├⌐poser des dons alimentaires ou financiers.",
  homeVolunteerDesc: "Trouvez des cr├⌐neaux de b├⌐n├⌐volat ΓÇö tri, jardinage, services aux clients.",
  homeGetStarted: "Commencer ΓåÆ",
  homeHowItWorks: "Comment ├ça Marche",
  homeStep1Title: "Chercher",
  homeStep1Desc: "Entrez votre ville, code postal ou adresse pour trouver des ressources ├á proximit├⌐.",
  homeStep2Title: "Parcourir",
  homeStep2Desc: "Filtrez par comt├⌐, jour, type d'aide et consultez les d├⌐tails.",
  homeStep3Title: "Y Aller",
  homeStep3Desc: "Obtenez un itin├⌐raire, appelez ├á l'avance et visitez. Confirmez les horaires.",

  consumerTitle: "Trouver de la Nourriture Pr├¿s de Vous",
  consumerSub: "Recherchez par ville, code postal, comt├⌐ ou adresse pour trouver des banques alimentaires au Maryland et ├á DC.",
  consumerSearchPlaceholder: "Entrez un code postal pour trier par distanceΓÇª",
  consumerAllCounties: "Tous les comt├⌐s",
  consumerAnyDay: "N'importe quel jour",
  consumerMyLocation: "≡ƒôì Ma Position",
  consumerLocating: "LocalisationΓÇª",
  consumerEmergencyBtn: "≡ƒÜ¿ J'ai Besoin de Nourriture",
  consumerLocationsFound: "emplacements trouv├⌐s",

  emergencyTitle: "≡ƒÜ¿ J'ai Besoin de Nourriture",
  emergencySub: "Lieux d'aide alimentaire ouverts les plus proches",
  emergencyFinding: "Recherche de votre positionΓÇª",
  emergencyFindingNote: "Autorisez l'acc├¿s ├á la position quand on vous le demande.",
  emergencyCallFree: "Appelez le 211 ΓÇö Ligne Gratuite",
  emergencyCallAvail: "Disponible 24h/24 ┬╖ Nourriture, h├⌐bergement et aide en crise",
  emergencyOrVisit: "Ou visitez l'un de ces endroits pr├¿s de chez vous:",
  emergencyCall: "≡ƒô₧ Appeler",
  emergencyDirections: "≡ƒù║ Itin├⌐raire",
  emergencyDenied: "Acc├¿s ├á la position refus├⌐. Autorisez dans votre navigateur et r├⌐essayez.",
  emergencyFailed: "Impossible de d├⌐tecter votre position. Essayez d'entrer votre code postal.",
  emergencyNoLocations: "Aucun emplacement proche trouv├⌐.",

  needsBoardTitle: "≡ƒñ¥ Tableau des Besoins",
  needsBoardSub: "Publiez anonymement ce dont vous avez besoin ΓÇö un b├⌐n├⌐vole ou donateur proche peut aider.",
  needsBoardPostBtn: "+ Publier un Besoin",
  needsBoardCancel: "Γ£ò Annuler",
  needsBoardFormTitle: "De quoi avez-vous besoin?",
  needsBoardAnon: "Pas de nom, pas de pi├¿ce d'identit├⌐ ΓÇö compl├¿tement anonyme.",
  needsBoardINeed: "J'ai besoin de",
  needsBoardZip: "Pr├¿s du code postal",
  needsBoardUrgency: "Quelle urgence?",
  needsBoardTravel: "Pouvez-vous vous d├⌐placer?",
  needsBoardDetails: "D├⌐tails (optionnel)",
  needsBoardDetailsPlaceholder: "ex. Certifi├⌐ halal, pour une famille de 4, lait maternis├⌐ taille 1ΓÇª",
  needsBoardSubmit: "Publier la Demande",
  needsBoardSuccess: "Γ£à Votre demande a ├⌐t├⌐ publi├⌐e anonymement.",
  needsBoardEmpty: "Aucune demande active pour le moment.",
  needsBoardEmptySub: "Si vous avez besoin de quelque chose, cliquez sur \"Publier un Besoin.\"",
  needsBoardICanHelp: "Γ£ï Je Peux Aider",
  needsBoardFulfilled: "R├⌐cemment R├⌐alis├⌐es",
  needsBoardUrgencyToday: "ΓÜí Aujourd'hui",
  needsBoardUrgencyWeek: "≡ƒôà Cette semaine",
  needsBoardUrgencyFlex: "≡ƒòÉ Flexible",
  needsBoardMobilityWalk: "≡ƒÜ╢ Je peux marcher",
  needsBoardMobilityDelivery: "≡ƒÅá Besoin de livraison",
  needsBoardMobilityEither: "≡ƒÜ╢/≡ƒÅá L'un ou l'autre",

  donorTitle: "Donner de la Nourriture ou des Fonds",
  donorSub: "emplacements dans le Maryland o├╣ vous pouvez faire des dons.",
  donorMyLocation: "≡ƒôì Ma Position",
  donorNeedStats: "≡ƒôè Statistiques",
  donorFoodDesertMap: "≡ƒù║ Carte des D├⌐serts",
  donorMyImpact: "≡ƒÆ¢ Mon Impact",

  footerTagline: "Projet open-source ┬╖ Les donn├⌐es peuvent ├¬tre incompl├¿tes ┬╖ Confirmez toujours avec l'organisation",
};

export const TRANSLATIONS: Record<LangCode, Translations> = { en, es, am, fr };

export const LANG_NAMES: Record<LangCode, string> = {
  en: "English",
  es: "Espa├▒ol",
  am: "ßèáßê¢ßê¡ßè¢",
  fr: "Fran├ºais",
};