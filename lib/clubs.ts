// ============================================================
// CATÁLOGO DE CLUBES Y SELECCIONES
// ============================================================
// Alimenta el desplegable "Club" del alta de productos y el
// filtro "Club" de la vitrina.
//
// Al elegir un club se autocompleta la liga, así que un mismo
// club no puede aparecer en dos grupos. Si hace falta cargar
// algo que no está en la lista, el formulario deja escribir
// el nombre a mano (opción "Otro").
// ============================================================

export interface ClubGroup {
  /** Nombre de la liga — es lo que se guarda en products.league */
  league: string
  /** País o confederación, sólo para agrupar visualmente */
  region: string
  clubs: string[]
}

export const CLUB_GROUPS: ClubGroup[] = [
  // ── ARGENTINA ──────────────────────────────────────────────
  {
    league: 'Liga Profesional',
    region: 'Argentina',
    clubs: [
      'Argentinos Juniors', 'Atlético Tucumán', 'Banfield', 'Barracas Central',
      'Belgrano', 'Boca Juniors', 'Central Córdoba', 'Defensa y Justicia',
      'Deportivo Riestra', 'Estudiantes de La Plata', 'Gimnasia y Esgrima La Plata',
      'Godoy Cruz', 'Huracán', 'Independiente', 'Independiente Rivadavia',
      'Instituto', 'Lanús', 'Newell\'s Old Boys', 'Platense', 'Racing Club',
      'River Plate', 'Rosario Central', 'San Lorenzo', 'Sarmiento',
      'Talleres', 'Tigre', 'Unión', 'Vélez Sarsfield',
    ],
  },
  {
    league: 'Primera Nacional',
    region: 'Argentina',
    clubs: [
      'Aldosivi', 'All Boys', 'Almagro', 'Almirante Brown', 'Arsenal',
      'Atlanta', 'Chacarita Juniors', 'Colón', 'Deportivo Morón',
      'Ferro Carril Oeste', 'Gimnasia y Esgrima Mendoza', 'Nueva Chicago',
      'Patronato', 'Quilmes', 'San Martín de Tucumán', 'San Telmo',
      'Temperley', 'Tristán Suárez',
    ],
  },

  // ── SUDAMÉRICA ─────────────────────────────────────────────
  {
    league: 'Brasileirão Série A',
    region: 'Brasil',
    clubs: [
      'Atlético Mineiro', 'Athletico Paranaense', 'Bahia', 'Botafogo',
      'Corinthians', 'Cruzeiro', 'Cuiabá', 'Flamengo', 'Fluminense',
      'Fortaleza', 'Grêmio', 'Internacional', 'Juventude', 'Palmeiras',
      'Red Bull Bragantino', 'Santos', 'São Paulo', 'Sport Recife',
      'Vasco da Gama', 'Vitória',
    ],
  },
  {
    league: 'Primera División de Uruguay',
    region: 'Uruguay',
    clubs: [
      'Boston River', 'Cerro Largo', 'Danubio', 'Defensor Sporting',
      'Liverpool de Montevideo', 'Montevideo City Torque', 'Nacional',
      'Peñarol', 'Progreso', 'Racing de Montevideo', 'River Plate de Uruguay',
      'Wanderers',
    ],
  },
  {
    league: 'Primera División de Chile',
    region: 'Chile',
    clubs: [
      'Audax Italiano', 'Cobreloa', 'Colo-Colo', 'Coquimbo Unido',
      'Deportes Iquique', 'Everton de Viña del Mar', 'Huachipato',
      'Ñublense', 'O\'Higgins', 'Palestino', 'Unión Española',
      'Unión La Calera', 'Universidad Católica', 'Universidad de Chile',
    ],
  },
  {
    league: 'Categoría Primera A',
    region: 'Colombia',
    clubs: [
      'Atlético Nacional', 'América de Cali', 'Deportes Tolima',
      'Deportivo Cali', 'Deportivo Pereira', 'Independiente Medellín',
      'Independiente Santa Fe', 'Junior', 'Millonarios', 'Once Caldas',
    ],
  },
  {
    league: 'Liga 1 de Perú',
    region: 'Perú',
    clubs: [
      'Alianza Lima', 'Cienciano', 'Melgar', 'Sport Boys',
      'Sporting Cristal', 'Universitario de Deportes',
    ],
  },
  {
    league: 'Serie A de Ecuador',
    region: 'Ecuador',
    clubs: [
      'Aucas', 'Barcelona SC', 'Deportivo Cuenca', 'Emelec',
      'Independiente del Valle', 'LDU Quito',
    ],
  },
  {
    league: 'Primera División de Paraguay',
    region: 'Paraguay',
    clubs: [
      'Cerro Porteño', 'Guaraní', 'Libertad', 'Nacional de Paraguay', 'Olimpia',
    ],
  },
  {
    league: 'División Profesional de Bolivia',
    region: 'Bolivia',
    clubs: ['Bolívar', 'Jorge Wilstermann', 'Oriente Petrolero', 'The Strongest'],
  },
  {
    league: 'Liga FUTVE',
    region: 'Venezuela',
    clubs: ['Caracas FC', 'Deportivo Táchira', 'Estudiantes de Mérida', 'Zamora'],
  },

  // ── EUROPA ─────────────────────────────────────────────────
  {
    league: 'Premier League',
    region: 'Inglaterra',
    clubs: [
      'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
      'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town',
      'Leicester City', 'Liverpool', 'Manchester City', 'Manchester United',
      'Newcastle United', 'Nottingham Forest', 'Southampton', 'Tottenham Hotspur',
      'West Ham United', 'Wolverhampton',
    ],
  },
  {
    league: 'EFL Championship',
    region: 'Inglaterra',
    clubs: [
      'Birmingham City', 'Blackburn Rovers', 'Cardiff City', 'Coventry City',
      'Derby County', 'Leeds United', 'Middlesbrough', 'Norwich City',
      'Sheffield United', 'Sheffield Wednesday', 'Stoke City', 'Sunderland',
      'Swansea City', 'Watford', 'West Bromwich Albion',
    ],
  },
  {
    league: 'LaLiga',
    region: 'España',
    clubs: [
      'Alavés', 'Athletic Club', 'Atlético de Madrid', 'Barcelona', 'Celta de Vigo',
      'Espanyol', 'Getafe', 'Girona', 'Las Palmas', 'Leganés', 'Mallorca',
      'Osasuna', 'Rayo Vallecano', 'Real Betis', 'Real Madrid', 'Real Sociedad',
      'Sevilla', 'Valencia', 'Valladolid', 'Villarreal',
    ],
  },
  {
    league: 'Serie A',
    region: 'Italia',
    clubs: [
      'Atalanta', 'Bologna', 'Cagliari', 'Como', 'Empoli', 'Fiorentina',
      'Genoa', 'Hellas Verona', 'Inter de Milán', 'Juventus', 'Lazio',
      'Lecce', 'Milan', 'Monza', 'Napoli', 'Parma', 'Roma', 'Torino',
      'Udinese', 'Venezia',
    ],
  },
  {
    league: 'Bundesliga',
    region: 'Alemania',
    clubs: [
      'Augsburg', 'Bayer Leverkusen', 'Bayern Múnich', 'Bochum',
      'Borussia Dortmund', 'Borussia Mönchengladbach', 'Eintracht Frankfurt',
      'Friburgo', 'Heidenheim', 'Hoffenheim', 'Holstein Kiel', 'Mainz 05',
      'RB Leipzig', 'St. Pauli', 'Stuttgart', 'Union Berlin', 'Werder Bremen',
      'Wolfsburg',
    ],
  },
  {
    league: 'Ligue 1',
    region: 'Francia',
    clubs: [
      'Angers', 'Auxerre', 'Brest', 'Le Havre', 'Lens', 'Lille', 'Lyon',
      'Marsella', 'Mónaco', 'Montpellier', 'Nantes', 'Niza',
      'Paris Saint-Germain', 'Reims', 'Rennes', 'Saint-Étienne',
      'Strasbourg', 'Toulouse',
    ],
  },
  {
    league: 'Primeira Liga',
    region: 'Portugal',
    clubs: [
      'Benfica', 'Boavista', 'Braga', 'Estoril', 'Famalicão', 'Gil Vicente',
      'Moreirense', 'Porto', 'Rio Ave', 'Sporting CP', 'Vitória de Guimarães',
    ],
  },
  {
    league: 'Eredivisie',
    region: 'Países Bajos',
    clubs: [
      'Ajax', 'AZ Alkmaar', 'Feyenoord', 'FC Twente', 'FC Utrecht',
      'Go Ahead Eagles', 'Heerenveen', 'NEC Nijmegen', 'PSV Eindhoven',
      'Sparta Rotterdam',
    ],
  },
  {
    league: 'Süper Lig',
    region: 'Turquía',
    clubs: [
      'Beşiktaş', 'Fenerbahçe', 'Galatasaray', 'İstanbul Başakşehir',
      'Trabzonspor',
    ],
  },
  {
    league: 'Scottish Premiership',
    region: 'Escocia',
    clubs: ['Aberdeen', 'Celtic', 'Heart of Midlothian', 'Hibernian', 'Rangers'],
  },
  {
    league: 'Jupiler Pro League',
    region: 'Bélgica',
    clubs: [
      'Anderlecht', 'Antwerp', 'Club Brujas', 'Genk', 'Gent', 'Standard Lieja',
    ],
  },
  {
    league: 'Super League Grecia',
    region: 'Grecia',
    clubs: ['AEK Atenas', 'Olympiacos', 'PAOK', 'Panathinaikos'],
  },
  {
    league: 'Super League Suiza',
    region: 'Suiza',
    clubs: ['Basilea', 'Grasshopper', 'Young Boys', 'Zúrich'],
  },
  {
    league: 'Bundesliga de Austria',
    region: 'Austria',
    clubs: ['Austria Viena', 'LASK', 'Rapid Viena', 'Red Bull Salzburgo'],
  },
  {
    league: 'Otras ligas de Europa',
    region: 'Europa',
    clubs: [
      'CSKA Moscú', 'Dinamo Kiev', 'Dinamo Zagreb', 'Estrella Roja',
      'Ferencváros', 'Hajduk Split', 'Legia Varsovia', 'Lokomotiv Moscú',
      'Olimpija Liubliana', 'Partizán', 'Shakhtar Donetsk', 'Slavia Praga',
      'Sparta Praga', 'Spartak Moscú', 'Steaua Bucarest', 'Zenit',
    ],
  },

  // ── NORTE Y CENTROAMÉRICA ──────────────────────────────────
  {
    league: 'Liga MX',
    region: 'México',
    clubs: [
      'América', 'Atlas', 'Atlético San Luis', 'Cruz Azul', 'Guadalajara',
      'León', 'Mazatlán', 'Monterrey', 'Necaxa', 'Pachuca', 'Puebla',
      'Pumas UNAM', 'Querétaro', 'Santos Laguna', 'Tigres UANL',
      'Tijuana', 'Toluca',
    ],
  },
  {
    league: 'Major League Soccer',
    region: 'Estados Unidos',
    clubs: [
      'Atlanta United', 'Austin FC', 'Chicago Fire', 'Colorado Rapids',
      'Columbus Crew', 'DC United', 'FC Cincinnati', 'FC Dallas',
      'Houston Dynamo', 'Inter Miami', 'LA Galaxy', 'LAFC',
      'Minnesota United', 'Nashville SC', 'New England Revolution',
      'New York City FC', 'New York Red Bulls', 'Orlando City',
      'Philadelphia Union', 'Portland Timbers', 'Real Salt Lake',
      'San Jose Earthquakes', 'Seattle Sounders', 'Sporting Kansas City',
      'St. Louis City', 'Toronto FC', 'Vancouver Whitecaps',
    ],
  },

  // ── RESTO DEL MUNDO ────────────────────────────────────────
  {
    league: 'Saudi Pro League',
    region: 'Arabia Saudita',
    clubs: ['Al-Ahli', 'Al-Hilal', 'Al-Ittihad', 'Al-Nassr'],
  },
  {
    league: 'J1 League',
    region: 'Japón',
    clubs: [
      'Cerezo Osaka', 'Gamba Osaka', 'Kashima Antlers', 'Kawasaki Frontale',
      'Urawa Red Diamonds', 'Vissel Kobe', 'Yokohama F. Marinos',
    ],
  },
  {
    league: 'K League 1',
    region: 'Corea del Sur',
    clubs: ['FC Seoul', 'Jeonbuk Hyundai Motors', 'Ulsan HD'],
  },
  {
    league: 'Otras ligas del mundo',
    region: 'Mundo',
    clubs: [
      'Al Ahly', 'Boca Unidos', 'Guangzhou FC', 'Kaizer Chiefs',
      'Mamelodi Sundowns', 'Melbourne Victory', 'Orlando Pirates',
      'Raja Casablanca', 'Shanghai Port', 'Sydney FC', 'Wydad Casablanca',
      'Zamalek',
    ],
  },

  // ── SELECCIONES ────────────────────────────────────────────
  {
    league: 'Selecciones — Conmebol',
    region: 'Selecciones',
    clubs: [
      'Argentina', 'Bolivia (selección)', 'Brasil', 'Chile (selección)',
      'Colombia', 'Ecuador', 'Paraguay', 'Perú', 'Uruguay', 'Venezuela',
    ],
  },
  {
    league: 'Selecciones — UEFA',
    region: 'Selecciones',
    clubs: [
      'Alemania', 'Austria', 'Bélgica', 'Croacia', 'Dinamarca', 'Escocia',
      'España', 'Francia', 'Gales', 'Grecia', 'Hungría', 'Inglaterra',
      'Irlanda', 'Italia', 'Noruega', 'Países Bajos', 'Polonia', 'Portugal',
      'República Checa', 'Rumania', 'Rusia', 'Serbia', 'Suecia', 'Suiza',
      'Turquía', 'Ucrania',
    ],
  },
  {
    league: 'Selecciones — Concacaf',
    region: 'Selecciones',
    clubs: [
      'Canadá', 'Costa Rica', 'Estados Unidos', 'Honduras', 'Jamaica',
      'México', 'Panamá',
    ],
  },
  {
    league: 'Selecciones — CAF',
    region: 'Selecciones',
    clubs: [
      'Argelia', 'Camerún', 'Costa de Marfil', 'Egipto', 'Ghana',
      'Marruecos', 'Nigeria', 'Senegal', 'Sudáfrica', 'Túnez',
    ],
  },
  {
    league: 'Selecciones — AFC y OFC',
    region: 'Selecciones',
    clubs: [
      'Arabia Saudita', 'Australia', 'Catar', 'China', 'Corea del Sur',
      'Irán', 'Japón', 'Nueva Zelanda',
    ],
  },
]

/** Valor especial del select para habilitar la carga a mano. */
export const CLUB_OTHER = '__otro__'

/** Todos los clubes, ordenados alfabéticamente y sin repetidos. */
export const ALL_CLUBS: string[] = Array.from(
  new Set(CLUB_GROUPS.flatMap((g) => g.clubs))
).sort((a, b) => a.localeCompare(b, 'es'))

/** club → liga, para autocompletar el campo Liga al elegir un club. */
const LEAGUE_BY_CLUB: Record<string, string> = CLUB_GROUPS.reduce(
  (acc, group) => {
    for (const club of group.clubs) acc[club] = group.league
    return acc
  },
  {} as Record<string, string>
)

/** Devuelve la liga de un club, o '' si es un club cargado a mano. */
export function leagueForClub(club: string): string {
  return LEAGUE_BY_CLUB[club] ?? ''
}

/** true si el club está en el catálogo (define si el form abre el campo libre). */
export function isKnownClub(club: string): boolean {
  return club in LEAGUE_BY_CLUB
}
