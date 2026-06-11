# Integration Settings

**File:** `CRM/YODA/yoda_get_intergration_settings.ds`  
**Author:** Jake Holland

## Purpose

Returns a single settings map that every other Yoda function depends on. It centralises all environment URLs, authentication pointers, field mappings, and module path aliases in one place.

## Usage

```deluge
settings = standalone.yoda_get_intergration_settings();
```

No inputs are required.

## Returned Map Structure

### `credentials`

Controls which Yoda environment is targeted.

| Key | Default value | Description |
|-----|---------------|-------------|
| `sync_version` | `"live_enviroment"` | Points to whichever environment key should be active |
| `live_enviroment` | `"api"` | Live API subdomain |
| `uat_enviroment` | `"apiuat"` | UAT subdomain |
| `test_enviroment` | `"apitest"` | Test subdomain |
| `protocol` | `"https://"` | URL protocol |
| `domain` | `".beautynet.co/"` | Base domain |
| `root` | `"api/v1/"` | API root path |

The full base URL is built as: `protocol + credentials[sync_version] + domain`

### `path`

Maps CRM module names to Yoda API endpoint names (and vice versa).

| CRM module | Yoda endpoint |
|------------|---------------|
| `Accounts` | `companies` |
| `Contacts` | `contacts` |
| `Addresses` | `addresses` |
| *(also reverse lookups and order endpoints)* | `sales-negotiations`, `sales-orders`, `purchase-orders`, `payment-terms`, `delivery-terms`, `users` |

### `mapping`

Defines the field-level translation between CRM and Yoda for each module. Each entry contains:

- `crm.path` – the field key on the CRM record map
- `crm.type` – expected data type (`string`, `number`, `boolean`)
- `yoda.path` – the corresponding field key in the Yoda API payload
- `yoda.nullable` – whether Yoda accepts a null value for this field

#### Accounts mapping highlights

| CRM field | Yoda field |
|-----------|------------|
| `Account_Name` | `companyName` |
| `Currency` | `currency` |
| `Company_Number` | `companyNumber` |
| `Account_Type` | `companyType` |
| `VAT_number` | `vatNumber` |
| `EORI_Number` | `eoriNumber` |
| `Operating_Region` | `regionOfOperation` |
| `Credit_Limit` | `creditLimit` |
| `Customer` *(boolean)* | `isCustomer` |
| `Supplier` *(boolean)* | `isSupplier` |
| `deliveryTerm` | `deliveryTerm` |
| `paymentTerm` | `paymentTerm` |
| `defaultSalesperson` | `defaultSalesperson` |

#### Contacts mapping highlights

| CRM field | Yoda field |
|-----------|------------|
| `Full_Name` | `fullName` |
| `Email` | `emailAddress` |
| `Primary_Contact` | `isPrimary` |
| `company_yoda_id` | `company` |

#### Addresses mapping highlights

| CRM field | Yoda field |
|-----------|------------|
| `Street_1` | `addressLineOne` |
| `Address_Line_Two` | `addressLineTwo` |
| `Town_City` | `townCity` |
| `Postcode` | `postcode` |
| `Country` | `country` |
| `Primary` | `isPrimary` |
| `address_type` *(integer)* | `addressType` |
| `company_yoda_id` | `company` |

## Switching Environments

To point the integration at a different environment, change the `sync_version` value inside the function:

```deluge
"sync_version": "uat_enviroment"   // switch to UAT
"sync_version": "test_enviroment"  // switch to test
"sync_version": "live_enviroment"  // back to live (default)
```

The `yoda_call_api` function reads this value and automatically selects the correct Zoho connection name (`yoda_live` or `yodatest`).
