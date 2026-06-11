# Contact Sync

## Overview

Contact records in CRM map to *contact* records in Yoda. A Contact must always be linked to an Account, and that Account must already have a `Yoda_Id` before a Contact can be synced — Yoda requires the company reference to exist first.

---

## How Contacts Are Synced

Contact syncing is handled as part of the full account sync flow in `yoda_trigger_sync`. There is no standalone "sync this contact" entry point; contacts are always synced as part of their parent Account.

**Flow inside `yoda_trigger_sync`:**

1. After the Account has been successfully created/updated in Yoda, the function fetches the Account's `Yoda_Id` and builds the `company_link` value (e.g. `/api/v1/companies/396`).
2. It searches CRM for all Contacts linked to the Account using `(Account_Name:equals:{account_id})`.
3. For each Contact where `Yoda_Id` is null (not yet synced), it:
   - Injects `company_yoda_id = company_link` into the contact map.
   - Calls `yoda_sync_record("Contacts", contact)`.
4. Contacts that already have a `Yoda_Id` are skipped (assumed to be up to date).

---

## Field Mapping

Defined in `yoda_get_intergration_settings` under the `Contacts` key.

| CRM field | Yoda field | Type |
|-----------|------------|------|
| `Full_Name` | `fullName` | string |
| `Email` | `emailAddress` | string |
| `Primary_Contact` | `isPrimary` | boolean |
| `id` | `crmId` | string |
| `company_yoda_id` | `company` | string (injected at runtime) |

---

## Notes

- The `company_yoda_id` field is not a real CRM field — it is injected into the map at runtime before the sync call so the translation engine can map it to Yoda's `company` lookup field.
- If an Account is created and has no linked Contacts, the contact-sync block is skipped entirely.
- To update a Contact that has already been synced, re-run `yoda_trigger_sync` on the parent Account. Because `Yoda_Id` will be set on the Contact, `yoda_sync_record` will issue a `PUT` instead of a `POST`.
