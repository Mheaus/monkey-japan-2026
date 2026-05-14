import { addIcon } from '@iconify/react';

import alertCircle from '@iconify-icons/lucide/alert-circle';
import arrowRight from '@iconify-icons/lucide/arrow-right';
import calendarHeart from '@iconify-icons/lucide/calendar-heart';
import check from '@iconify-icons/lucide/check';
import checkSquare from '@iconify-icons/lucide/check-square';
import database from '@iconify-icons/lucide/database';
import home from '@iconify-icons/lucide/home';
import loader from '@iconify-icons/lucide/loader';
import map from '@iconify-icons/lucide/map';
import plane from '@iconify-icons/lucide/plane';
import wifi from '@iconify-icons/lucide/wifi';
import wifiOff from '@iconify-icons/lucide/wifi-off';
import wrench from '@iconify-icons/lucide/wrench';
import x from '@iconify-icons/lucide/x';

const ICONS: Record<string, Parameters<typeof addIcon>[1]> = {
  'alert-circle': alertCircle,
  'arrow-right': arrowRight,
  'calendar-heart': calendarHeart,
  check,
  'check-square': checkSquare,
  database,
  home,
  loader,
  map,
  plane,
  wifi,
  'wifi-off': wifiOff,
  wrench,
  x,
};

for (const [name, data] of Object.entries(ICONS)) {
  addIcon(`lucide:${name}`, data);
}
