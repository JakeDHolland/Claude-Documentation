# Integration Architecture

## Overview

The Yoda integration connects **Zoho CRM** to the **Yoda ERP/order-management platform** through a collection of Deluge standalone functions. CRM is the source of truth for company, contact, and address data; Yoda is the source of truth for orders, sales negotiations, and purchase orders.

## Sync Direction

```
Zoho CRM  ──────────────────────►  Yoda
 Accounts  →  companies
 Contacts  →  contacts
Addresses  →  addresses
```

Read-only data (orders, negotiations) is fetched from Yoda and displayed in CRM custom related lists — no write-back from Yoda to CRM is implemented in these scripts.

## Record Identity

Every synced CRM record stores the Yoda ID in a custom field called `Yoda_Id`. The sync functions read this field to decide whether to **create** (HTTP POST) or **update** (HTTP PUT) the corresponding Yoda record.

## Environments

Three Yoda environments are supported, controlled by the `sync_version` key inside `yoda_get_intergration_settings`:

| Key | Subdomain | Purpose |
|-----|-----------|---------|
| `live_enviroment` | `api` | Production |
| `uat_enviroment` | `apiuat` | User acceptance testing |
| `test_enviroment` | `apitest` | Development / testing |

The Zoho connection used (`yoda_live` vs `yodatest`) is also switched automatically based on this setting.

## Call Stack – Account Sync

```
yoda_trigger_sync (entry point)
 ├── process_account_before_conversion   (data normalisation)
 ├── yoda_sync_record                    (translate + call API)
 │    ├── yoda_get_intergration_settings (fetch field map)
 │    ├── translate                      (CRM → Yoda field mapping)
 │    ├── yoda_call_api                  (HTTP POST / PUT)
 │    └── create_log                     (audit log)
 ├── yoda_sync_record (Contacts)
 └── yoda_sync_record (Addresses)
         └── process_address_before_conversion
```

## Logging

Every sync attempt, whether successful or not, writes a record to the `Audit_Logs` custom module in CRM via `create_log`. Long payloads that exceed the field character limit are automatically spilled into a linked Note record.
