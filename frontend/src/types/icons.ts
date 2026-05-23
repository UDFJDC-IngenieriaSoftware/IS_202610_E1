/**
 * Unión de todos los nombres de icono usados en la app.
 * Reemplaza el switch no tipado del mock original.
 * Los valores corresponden a los nombres de Material Symbols / Lucide
 * que se mapearán en el átomo <Icon />.
 */

export type IconName =
  // Navegación del panel barbero
  | 'grid_view'
  | 'calendar_month'
  | 'content_cut'
  | 'schedule'
  | 'history'
  // Navegación admin
  | 'admin_panel_settings'
  | 'group'
  | 'subscriptions'
  | 'layers'
  | 'payments'
  | 'support_agent'
  // Acciones generales
  | 'add'
  | 'edit'
  | 'delete'
  | 'close'
  | 'check'
  | 'chevron_left'
  | 'chevron_right'
  | 'more_horiz'
  | 'search'
  | 'filter_list'
  | 'download'
  | 'refresh'
  // Estado / feedback
  | 'check_circle'
  | 'cancel'
  | 'pending'
  | 'block'
  | 'warning'
  | 'info'
  // Dominio
  | 'person'
  | 'phone'
  | 'attach_money'
  | 'trending_up'
  | 'trending_down'
  | 'trending_flat'
  | 'notifications'
  | 'logout'
  | 'settings'
  | 'whatsapp'
  | 'star'
  | 'arrow_right'
  | 'circle'
