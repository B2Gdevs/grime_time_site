import * as migration_20260319_165018_initial from './20260319_165018_initial';
import * as migration_20260322_035532_add_pricing_global_resend from './20260322_035532_add_pricing_global_resend';
import * as migration_20260322_180337_customer_portal_roles from './20260322_180337_customer_portal_roles';
import * as migration_20260324_024258_add_payload_mcp_api_keys from './20260324_024258_add_payload_mcp_api_keys';
import * as migration_20260324_211620 from './20260324_211620';
import * as migration_20260324_223907_ops_ladders_and_kpi_tooltips from './20260324_223907_ops_ladders_and_kpi_tooltips';
import * as migration_20260324_234423_add_quote_settings_versions from './20260324_234423_add_quote_settings_versions';
import * as migration_20260325_005955_ops_liabilities_and_scorecard_rows from './20260325_005955_ops_liabilities_and_scorecard_rows';
import * as migration_20260325_021602_customer_portal_billing_and_scheduling from './20260325_021602_customer_portal_billing_and_scheduling';
import * as migration_20260325_030001_hubspot_quote_deal_sync from './20260325_030001_hubspot_quote_deal_sync';
import * as migration_20260325_152321 from './20260325_152321';
import * as migration_20260325_154218 from './20260325_154218';
import * as migration_20260325_190500_user_account_and_customer_account_scope from './20260325_190500_user_account_and_customer_account_scope';
import * as migration_20260326_174716_marketing_service_grid_media_refresh from './20260326_174716_marketing_service_grid_media_refresh';
import * as migration_20260326_205231 from './20260326_205231';
import * as migration_20260326_214509 from './20260326_214509';
import * as migration_20260326_233945_billing_workspace_and_stripe_sync from './20260326_233945_billing_workspace_and_stripe_sync';
import * as migration_20260327_031119_20260327_170000_operating_rhythm_and_discount_policy from './20260327_031119_20260327_170000_operating_rhythm_and_discount_policy';
import * as migration_20260327_120000_internal_ops_quote_weights from './20260327_120000_internal_ops_quote_weights';
import * as migration_20260327_140500_sequence_jobs_and_relations from './20260327_140500_sequence_jobs_and_relations';
import * as migration_20260327_141500_payload_jobs_meta from './20260327_141500_payload_jobs_meta';
import * as migration_20260401_170000_clerk_user_id from './20260401_170000_clerk_user_id';
import * as migration_20260402_022714_add_organizations_and_memberships from './20260402_022714_add_organizations_and_memberships';
import * as migration_20260402_183806_add_service_grid_display_variant from './20260402_183806_add_service_grid_display_variant';
import * as migration_20260402_194706_add_page_visibility from './20260402_194706_add_page_visibility';
import * as migration_20260403_214500_staff_designer_role from './20260403_214500_staff_designer_role';
import * as migration_20260404_174500_add_page_block_visibility from './20260404_174500_add_page_block_visibility';
import * as migration_20260404_185500_quote_settings_calibration from './20260404_185500_quote_settings_calibration';
import * as migration_20260404_193443_add_instant_quote_request_attachments from './20260404_193443_add_instant_quote_request_attachments';
import * as migration_20260404_212516_add_page_composer_reusable_and_custom_html from './20260404_212516_add_page_composer_reusable_and_custom_html';
import * as migration_20260405_002323_add_shared_sections_contract from './20260405_002323_add_shared_sections_contract';
import * as migration_20260405_003500_shared_sections_archived_status from './20260405_003500_shared_sections_archived_status';
import * as migration_20260405_040500_fix_page_composer_reusable_metadata_schema from './20260405_040500_fix_page_composer_reusable_metadata_schema';

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
    name: '20260325_021602_customer_portal_billing_and_scheduling',
  },
  {
    up: migration_20260325_030001_hubspot_quote_deal_sync.up,
    down: migration_20260325_030001_hubspot_quote_deal_sync.down,
    name: '20260325_030001_hubspot_quote_deal_sync',
  },
  {
    up: migration_20260325_152321.up,
    down: migration_20260325_152321.down,
    name: '20260325_152321',
  },
  {
    up: migration_20260325_154218.up,
    down: migration_20260325_154218.down,
    name: '20260325_154218',
  },
  {
    up: migration_20260325_190500_user_account_and_customer_account_scope.up,
    down: migration_20260325_190500_user_account_and_customer_account_scope.down,
    name: '20260325_190500_user_account_and_customer_account_scope',
  },
  {
    up: migration_20260326_174716_marketing_service_grid_media_refresh.up,
    down: migration_20260326_174716_marketing_service_grid_media_refresh.down,
    name: '20260326_174716_marketing_service_grid_media_refresh',
  },
  {
    up: migration_20260326_205231.up,
    down: migration_20260326_205231.down,
    name: '20260326_205231',
  },
  {
    up: migration_20260326_214509.up,
    down: migration_20260326_214509.down,
    name: '20260326_214509',
  },
  {
    up: migration_20260326_233945_billing_workspace_and_stripe_sync.up,
    down: migration_20260326_233945_billing_workspace_and_stripe_sync.down,
    name: '20260326_233945_billing_workspace_and_stripe_sync',
  },
  {
    up: migration_20260327_031119_20260327_170000_operating_rhythm_and_discount_policy.up,
    down: migration_20260327_031119_20260327_170000_operating_rhythm_and_discount_policy.down,
    name: '20260327_031119_20260327_170000_operating_rhythm_and_discount_policy',
  },
  {
    up: migration_20260327_120000_internal_ops_quote_weights.up,
    down: migration_20260327_120000_internal_ops_quote_weights.down,
    name: '20260327_120000_internal_ops_quote_weights',
  },
  {
    up: migration_20260327_140500_sequence_jobs_and_relations.up,
    down: migration_20260327_140500_sequence_jobs_and_relations.down,
    name: '20260327_140500_sequence_jobs_and_relations',
  },
  {
    up: migration_20260327_141500_payload_jobs_meta.up,
    down: migration_20260327_141500_payload_jobs_meta.down,
    name: '20260327_141500_payload_jobs_meta',
  },
  {
    up: migration_20260401_170000_clerk_user_id.up,
    down: migration_20260401_170000_clerk_user_id.down,
    name: '20260401_170000_clerk_user_id',
  },
  {
    up: migration_20260402_022714_add_organizations_and_memberships.up,
    down: migration_20260402_022714_add_organizations_and_memberships.down,
    name: '20260402_022714_add_organizations_and_memberships',
  },
  {
    up: migration_20260402_183806_add_service_grid_display_variant.up,
    down: migration_20260402_183806_add_service_grid_display_variant.down,
    name: '20260402_183806_add_service_grid_display_variant',
  },
  {
    up: migration_20260402_194706_add_page_visibility.up,
    down: migration_20260402_194706_add_page_visibility.down,
    name: '20260402_194706_add_page_visibility',
  },
  {
    up: migration_20260403_214500_staff_designer_role.up,
    down: migration_20260403_214500_staff_designer_role.down,
    name: '20260403_214500_staff_designer_role',
  },
  {
    up: migration_20260404_174500_add_page_block_visibility.up,
    down: migration_20260404_174500_add_page_block_visibility.down,
    name: '20260404_174500_add_page_block_visibility',
  },
  {
    up: migration_20260404_185500_quote_settings_calibration.up,
    down: migration_20260404_185500_quote_settings_calibration.down,
    name: '20260404_185500_quote_settings_calibration',
  },
  {
    up: migration_20260404_193443_add_instant_quote_request_attachments.up,
    down: migration_20260404_193443_add_instant_quote_request_attachments.down,
    name: '20260404_193443_add_instant_quote_request_attachments',
  },
  {
    up: migration_20260404_212516_add_page_composer_reusable_and_custom_html.up,
    down: migration_20260404_212516_add_page_composer_reusable_and_custom_html.down,
    name: '20260404_212516_add_page_composer_reusable_and_custom_html',
  },
  {
    up: migration_20260405_002323_add_shared_sections_contract.up,
    down: migration_20260405_002323_add_shared_sections_contract.down,
    name: '20260405_002323_add_shared_sections_contract'
  },
  {
    up: migration_20260405_003500_shared_sections_archived_status.up,
    down: migration_20260405_003500_shared_sections_archived_status.down,
    name: '20260405_003500_shared_sections_archived_status',
  },
  {
    up: migration_20260405_040500_fix_page_composer_reusable_metadata_schema.up,
    down: migration_20260405_040500_fix_page_composer_reusable_metadata_schema.down,
    name: '20260405_040500_fix_page_composer_reusable_metadata_schema',
  },
];
