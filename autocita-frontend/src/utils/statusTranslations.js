export const STATUS_LABELS = {
  ALL:           'Todos los estados',
  ASSIGNED:      'Confirmada',
  CONFIRMED:     'Confirmada',
  COMPLETED:     'Completada',
  OFFERED:       'Oferta pendiente',
  REJECTED:      'Cancelada',
  CANCELLED:     'Cancelada',
  REASSIGNED:    'Reasignada',
  BLOCKED:       'Bloqueado',
  NOT_RESPONDED: 'Sin respuesta',
  AVAILABLE:     'Disponible',
};

export const translateStatus = (status) =>
  STATUS_LABELS[status] || status;
