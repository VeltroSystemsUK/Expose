export const colors = {
  black:        '#0A0A0B',
  surface:      '#111114',
  surface2:     '#18181D',
  surface3:     '#1F1F26',
  border:       '#2A2A35',
  borderLight:  '#3A3A48',
  text:         '#F0EFE8',
  textMuted:    '#8A8A9A',
  textDim:      '#555565',
  accent:       '#CDFE00',
  accentSoft:   'rgba(205,254,0,0.1)',
  accentBorder: 'rgba(205,254,0,0.3)',
  danger:       '#E8402A',
  dangerSoft:   'rgba(232,64,42,0.12)',
  dangerBorder: 'rgba(232,64,42,0.3)',
  amber:        '#F5A623',
  amberSoft:    'rgba(245,166,35,0.1)',
  amberBorder:  'rgba(245,166,35,0.3)',
  green:        '#2ECC71',
  greenSoft:    'rgba(46,204,113,0.1)',
  greenBorder:  'rgba(46,204,113,0.3)',
  blue:         '#4A9EFF',
  blueSoft:     'rgba(74,158,255,0.1)',
} as const;

export const typography = {
  fontSyne: 'Syne',
  fontMono: 'DMMono',
  xs: 9, sm: 11, base: 13, md: 15, lg: 18, xl: 22, xxl: 28, hero: 42,
  light: '300' as const, regular: '400' as const, medium: '500' as const,
  semibold: '600' as const, bold: '700' as const, black: '800' as const,
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, page: 24,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, pill: 100,
} as const;
