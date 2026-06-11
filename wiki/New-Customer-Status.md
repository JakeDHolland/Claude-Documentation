# New Customer Status

## Overview

The **New Customer Status** field (`New_Customer_Status`) on both the Accounts and Leads modules tracks the progress of onboarding a new customer or supplier. Two Deluge functions — one for Accounts and one for Leads — evaluate a set of checklist fields and set the status automatically.

Both functions are triggered by a CRM workflow whenever any of the relevant checklist fields are updated.

---

## Functions

### `Update New Customer Status in Accounts`

**File:** `CRM/YODA/Update New Customer Status in Accounts.ds`  
**Author:** Prince Rajput

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `record_id` | String | The CRM Account record ID |

### `Update New Customer Status in Leads`

**File:** `CRM/YODA/Update New Customer Status in Leads.ds`  
**Author:** Prince Rajput

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `record_id` | String | The CRM Lead record ID |

---

## Status Logic

The status value is determined by reading `Lead_Prospect_Type` and then evaluating a set of checklist fields.

### Customer checklist fields

| Field |
|-------|
| `New_Customer_Form_Received` |
| `New_Customer_Form_Checks_Completed` |
| `Currency_Confirmed` |
| `Payment_Terms_Confirmed` |
| `Credit_Limit_Confirmed` |
| `Delivery_Terms_Confirmed` |
| `New_Line_Form_Returned` |
| `Contract_Review_Complete` |
| `Terms_Conditions_Review_Complete` |
| `Packing_Instructions_Review_Complete` |
| `Delivery_Instructions_Review_Complete` |
| `References_Received` |

### Supplier checklist fields

| Field |
|-------|
| `New_Supplier_Form_Received` |
| `New_Supplier_Form_Checks_Completed` |
| `New_Line_Form_Received` |
| `New_Customer_Form_Returned` |
| `References_Sent` |

### Status values

| Condition | Status set |
|-----------|-----------|
| All relevant fields are null | `"Not Started"` |
| All relevant fields are populated | `"Complete"` |
| Mix of null and populated fields | `"In Progress"` |

### Prospect type matrix

| `Lead_Prospect_Type` | Fields checked |
|----------------------|---------------|
| `"Customer"` | Customer checklist only |
| `"Supplier"` | Supplier checklist only |
| `"Customer & Supplier"` | Both checklists combined — all fields in both lists must be populated for `"Complete"` |

---

## Notes

- Both functions contain identical logic; the only difference is the module they read from (`Accounts` vs `Leads`) and, for the Accounts version, a bug exists where a Supplier or Customer & Supplier path incorrectly calls `zoho.crm.updateRecord("Leads", ...)` instead of `"Accounts"`. This should be corrected to `"Accounts"` in the Accounts version.
- The `Stickers_Required` and `EUR_1_Forms_Required` fields are fetched but not included in the checklist evaluation — they appear to be informational only.
