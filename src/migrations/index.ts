import * as migration_20260319_165018_initial from './20260319_165018_initial';
import * as migration_20260322_035532_add_pricing_global_resend from './20260322_035532_add_pricing_global_resend';
import * as migration_20260322_180337_customer_portal_roles from './20260322_180337_customer_portal_roles';
import * as migration_20260324_024258_add_payload_mcp_api_keys from './20260324_024258_add_payload_mcp_api_keys';
import * as migration_20260324_211620 from './20260324_211620';
import * as migration_20260324_223907_ops_ladders_and_kpi_tooltips from './20260324_223907_ops_ladders_and_kpi_tooltips';
import * as migration_20260324_234423_add_quote_settings_versions from './20260324_234423_add_quote_settings_versions';
import * as migration_20260325_005955_ops_liabilities_and_scorecard_rows from './20260325_005955_ops_liabilities_and_scorecard_rows';
import * as migration_20260325_021602_customer_portal_billing_and_scheduling from './20260325_021602_customer_portal_billing_and_scheduling';

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
    name: '20260324_024258_add_payload_mcp_api_keys',
  },
  {
    up: migration_20260324_211620.up,
    down: migration_20260324_211620.down,
    name: '20260324_211620',
  },
  {
    up: migration_20260324_223907_ops_ladders_and_kpi_tooltips.up,
    down: migration_20260324_223907_ops_ladders_and_kpi_tooltips.down,
    name: '20260324_223907_ops_ladders_and_kpi_tooltips',
  },
  {
    up: migration_20260324_234423_add_quote_settings_versions.up,
    down: migration_20260324_234423_add_quote_settings_versions.down,
    name: '20260324_234423_add_quote_settings_versions',
  },
  {
    up: migration_20260325_005955_ops_liabilities_and_scorecard_rows.up,
    down: migration_20260325_005955_ops_liabilities_and_scorecard_rows.down,
    name: '20260325_005955_ops_liabilities_and_scorecard_rows',
  },
  {
    up: migration_20260325_021602_customer_portal_billing_and_scheduling.up,
    down: migration_20260325_021602_customer_portal_billing_and_scheduling.down,
    name: '20260325_021602_customer_portal_billing_and_scheduling'
  },
];
