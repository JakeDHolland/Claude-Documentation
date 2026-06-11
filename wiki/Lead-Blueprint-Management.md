# Lead Blueprint Management

## Overview

Zoho CRM Blueprints control the lifecycle stage of a Lead. The two blueprints in use are:

- **Lead Qualification** — the standard Customer pipeline
- **Supplier Blueprint** — the Supplier pipeline

When a Lead's `Lead_Prospect_Type` field is changed (e.g. from Supplier to Customer), the Lead may be on the wrong blueprint. This function detects the mismatch and forces a transition to the correct blueprint stage.

---

## Function — `Update_Change Lead Blueprint`

**File:** `CRM/YODA/Update_Change Lead Blueprint.ds`

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | The CRM Lead record ID |

---

## Logic

1. Fetches the Lead record and reads `Lead_Prospect_Type`.
2. Calls the Zoho CRM Blueprint API (`GET /crm/v6/Leads/{id}/actions/blueprint`) to determine which blueprint is currently active (`process_info.name`).
3. Compares the prospect type against the active blueprint and applies a transition if there is a mismatch:

| `Lead_Prospect_Type` | Active blueprint | Action |
|----------------------|-----------------|--------|
| `"Customer"` | `"Supplier Blueprint"` | Transitions to Customer blueprint (transition ID `6102667000001448432`), clears `Lead_Status`, sets `Lead_Prospect_Type = "Customer"` |
| `"Customer & Supplier"` | `"Supplier Blueprint"` | Same transition as above, preserves `Lead_Prospect_Type = "Customer & Supplier"` |
| `"Supplier"` | `"Lead Qualification"` | Transitions to Supplier blueprint (transition ID `6102667000000583579`), clears `Lead_Status`, sets `Lead_Prospect_Type = "Supplier"` |

4. The transition is executed via a `PUT` to the Blueprint API with the transition ID and a `Notes` field set to `"Updated via blueprint"`.

---

## Transition IDs

| Transition | ID |
|------------|----|
| Move to Customer blueprint | `6102667000001448432` |
| Move to Supplier blueprint | `6102667000000583579` |

These are hard-coded and environment-specific. If the CRM organisation is re-created or blueprints are rebuilt, these IDs will need updating.

---

## Notes

- If the prospect type already matches the active blueprint, no transition is made and the function exits silently.
- `Lead_Status` is cleared to `""` on every transition to allow the blueprint to set the correct starting status.
