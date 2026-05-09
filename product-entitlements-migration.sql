-- Product-aware entitlement migration
-- Adds enough detail to distinguish Scout extension users, research workspace users,
-- and full Calm Commerce OS users.

alter table learner_entitlements
  add column if not exists product_code text not null default 'calm_commerce_os'
    check (product_code in ('scanner_extension','research_workspace','calm_commerce_os'));

alter table learner_entitlements
  add column if not exists billing_type text not null default 'preview'
    check (billing_type in ('one_time','subscription','bundled','preview'));

-- Existing active/full rows pre-date product-aware tiers and should continue to
-- mean full Calm Commerce OS access. New preview rows remain preview access.
update learner_entitlements
set product_code = 'calm_commerce_os',
    billing_type = case when status = 'active' then 'subscription' else 'preview' end
where product_code = 'calm_commerce_os'
  and billing_type = 'preview'
  and status = 'active'
  and access_level = 'full';
