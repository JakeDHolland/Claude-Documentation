# Zoho CRM – Yoda Integration: Wiki Home

This wiki documents the Zoho CRM Deluge scripts that power the **Yoda integration** — a two-way sync between Zoho CRM and the Yoda ERP/order-management platform.

## Contents

| Page | Description |
|------|-------------|
| [Integration Architecture](Integration-Architecture) | High-level overview of how the sync works |
| [Integration Settings](Integration-Settings) | Environment configuration and field-mapping definitions |
| [Account Sync](Account-Sync) | Syncing Account records from CRM to Yoda |
| [Address Sync](Address-Sync) | Creating and syncing Address records |
| [Contact Sync](Contact-Sync) | Syncing Contact records linked to an Account |
| [New Customer Status](New-Customer-Status) | Automated status tracking for new customers and suppliers |
| [Lead Blueprint Management](Lead-Blueprint-Management) | Switching a Lead between the Customer and Supplier blueprints |
| [Custom Related Lists](Custom-Related-Lists) | Displaying Yoda orders and negotiations inside CRM |
| [Helper Functions](Helper-Functions) | Shared utilities: logging, translation, API calls, and more |

## Repository Layout

```
CRM/
└── YODA/
    ├── *.ds                    # Standalone functions (entry points & orchestrators)
    ├── helpers/                # Low-level reusable utilities
    └── Custom Realted List/    # Custom related-list renderers
```

## Technology

All scripts are written in **Zoho Deluge** (`.ds` files) and run as *Standalone Functions* inside Zoho CRM. They call the Yoda REST API via the `invokeurl` built-in, using named connections (`yoda_live` / `yodatest`) for authentication.
