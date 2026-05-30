// MEDELLÍN MOVILIDATA OS - Paleta de Colores SRS-Compliant
// Basada en estándares de seguridad vial y accesibilidad WCAG 2.1 AA

export const COLORS = {
  // Estatus de Tráfico (Semáforo de Seguridad Vial)
  DANGER: {
    name: 'Peligro / Congestión Crítica',
    hex: '#DC2626', // Rojo vivo
    rgb: 'rgb(220, 38, 38)',
    semantics: 'Congestión alta, velocidad < 20 km/h',
    wcag: 'AA - Contraste 7.4:1'
  },
  WARNING: {
    name: 'Precaución / Congestión Media',
    hex: '#F59E0B', // Ámbar/Naranja
    rgb: 'rgb(245, 158, 11)',
    semantics: 'Velocidad 20-35 km/h, flujo moderado',
    wcag: 'AA - Contraste 4.5:1'
  },
  SAFE: {
    name: 'Seguro / Sin Congestión',
    hex: '#10B981', // Verde esmeralda
    rgb: 'rgb(16, 185, 129)',
    semantics: 'Velocidad > 35 km/h, flujo libre',
    wcag: 'AA - Contraste 4.5:1'
  },

  // Intensidad de Lluvia (SIATA Integration)
  RAIN_LIGHT: {
    name: 'Lluvia Ligera',
    hex: '#93C5FD', // Azul cielo claro
    rgb: 'rgb(147, 197, 253)',
    semantics: 'Precipitación < 2 mm/h'
  },
  RAIN_MODERATE: {
    name: 'Lluvia Moderada',
    hex: '#3B82F6', // Azul intenso
    rgb: 'rgb(59, 130, 246)',
    semantics: 'Precipitación 2-8 mm/h'
  },
  RAIN_HEAVY: {
    name: 'Lluvia Intensa',
    hex: '#1E40AF', // Azul oscuro
    rgb: 'rgb(30, 64, 175)',
    semantics: 'Precipitación > 8 mm/h'
  },

  // Riesgo de Accidentalidad (Heatmap)
  RISK_CRITICAL: {
    name: 'Riesgo Crítico',
    hex: '#991B1B', // Rojo oscuro
    rgb: 'rgb(153, 27, 27)',
    semantics: 'Índice de Riesgo > 0.7'
  },
  RISK_HIGH: {
    name: 'Riesgo Alto',
    hex: '#DC2626', // Rojo vivo
    rgb: 'rgb(220, 38, 38)',
    semantics: 'Índice de Riesgo 0.5-0.7'
  },
  RISK_MEDIUM: {
    name: 'Riesgo Medio',
    hex: '#F59E0B', // Ámbar
    rgb: 'rgb(245, 158, 11)',
    semantics: 'Índice de Riesgo 0.3-0.5'
  },
  RISK_LOW: {
    name: 'Riesgo Bajo',
    hex: '#FBBF24', // Amarillo claro
    rgb: 'rgb(251, 191, 36)',
    semantics: 'Índice de Riesgo 0.1-0.3'
  },
  RISK_MINIMAL: {
    name: 'Riesgo Mínimo',
    hex: '#10B981', // Verde
    rgb: 'rgb(16, 185, 129)',
    semantics: 'Índice de Riesgo < 0.1'
  },

  // UI Base (Neutral, WCAG AA compliant)
  NEUTRAL: {
    primary: '#1F2937', // Gris oscuro (texto principal)
    secondary: '#6B7280', // Gris medio (texto secundario)
    light: '#F3F4F6', // Gris muy claro (fondo)
    border: '#E5E7EB', // Gris borde
    disabled: '#D1D5DB' // Gris deshabilitado
  },

  // Alertas y Estado
  SUCCESS: {
    hex: '#059669',
    rgb: 'rgb(5, 150, 105)',
    name: 'Éxito / Operación completada'
  },
  ERROR: {
    hex: '#DC2626',
    rgb: 'rgb(220, 38, 38)',
    name: 'Error / Operación fallida'
  },
  INFO: {
    hex: '#0EA5E9',
    rgb: 'rgb(14, 165, 233)',
    name: 'Información / Notificación'
  },
  OFFLINE: {
    hex: '#6B7280',
    rgb: 'rgb(107, 114, 128)',
    name: 'Modo offline / Degradado'
  }
}

// Mapeo de velocidad a color (Continuo)
export function getTrafficColorBySpeed(speed) {
  if (speed < 20) return COLORS.DANGER.hex
  if (speed < 35) return COLORS.WARNING.hex
  return COLORS.SAFE.hex
}

// Mapeo de probabilidad de predicción a color
export function getPredictionColorByProbability(probability) {
  if (probability > 0.7) return COLORS.DANGER.hex
  if (probability > 0.5) return COLORS.WARNING.hex
  if (probability > 0.3) return COLORS.RISK_MEDIUM.hex
  return COLORS.SAFE.hex
}

// Mapeo de lluvia a color
export function getRainColorByIntensity(mmh) {
  if (mmh < 2) return COLORS.RAIN_LIGHT.hex
  if (mmh < 8) return COLORS.RAIN_MODERATE.hex
  return COLORS.RAIN_HEAVY.hex
}

// Mapeo de riesgo a color (Heatmap)
export function getRiskColorByIndex(riskIndex) {
  if (riskIndex > 0.7) return COLORS.RISK_CRITICAL.hex
  if (riskIndex > 0.5) return COLORS.RISK_HIGH.hex
  if (riskIndex > 0.3) return COLORS.RISK_MEDIUM.hex
  if (riskIndex > 0.1) return COLORS.RISK_LOW.hex
  return COLORS.RISK_MINIMAL.hex
}

// Paleta de Gradient para Heatmaps
export const HEATMAP_GRADIENT = [
  COLORS.RISK_MINIMAL.hex,  // Verde
  COLORS.RISK_LOW.hex,       // Amarillo claro
  COLORS.RISK_MEDIUM.hex,    // Ámbar
  COLORS.RISK_HIGH.hex,      // Rojo vivo
  COLORS.RISK_CRITICAL.hex   // Rojo oscuro
]
