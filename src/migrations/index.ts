import * as migration_20260319_165018_initial from './20260319_165018_initial';
import * as migration_20260322_035532_add_pricing_global_resend from './20260322_035532_add_pricing_global_resend';
import * as migration_20260322_180337_customer_portal_roles from './20260322_180337_customer_portal_roles';
import * as migration_20260324_024258_add_payload_mcp_api_keys from './20260324_024258_add_payload_mcp_api_keys';

export const migrations = [
  {
    up: migration_20260319_165018_initial.up,
    down: migration_20260319_165018_initial.down,
    name: '20260319_165018_initial',
  },
  {
    up: migration_20260322_035532_add_pricing_global_resend.up,
    down: migration_20260322_035532_add_pricing_global_resend.down,
    name: '20260322_035532_add_pricing_global_resend',
  },
  {
    up: migration_20260322_180337_customer_portal_roles.up,
    down: migration_20260322_180337_customer_portal_roles.down,
    name: '20260322_180337_customer_portal_roles',
  },
  {
    up: migration_20260324_024258_add_payload_mcp_api_keys.up,
    down: migration_20260324_024258_add_payload_mcp_api_keys.down,
    name: '20260324_024258_add_payload_mcp_api_keys'
  },
];
