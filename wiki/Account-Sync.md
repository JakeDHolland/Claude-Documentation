# Account Sync

## Overview

Account sync pushes a Zoho CRM **Account** record (mapped to a Yoda *company*) along with its related **Contacts** and **Addresses** in a single orchestrated flow.

---

## Entry Points

### `yoda_trigger_sync`

**File:** `CRM/YODA/yoda_trigger_sync.ds`  
**Authors:** Jake Holland, Prince Rajput

The primary entry point for syncing an Account and everything linked to it. Intended to be called from a Zoho CRM workflow or button on the Account record.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `account_id` | String | The CRM Account record ID |

**What it does**

1. Fetches the Account record and runs it through `process_account_before_conversion` to normalise field values.
2. Waits 5 seconds (via a call to `postman-echo.com/delay/5`) so that any concurrent creation workflows on related Contacts and Addresses have time to complete and confirm their `Yoda_Id` field is still empty.
3. Calls `yoda_sync_record("Accounts", record_info)` to create or update the company in Yoda.
4. If the Account sync fails, stops immediately and returns an empty string.
5. Re-fetches the Account to read the newly assigned `Yoda_Id`, then builds the `company_link` path used to associate Contacts and Addresses with this company in Yoda.
6. Searches for all related Contacts. For each Contact where `Yoda_Id` is null, injects the `company_yoda_id` link and calls `yoda_sync_record("Contacts", ...)`.
7. Searches for all related Addresses. For each Address where `Yoda_Id` is null and `Do_Not_Allow_Record_to_Sync` is not `"Yes"`, runs `process_address_before_conversion`, injects the `company_yoda_id` link, and calls `yoda_sync_record("Addresses", ...)`.

---

### `Create Account in Yoda`

**File:** `CRM/YODA/Create Account in Yoda.ds`  
**Author:** Jake Holland, Prince Rajput

A simpler entry point that syncs only the Account itself (no related records).

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `account_id` | String | The CRM Account record ID |

**What it does**

Fetches the Account record and passes it directly to `yoda_sync_record("Accounts", record_info)`. This is useful for re-syncing a single Account without touching its Contacts or Addresses.

---

### `update_account_in_yoda`

**File:** `CRM/YODA/update_account_in_yoda.ds`

A lightweight update-only entry point. Runs `process_account_before_conversion` and then calls `yoda_sync_record` — but only if the Account already has a `Yoda_Id` (i.e. it has been synced before).

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `account_id` | String | The CRM Account record ID |

---

## Data Normalisation — `process_account_before_conversion`

**File:** `CRM/YODA/process_account_before_conversion.ds`

Called before any Account is sent to Yoda to convert CRM-friendly values into the formats Yoda's API expects.

**Transformations applied**

| Field | CRM value | Yoda value |
|-------|-----------|------------|
| `Dutch_VAT_Term` | `"No"` or null | `"none"` |
| `Dutch_VAT_Term` | Any truthy value | `"dutch_vat"` |
| `Operating_Region` | `"UK"` | `"uk"` |
| `Operating_Region` | `"Netherlands"` | `"nl"` |
| `Operating_Region` | `"Other EC"` | `"ec"` |
| `Operating_Region` | `"Other"` | `"other"` |
| `Account_Type` | Any string | Lowercased, spaces and hyphens replaced with underscores |
| `Lead_Prospect_Type` | `"Customer"` | Sets `Customer = true`; reads `Payment_Terms` and `Delivery_Terms` |
| `Lead_Prospect_Type` | `"Supplier"` | Sets `Supplier = true`; reads `Supplier_Payment_Terms1` and `Supplier_Delivery_Terms` |
| `Lead_Prospect_Type` | `"Customer & Supplier"` | Sets both to `true`; reads Customer terms |

Additionally, the function:
- Looks up the **payment term** ID in Yoda (`payment-terms` endpoint) using the CRM label and injects the Yoda ID as `paymentTerm`.
- Looks up the **delivery term** ID in Yoda (`delivery-terms` endpoint) and injects it as `deliveryTerm`.
- Calls `fetch_yoda_user_id` to resolve the CRM Owner's Yoda user ID and injects it as `defaultSalesperson`.

**Returns:** the modified `record_info` map.

---

## Core Sync Engine — `yoda_sync_record`

**File:** `CRM/YODA/yoda_sync_record.ds`  
**Author:** Jake Holland

Handles the actual translation and API call for any module.

**Inputs**

| Parameter | Type | Description |
|-----------|------|-------------|
| `module` | String | CRM module name (`"Accounts"`, `"Contacts"`, or `"Addresses"`) |
| `record_info` | Map | The (pre-processed) CRM record map |

**Logic**

1. Retrieves the field mapping for the module from `yoda_get_intergration_settings`.
2. Writes an INFO audit log recording the sync attempt.
3. Calls `translate` to convert the CRM map into a Yoda-compatible payload.
4. Removes empty `company` lookup values (Yoda rejects empty strings on lookup fields).
5. Determines the API method and path:
   - `Yoda_Id` is null → `POST` to `/<module-endpoint>`
   - `Yoda_Id` is set → `PUT` to `/<module-endpoint>/<yoda_id>`
6. Calls `yoda_call_api` to make the request.
7. On success, extracts the new Yoda ID from the response (format: `/api/v1/companies/396`) using `yoda_extract_id` and writes it back to the CRM record's `Yoda_Id` field.
8. Logs the outcome (success or error) to `Audit_Logs`.

**Returns:** `"Successfull"` on success, `"ERROR"` on failure.
