import * as migration_20260319_165018_initial from './20260319_165018_initial';
import * as migration_20260322_035532_add_pricing_global_resend from './20260322_035532_add_pricing_global_resend';

export const migrations = [
  {
    up: migration_20260319_165018_initial.up,
    down: migration_20260319_165018_initial.down,
    name: '20260319_165018_initial',
  },
  {
    up: migration_20260322_035532_add_pricing_global_resend.up,
    down: migration_20260322_035532_add_pricing_global_resend.down,
    name: '20260322_035532_add_pricing_global_resend'
  },
];
