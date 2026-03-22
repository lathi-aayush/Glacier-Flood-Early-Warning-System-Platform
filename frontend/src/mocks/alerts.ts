import type { AlertEntry } from '@/types/alert'

export const MOCK_ALERTS: AlertEntry[] = [
  {
    id: 'a1',
    ts: '2023-11-24T14:22:08Z',
    severity: 'critical',
    lakeName: 'South Lhonak Lake',
    lakeId: 'gl-00124',
    smsCount: 4812,
    channels: ['SDMA', 'NDRF', 'Panchayat-V'],
    status: 'pending',
  },
  {
    id: 'a2',
    ts: '2023-11-24T09:15:33Z',
    severity: 'high',
    lakeName: 'Imja Tsho',
    lakeId: 'gl-00089',
    smsCount: 1240,
    channels: ['SDMA', 'Panchayat-B'],
    status: 'ack',
  },
  {
    id: 'a3',
    ts: '2023-11-23T21:04:12Z',
    severity: 'advisory',
    lakeName: 'Tsho Rolpa',
    lakeId: 'gl-00215',
    smsCount: 0,
    channels: ['SDMA-INTERNAL'],
    status: 'ack',
  },
  {
    id: 'a4',
    ts: '2023-11-23T04:44:59Z',
    severity: 'critical',
    lakeName: 'Gyalzen Peak Node',
    lakeId: 'gl-00331',
    smsCount: 8922,
    channels: ['SDMA', 'NDRF', 'DCC-ALL'],
    status: 'ack',
  },
]
