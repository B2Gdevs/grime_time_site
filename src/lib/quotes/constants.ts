export const QUOTE_STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Lost', value: 'lost' },
] as const

export const QUOTE_PROPERTY_TYPE_OPTIONS = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'New residential construction', value: 'new_residential_construction' },
  { label: 'HOA / multi-unit', value: 'hoa_multi_unit' },
  { label: 'Other', value: 'other' },
] as const

export const QUOTE_SERVICE_TYPE_OPTIONS = [
  { label: 'House wash', value: 'house_wash' },
  { label: 'Soft wash', value: 'soft_wash' },
  { label: 'Roof cleaning', value: 'roof_cleaning' },
  { label: 'Window cleaning', value: 'window_cleaning' },
  { label: 'Concrete / flatwork cleaning', value: 'concrete_cleaning' },
  { label: 'Driveway / walkway cleaning', value: 'driveway_walkway_cleaning' },
  { label: 'Fence cleaning', value: 'fence_cleaning' },
  { label: 'Deck / patio cleaning', value: 'deck_patio_cleaning' },
  { label: 'Gutter cleaning', value: 'gutter_cleaning' },
  { label: 'Rust / stain treatment', value: 'rust_stain_treatment' },
  { label: 'Other', value: 'other' },
] as const

export const QUOTE_TAX_DECISION_OPTIONS = [
  { label: 'Collect Texas sales tax', value: 'collect_sales_tax' },
  { label: 'Homebuilder / new residential construction exception', value: 'homebuilder_exception' },
  { label: 'Exemption certificate on file', value: 'exemption_certificate' },
  { label: 'Mixed or CPA review required', value: 'manual_review_required' },
] as const

export const QUOTE_TAX_CATEGORY_OPTIONS = [
  { label: 'Building / grounds cleaning', value: 'building_grounds_cleaning' },
  { label: 'Pressure washing / maintenance', value: 'pressure_washing_maintenance' },
  { label: 'Window washing', value: 'window_washing' },
  { label: 'Manual review required', value: 'manual_review_required' },
] as const

export const QUOTE_TAX_GUIDANCE =
  'Texas Comptroller guidance generally treats cleaning homes/buildings, washing windows, and pressure washing buildings, sidewalks, or parking lots as taxable. Keep exemption and CPA-review paths available before finalizing the quote.'

