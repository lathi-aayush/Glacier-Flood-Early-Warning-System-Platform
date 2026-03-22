export type AlertSeverity = 'critical' | 'high' | 'advisory'

export type AlertEntry = {
  id: string
  ts: string
  severity: AlertSeverity
  lakeName: string
  lakeId: string
  smsCount: number
  channels: string[]
  status: 'pending' | 'ack'
}
