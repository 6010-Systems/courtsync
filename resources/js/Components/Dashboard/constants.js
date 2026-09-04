// ---------------------------------------------------------------------------
// CourtSync — Dashboard Constants & Brand Design Tokens
// ---------------------------------------------------------------------------

export const DASHBOARD_THEME = {
  FOREST: '#101F1A',
  FOREST_2: '#10221C',
  CREAM: '#F5F2EA',
  LIME: '#D6FF3F',
  LIME_HOVER: '#C2EA2E',
  CORAL: '#FF5A36',
  CORAL_TEXT: '#B8391D',
  MUTED_SAGE: '#5A756C',
  MUTED_SAND: '#C2BAA6',
  BORDER_COLOR: 'rgba(16, 34, 28, 0.12)',
};

export const DEFAULT_DATE_RANGES = ['Today', 'This Week', 'This Month', 'This Year'];

// Dynamic Revenue Data mapped by Date Range with expressive visual variations & peaks
export const MOCK_REVENUE_BY_RANGE = {
  'Today': {
    totalRevenue: '₱14,850',
    delta: 18,
    comparisonText: 'vs ₱12,500 yesterday',
    trend: [
      { time: '8 AM', v: 800, label: '₱800' },
      { time: '10 AM', v: 1400, label: '₱1,400' },
      { time: '12 PM', v: 1100, label: '₱1,100' },
      { time: '2 PM', v: 1950, label: '₱1,950' },
      { time: '4 PM', v: 2800, label: '₱2,800' },
      { time: '6 PM', v: 4200, label: '₱4,200' },
      { time: '8 PM', v: 3600, label: '₱3,600' },
      { time: '10 PM', v: 1200, label: '₱1,200' },
    ],
  },
  'This Week': {
    totalRevenue: '₱82,450',
    delta: 12,
    comparisonText: 'vs ₱73,600 last week',
    trend: [
      { time: 'Mon', v: 6400, label: '₱6,400' },
      { time: 'Tue', v: 9200, label: '₱9,200' },
      { time: 'Wed', v: 8100, label: '₱8,100' },
      { time: 'Thu', v: 12400, label: '₱12,400' },
      { time: 'Fri', v: 17800, label: '₱17,800' },
      { time: 'Sat', v: 24550, label: '₱24,550' },
      { time: 'Sun', v: 21000, label: '₱21,000' },
    ],
  },
  'This Month': {
    totalRevenue: '₱348,200',
    delta: 24,
    comparisonText: 'vs ₱280,500 last month',
    trend: [
      { time: 'Week 1', v: 68400, label: '₱68,400' },
      { time: 'Week 2', v: 79200, label: '₱79,200' },
      { time: 'Week 3', v: 92500, label: '₱92,500' },
      { time: 'Week 4', v: 108100, label: '₱108,100' },
    ],
  },
  'This Year': {
    totalRevenue: '₱4,120,000',
    delta: 31,
    comparisonText: 'vs ₱3,145,000 last year',
    trend: [
      { time: 'Jan', v: 190000, label: '₱190k' },
      { time: 'Feb', v: 220000, label: '₱220k' },
      { time: 'Mar', v: 280000, label: '₱280k' },
      { time: 'Apr', v: 350000, label: '₱350k' },
      { time: 'May', v: 410000, label: '₱410k' },
      { time: 'Jun', v: 330000, label: '₱330k' },
      { time: 'Jul', v: 290000, label: '₱290k' },
      { time: 'Aug', v: 360000, label: '₱360k' },
      { time: 'Sep', v: 420000, label: '₱420k' },
      { time: 'Oct', v: 460000, label: '₱460k' },
      { time: 'Nov', v: 490000, label: '₱490k' },
      { time: 'Dec', v: 520000, label: '₱520k' },
    ],
  },
};

export const MOCK_REVENUE_TREND = MOCK_REVENUE_BY_RANGE['This Week'].trend;

// Brand palette: Top leader is Volt/Lime (#D6FF3F), followed by Forest, Coral, Sage, Sand
export const MOCK_PAYMENT_SPLIT = [
  { label: 'GCash', value: 34500, pct: 42, color: DASHBOARD_THEME.LIME, isPrimary: true },
  { label: 'Cash', value: 18200, pct: 22, color: DASHBOARD_THEME.FOREST_2 },
  { label: 'Maya', value: 14100, pct: 17, color: DASHBOARD_THEME.CORAL },
  { label: 'QR Ph', value: 9800, pct: 12, color: DASHBOARD_THEME.MUTED_SAGE },
  { label: 'Card', value: 5900, pct: 7, color: DASHBOARD_THEME.MUTED_SAND },
];

