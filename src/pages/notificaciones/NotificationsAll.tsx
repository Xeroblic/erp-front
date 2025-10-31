import React, { useEffect } from 'react'
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper'
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/Avatar'
import Icon from '@/components/icon/Icon'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchNotifications, markAllRead, markRead, markUnread, deleteNotification } from '@/store/slices/notifications/notificationsSlice'

const timeAgo = (iso?: string | null) => {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.max(0, Math.floor(diff / 60000))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

const NotificationsAll: React.FC = () => {
  const dispatch = useAppDispatch()
  const { items, loading, unreadCount } = useAppSelector((s) => s.notifications ?? { items: [], loading: false, unreadCount: 0 })

  useEffect(() => {
    dispatch(fetchNotifications({ per_page: 50 })).catch(() => void 0)
  }, [dispatch])

  return (
    <PageWrapper isProtectedRoute title='Notificaciones' name='Notificaciones'>
      <Card>
        <CardHeader>
          <CardHeaderChild>
            <CardTitle>Notificaciones</CardTitle>
          </CardHeaderChild>
          <CardHeaderChild>
            <div className='flex gap-2'>
              <Button size='sm' variant='default' color='violet' onClick={() => dispatch(markAllRead())} disabled={unreadCount === 0}>
                Marcar leídas
              </Button>
              <Button size='sm' variant='default' onClick={() => dispatch(fetchNotifications({ per_page: 50 }))} loading={loading}>
                Refrescar
              </Button>
            </div>
          </CardHeaderChild>
        </CardHeader>
        <CardBody>
          <div className='divide-y divide-dashed divide-zinc-500/30'>
            {items.map((n) => (
              <div key={n.id} className='py-3 grid grid-cols-[auto_1fr_auto] gap-3 items-start'>
                <div className='relative'>
                  <Avatar name={n.event?.type_key ?? 'Notificación'} />
                  {(n.delivered_channels ?? []).includes('email') && (
                    <span className='absolute start-3/4 top-3/4 flex rounded-full bg-blue-500/75 outline outline-2 outline-blue-500/75'>
                      <Icon icon='HeroEnvelope' />
                    </span>
                  )}
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <b>{formatTitle(n.event?.type_key)}</b>
                    <span className='text-zinc-500'>· {n.event?.module ?? ((n.delivered_channels ?? []).includes('email') ? 'Correo' : 'Sistema')}</span>
                    {n.bucket === 'Important' && <span className='text-xs rounded-full bg-rose-100 text-rose-700 px-2 py-0.5'>Importante</span>}
                  </div>
                  <div className='text-zinc-700'>{n.message ?? ''}</div>
                  <div className='mt-2 flex gap-2'>
                    {n.status !== 'read' ? (
                      <Button size='sm' variant='plain' onClick={() => dispatch(markRead({ id: n.id }))}>Marcar leída</Button>
                    ) : (
                      <Button size='sm' variant='plain' onClick={() => dispatch(markUnread({ id: n.id }))}>Marcar no leída</Button>
                    )}
                    <Button size='sm' variant='plain' color='red' onClick={() => dispatch(deleteNotification({ id: n.id }))}>Eliminar</Button>
                  </div>
                </div>
                <div className='justify-self-end text-zinc-500 relative'>
                  {n.status !== 'read' && (
                    <span className='absolute -top-1 -right-1 flex h-2 w-2'>
                      <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75' />
                      <span className='relative inline-flex h-2 w-2 rounded-full bg-red-500' />
                    </span>
                  )}
                  {timeAgo(n.created_at)}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className='py-10 text-center text-sm text-zinc-500'>No hay notificaciones</div>
            )}
          </div>
        </CardBody>
      </Card>
    </PageWrapper>
  )
}

export default NotificationsAll

function formatTitle(type_key?: string | null): string {
  if (!type_key) return 'Notificación'
  const map: Record<string, string> = {
    'system.sync-failed': 'Sincronización fallida',
    'payment.confirmed': 'Pago confirmado',
    'quote.expiring-soon': 'Cotización por expirar',
  }
  if (map[type_key]) return map[type_key]
  return type_key.replace(/[._-]+/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase())
}

