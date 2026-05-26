import { Reminder } from '../types';

export const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'weight', type: 'weight', enabled: true,  time: '07:00', frequency: 'daily', message: 'N\'oubliez pas votre pesee du matin !', label: 'Pesee matin' },
  { id: 'water1', type: 'water',  enabled: true,  time: '10:00', frequency: 'daily', message: 'Buvez un grand verre d\'eau !',          label: 'Hydratation 10h' },
  { id: 'water2', type: 'water',  enabled: true,  time: '14:00', frequency: 'daily', message: 'Buvez un grand verre d\'eau !',          label: 'Hydratation 14h' },
  { id: 'water3', type: 'water',  enabled: true,  time: '18:00', frequency: 'daily', message: 'Buvez un grand verre d\'eau !',          label: 'Hydratation 18h' },
  { id: 'water4', type: 'water',  enabled: false, time: '20:00', frequency: 'daily', message: 'Buvez un grand verre d\'eau !',          label: 'Hydratation 20h' },
  { id: 'photo',  type: 'photo',  enabled: false, time: '08:00', frequency: 'weekly', dayOfWeek: 1, message: 'Prenez votre photo de progression !', label: 'Photo hebdo lundi' },
  { id: 'sleep',  type: 'sleep',  enabled: true,  time: '22:30', frequency: 'daily', message: 'Il est l\'heure d\'aller dormir !',      label: 'Heure de sommeil' },
];

const TYPE_ICONS: Record<Reminder['type'], string> = {
  weight: '⚖️', water: '💧', meal: '🍽️', photo: '📸', sleep: '🌙',
};

export function getReminderIcon(type: Reminder['type']): string {
  return TYPE_ICONS[type];
}
