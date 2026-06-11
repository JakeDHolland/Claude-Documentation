# Address Sync

## Overview

Address records in CRM (stored in the custom `Addresses` module) map to *address* records in the Yoda API. Each address must be linked to a Yoda company via the company's Yoda ID.

---

## Entry Points

### `create_address_in_yoda`

**File:** `CRM/YODA/create_address_in_yoda.ds`  
**Authors:** Jake Holland, Prince Rajput

Syncs a single Address record to Yoda. Intended to be triggered by a CRM workflow when an Address is created or updated.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `record_id` | String | The CRM Address record ID |

**What it does**

1. Fetches the Address record from the `Addresses` module.
2. Loads integration settings and the API root path.
3. Calls `process_address_before_conversion` to normalise the address type.
4. Reads the linked Account from `Account_Name` and fetches that Account's `Yoda_Id`.
5. If the parent Account has no `Yoda_Id`, the function exits silently — the address cannot be synced until the parent company exists in Yoda. (The full sync triggered by `yoda_trigger_sync` handles this ordering.)
6. Builds the `company_yoda_id` link (e.g. `/api/v1/companies/396`) and injects it into the address map.
7. Calls `yoda_sync_record("Addresses", record_info)` to create or update the address in Yoda.

---

### `Create_Address_from_Account`

**File:** `CRM/YODA/Create_Address_from_Account.ds`

Creates CRM Address records from address fields stored directly on an Account record. This is a **CRM-to-CRM** operation — it does not call Yoda directly. The created Address records are then picked up by `create_address_in_yoda` via workflow.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `account_id` | String | The CRM Account record ID |

**Address types created**

| Source fields on Account | CRM Address type | Notes |
|--------------------------|-----------------|-------|
| `Billing_Street` / `Billing_City` / etc. | `Delivery` | Sets `Do_Not_Allow_Record_to_Sync = "Yes"` — this address is for CRM use only and will not be pushed to Yoda |
| `Warehouse_Street_Address` / etc. | `Delivery` | Marked as `Primary = true` |
| `Street_Address` / `Invoice_City` / etc. | `Billing` | Marked as `Primary = true` |

Each address is created by calling `yoda_create_address_record` with the relevant field values.

---

### `yoda_create_address_record`

**File:** `CRM/YODA/yoda_create_address_record.ds`  
**Authors:** Jake Holland, Sam Prabhu

Creates a new Address record in the CRM `Addresses` module. Used by `Create_Address_from_Account` to persist address data from Account fields.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | Map | Map containing address fields (see below) |

**Expected map keys**

| Key | Description |
|-----|-------------|
| `street` | First line of address |
| `street2` | Second line (optional) |
| `city` | Town/city |
| `province` | County/state |
| `postal_code` | Postcode/ZIP |
| `country` | Country |
| `type` | `"Billing"` or `"Delivery"` |
| `account_id` | CRM Account record ID to link |
| `Name` | Display name for the address |
| `Primary` | Boolean — whether this is the primary address of its type (defaults to `false`) |
| `Do_Not_Allow_Record_to_Sync` | Set to `"Yes"` to prevent the address from being pushed to Yoda |

**Returns:** the new Address record ID, or `"Unable to create Address"` on failure.

---

## Data Normalisation — `process_address_before_conversion`

**File:** `CRM/YODA/process_address_before_conversion.ds`

Converts the CRM `Type` string into the integer code Yoda requires.

| CRM `Type` value | Yoda `addressType` integer |
|------------------|---------------------------|
| `"Billing"` | `3` |
| Any other value | `2` |

**Returns:** the modified address map.

---

## Primary Address Management — `update_to_primary`

**File:** `CRM/YODA/update_to_primary.ds`

Ensures only one address of each type (Billing / Delivery) is marked as primary for a given Account. Called by a CRM workflow when `Primary` is set to `true` on an Address record.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | The CRM Address record ID that is being made primary |

**Logic**

Fetches all other Address records linked to the same Account. For each sibling address that shares the same `Type` and has `Primary = true`, it sets `Primary = false` and updates the record.

---

## Update Address Name — `Update Address Name`

**File:** `CRM/YODA/Update Address Name.ds`  
**Author:** Prince Rajput

Auto-generates a human-readable name for an Address record by combining the auto-number, street, and postcode.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `record_id` | String | The CRM Address record ID |

**Format:** `{Auto_Number} - {Street_1} - {Postcode}`

Called from a CRM workflow on Address creation or update.