// Brand palette: Top court is Volt/Lime (#D6FF3F), followed by Forest, Coral, Sand
export const MOCK_COURT_REVENUE = [
  { name: 'Court 1 — Badminton', sport: 'Badminton', value: 32400, color: DASHBOARD_THEME.LIME, isPrimary: true },
  { name: 'Court 2 — Futsal', sport: 'Futsal', value: 24100, color: DASHBOARD_THEME.FOREST_2 },
  { name: 'Court 3 — Pickleball', sport: 'Pickleball', value: 15800, color: DASHBOARD_THEME.CORAL },
  { name: 'Court 4 — Table Tennis', sport: 'Table Tennis', value: 9200, color: DASHBOARD_THEME.MUTED_SAND },
];

export const MOCK_HOURS = ['8A', '10A', '12P', '2P', '4P', '6P', '8P'];
export const MOCK_COURTS = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];

// Heatmap intensity 0..1 per court and hour
export const MOCK_HEATMAP = [
  [0.15, 0.20, 0.35, 0.30, 0.55, 0.95, 0.90],
  [0.10, 0.15, 0.40, 0.50, 0.60, 0.75, 0.65],
  [0.05, 0.10, 0.20, 0.25, 0.45, 0.60, 0.80],
  [0.20, 0.30, 0.30, 0.20, 0.50, 0.85, 0.70],
];

export const MOCK_NEXT_SESSIONS = [
  {
    id: 's-1',
    name: 'Miguel Santos',
    sport: 'Badminton',
    court: 'Court 1',
    time: '5:00 PM',
    duration: '1h',
    source: 'Online',
    status: 'Upcoming',
    initials: 'MS',
    amount: '₱450',
  },
  {
    id: 's-2',
    name: 'Andrea Cruz',
    sport: 'Futsal',
    court: 'Court 2',
    time: '5:30 PM',
    duration: '1.5h',
    source: 'Walk-in',
    status: 'Upcoming',
    initials: 'AC',
    amount: '₱900',
  },
  {
    id: 's-3',
    name: 'Team Bogo FC',
    sport: 'Futsal',
    court: 'Court 2',
    time: '6:30 PM',
    duration: '2h',
    source: 'Online',
    status: 'Upcoming',
    initials: 'TB',
    amount: '₱1,200',
  },
  {
    id: 's-4',
    name: 'Ella Dela Peña',
    sport: 'Pickleball',
    court: 'Court 3',
    time: '7:00 PM',
    duration: '1h',
    source: 'Online',
    status: 'Upcoming',
    initials: 'ED',
    amount: '₱500',
  },
  {
    id: 's-5',
    name: 'Rico Villanueva',
    sport: 'Table Tennis',
    court: 'Court 4',
    time: '7:30 PM',
    duration: '1h',
    source: 'Staff',
    status: 'Upcoming',
    initials: 'RV',
    amount: '₱350',
  },
];

export const MOCK_POPULAR_DAYS = [
  { day: 'Mon', label: 'Monday', level: 3, bookings: 14 },
  { day: 'Tue', label: 'Tuesday', level: 2, bookings: 10 },
  { day: 'Wed', label: 'Wednesday', level: 4, bookings: 18 },
  { day: 'Thu', label: 'Thursday', level: 3, bookings: 15 },
  { day: 'Fri', label: 'Friday', level: 6, bookings: 28 },
  { day: 'Sat', label: 'Saturday', level: 8, bookings: 42 },
  { day: 'Sun', label: 'Sunday', level: 7, bookings: 36 },
];

export const MOCK_COURT_STATUSES = [
  { name: 'Court 1 (Badminton)', occupied: true, currentSession: 'Miguel Santos' },
  { name: 'Court 2 (Futsal)', occupied: true, currentSession: 'Andrea Cruz' },
  { name: 'Court 3 (Pickleball)', occupied: true, currentSession: 'Ella Dela Peña' },
  { name: 'Court 4 (Table Tennis)', occupied: true, currentSession: 'Rico Villanueva' },
];
