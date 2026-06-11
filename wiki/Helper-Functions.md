# Helper Functions

Helper functions are low-level, reusable utilities stored in `CRM/YODA/helpers/`. They are called by the main integration scripts and are not intended to be triggered directly by CRM workflows.

---

## `translate`

**File:** `CRM/YODA/helpers/translate.ds`  
**Author:** Dash Bunyan

The core field-mapping engine. Converts a source data map into a destination format using a mapping configuration array (defined in `yoda_get_intergration_settings`).

**Inputs**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | Map | The source record data |
| `mapping` | List | Array of field mapping definitions |
| `source` | String | Key for the source format in each mapping entry (e.g. `"crm"`) |
| `destination` | String | Key for the destination format (e.g. `"yoda"`) |
| `object` | Map | Optional: an existing map to inject results into |
| `write` | Boolean | If `true`, skips fields where `destination.write = "false"` |

**Returns:** a map with three keys:

| Key | Description |
|-----|-------------|
| `result` | The translated output map |
| `errors` | List of errors that prevent use of the output |
| `warnings` | List of non-blocking issues |

**Supported type conversions**

| Type | Behaviour |
|------|-----------|
| `string` | Calls `.toString()`. Supports `max` (truncation), `case` (`"upper"` / `"lower"`), `index` (value lookup/substitution), `prefix`, and `suffix`. |
| `integer` | Strips non-numeric characters and calls `.toLong()`. Supports `min`/`max` validation. |
| `decimal` | As integer but retains decimal point. Supports `round` and `min`/`max`. |
| `date` | Parses with `source.format` and reformats to `destination.format` (default `"dd/MM/yyyy"`). |
| `datetime` | As date but includes time. Supports ISO `T` delimiter. |
| `boolean` | Strict `"true"` → `true`, anything else → `false`. |
| `array` | Validates JSON array; attempts `toJSONList()` conversion if needed. |

Empty string values are normalised to `null` before the nullable check is applied.

---

## `yoda_call_api`

**File:** `CRM/YODA/helpers/yoda_call_api.ds`  
**Author:** Jake Holland

Constructs the full Yoda API URL and issues the HTTP request using Zoho `invokeurl`.

**Inputs**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | String | API endpoint path (e.g. `"companies"`, `"addresses/42"`, `"token"`) |
| `method` | String | HTTP method: `"GET"`, `"POST"`, or `"PUT"` |
| `body` | Map | Request body (ignored for GET) |
| `headers` | Map | Additional headers (currently unused; authentication is via Zoho connection) |

**URL construction**

The full URL is: `{protocol}{environment_subdomain}{domain}{root}{path}`

For the special path `"token"`, the root is omitted.

**Connection switching**

| `sync_version` | Zoho connection used |
|----------------|---------------------|
| `live_enviroment` | `yoda_live` |
| Any other value | `yodatest` |

**Returns:** the raw Yoda API response map.

---

## `create_log`

**File:** `CRM/YODA/helpers/create_log.ds`  
**Authors:** Jake Holland, Dash Bunyan

Creates an audit log record in the CRM `Audit_Logs` custom module.

**Inputs**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | String | Log level: `"INFO"`, `"ERROR"`, or `"WARNING"` |
| `title` | String | Short description of the log entry. The last word is parsed as the record ID and used to link the log to the correct CRM record. |
| `message` | Map/String | Full payload or error detail |
| `module` | String | CRM module name (`"Accounts"`, `"Contacts"`, `"Addresses"`) |

**Behaviour**

- The `message` field is truncated to 32,000 characters if it exceeds that limit.
- If truncation occurs, a linked Note record is created on the log entry with the full content (up to the CRM note limit of 65,535 characters).
- The log record is linked to the relevant CRM record via the `Account`, `Contact`, or `Address` lookup field depending on the module.

**Returns:** the `createRecord` API response.

---

## `extract`

**File:** `CRM/YODA/helpers/extract.ds`  
**Author:** Jake Holland

Reads a value from a nested map/list using a slash-delimited path string.

**Inputs**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | String | Slash-delimited path, e.g. `"attributes/totals/GBP"`. Use `[N]` for array index access, e.g. `"items/[0]/name"`. |
| `data` | Map/List | The source object to traverse |

**Returns:** the value at the specified path, or `null` if not found.

---

## `inject`

**File:** `CRM/YODA/helpers/inject.ds`  
**Authors:** Dash Bunyan, Jake Holland

Writes a value into a nested map at a slash-delimited path, creating intermediate maps as needed.

**Inputs**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | String | Slash-delimited destination path |
| `data` | Map | The object to inject into |
| `value` | Any | The value to write |

**Returns:** the modified map.

**Depends on:** `extract`

---

## `is_array`

**File:** `CRM/YODA/helpers/is_array.ds`  
**Author:** Jake Holland

Checks whether a value can be interpreted as a JSON array.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | Any | The value to inspect |

**Returns:** `"true"` or `"false"` as a string (Deluge cannot return a native boolean from a standalone function).

> **Usage note:** Always compare the return value as a string:
> ```deluge
> if(standalone.is_array(value) == "true") { ... }
> ```

---

## `yoda_extract_id`

**File:** `CRM/YODA/helpers/yoda_extract_id.ds`  
**Author:** Jake Holland

Extracts the numeric ID from a Yoda IRI-format identifier.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `yoda_id_string` | String | Yoda ID in IRI format, e.g. `"/api/v1/companies/396"` |

**Returns:** the numeric ID segment as a string (e.g. `"396"`).

---

## `fetch_yoda_user_id`

**File:** `CRM/YODA/fetch_yoda_user_id.ds`  
**Author:** Jake Holland

Resolves a CRM user's Yoda user ID by matching on full name.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | String | The CRM user record ID |

**Logic**

1. Fetches the CRM user record and extracts `full_name` and `last_name`.
2. URL-encodes the last name and queries the Yoda `users` endpoint with `surname={last_name}`.
3. Iterates the results and finds the record whose `attributes.fullName` matches the CRM `full_name` exactly.
4. Returns the matching Yoda user ID, or `"MISSING"` if no match is found.

**Returns:** Yoda user ID string, or `"MISSING"`.

---

## `Update Trigger Date in Accounts`

**File:** `CRM/YODA/Update Trigger Date in Accounts.ds`  
**Author:** Prince Rajput

Sets the `Task_Trigger_Date` field on an Account to three months from today. Called by a CRM workflow to schedule the next follow-up task.

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | The CRM Account record ID |

Updates the record using `{trigger:{workflow}}` to allow any downstream workflows to fire.
