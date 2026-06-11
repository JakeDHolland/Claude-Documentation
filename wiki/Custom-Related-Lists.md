# Custom Related Lists

## Overview

The custom related lists display live data from Yoda inside a CRM Account record, without requiring the data to be stored in CRM. The scripts fetch paginated results from the Yoda API and return XML that Zoho CRM renders as a related list widget.

---

## Entry Points

### `fetch_sales_negotiations_of_company`

**File:** `CRM/YODA/Custom Realted List/fetch_sales_negotiations_of_company.ds`  
**Authors:** Dash Bunyan, Jake Holland, Prince Rajput

Displays all sales negotiations from Yoda linked to an Account.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `record_id` | String | The CRM Account record ID |

Delegates immediately to `build_related_list("Accounts", record_id, "sales-negotiations")`.

---

### `fetch_sales_orders_from_yoda`

**File:** `CRM/YODA/Custom Realted List/fetch_sales_orders_from_yoda.ds`

Displays all sales orders from Yoda linked to an Account.

Delegates to `build_related_list("Accounts", record_id, "sales-orders")`.

---

### `fetch_purchase_orders_from_yoda`

**File:** `CRM/YODA/Custom Realted List/fetch_purchase_orders_from_yoda.ds`

Displays all purchase orders from Yoda linked to an Account.

---

## Core Builder — `build_related_list`

**File:** `CRM/YODA/Custom Realted List/build_related_list.ds`  
**Authors:** Dash Bunyan, Jake Holland, Prince Rajput

**Inputs**

| Parameter | Type | Description |
|-----------|------|-------------|
| `module` | String | CRM module the record belongs to (e.g. `"Accounts"`) |
| `record_id` | String | The CRM record ID |
| `yoda_module` | String | Yoda endpoint name: `"sales-negotiations"`, `"sales-orders"`, or `"purchase-orders"` |

**Returns:** an XML string in Zoho CRM custom related list format, or an empty string on error.

### How it works

1. Fetches the CRM record and reads its `Yoda_Id`. If there is no `Yoda_Id`, returns an empty string (nothing to show yet).
2. Paginates through the Yoda API in pages of 100 records (up to 500 pages — effectively unlimited). The query filter is `contact.company={yoda_id}`.
3. Stops pagination as soon as a page returns fewer than 100 records.
4. For each record returned, extracts display fields and builds an XML `<row>` element.
5. Includes clickable direct links to the relevant Yoda UI page (e.g. `https://yoda.beautynet.co/sales-negotiations/{id}`).

### Displayed columns — Sales Negotiations

| Column | Yoda attribute |
|--------|---------------|
| Negotiation Number | `attributes.formattedId` (linked to Yoda UI) |
| Reference | `attributes.reference` |
| Status | `attributes.statusLabel` |
| Month | `attributes.expectedMonthOfSale` (converted to month name) |
| Sales Person | `attributes.salesPersonName` |
| Customer Contact | `attributes.contactName` |
| Value (Sale) | `attributes.totals.{currency}.netTotal.value` |
| Value (GBP) | `attributes.totals.GBP.netTotal.value` |
| Currency | `attributes.currencyCode` |
| Sales Order | `attributes.salesOrderId` (linked to Yoda sales orders UI) |
| Created On | `attributes.created` (formatted `dd/MM/yyyy`) |

### Displayed columns — Sales Orders

| Column | Yoda attribute |
|--------|---------------|
| Negotiation Number | `attributes.id` (linked to Yoda UI) |
| Reference | `attributes.reference` |
| Status | `attributes.statusLabel` |
| Assigned To | `attributes.salesPersonName` |
| Customer Contact | `attributes.contactName` |
| Value (Sale) | `attributes.totals.{currency}.sellTotal` |
| Value (GBP) | `attributes.totals.GBP.sellTotal` |
| Currency | `attributes.sellCurrency` |
| Sales Order | `attributes.salesOrderId` |
| Created On | `attributes.created` |

### Currency formatting

Monetary values are converted from integer pence/cents (Yoda stores values × 100) to a human-readable decimal with thousand separators. Currency symbols are prepended based on the record's currency code (GBP → `£`, EUR → `€`, USD → `$`).

### Error handling

If the Yoda API returns null or throws an error during pagination, the function logs an ERROR entry to `Audit_Logs` and returns an empty string. An `<error><message>...</message></error>` XML block is returned when no records are found.
