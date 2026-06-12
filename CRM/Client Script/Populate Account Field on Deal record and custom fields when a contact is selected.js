// When a contact is selected, this client script populates related contact,
// account, and address information on the Deal record.
// Goal: use the selected contact to fill email, phone, account, and address fields.

// Step 1: Read the selected contact from the page field.
var contact = ZDK.Page.getField("Contact_Name").getValue();
console.log(contact);

if (contact != null) 
{
    // Extract the contact record ID from the lookup value.
    var contact_id = contact.id;
}

if (contact_id) 
{
    // Step 2: Retrieve the full contact record using the selected contact ID.
    var contact_record = ZDK.Apps.CRM.Contacts.fetchById(contact_id);
    console.log(JSON.stringify(contact_record));

    // Step 3: Populate contact details on the Deal form.
    // Populate Contact Email
    if (contact_record.Email)
    {
        ZDK.Page.getField("Contact_Email").setValue(contact_record.Email);
    }

    // Populate Contact Telephone
    if (contact_record.Phone)
    {
        ZDK.Page.getField("Contact_Tel").setValue(contact_record.Phone);
    }

    // Step 4: Fetch the related account and map it to the Deal record.
    // Set Account lookup (from Contact)
    if (contact_record.Account_Name_Lookup_Id)
    {
        account_record = ZDK.Apps.CRM.Accounts.fetchById(contact_record.Account_Name_Lookup_Id);
        console.log(JSON.stringify(account_record));
        if (account_record.id != null && account_record.id != "")
        {
            // Populate the Account lookup field on the Deal.
            ZDK.Page.getField("Account_Name").setValue({
            id: account_record.id,
            name: account_record.Account_Name
        });
        }

        // Also populate the company name field when a separate field is used.
        ZDK.Page.getField("Company_Name").setValue({
            id: account_record.id,
            name: account_record.Account_Name
        });
    }

    // Step 5: Populate the mailing address fields from the selected contact.
    if (contact_record.Mailing_Street)
        ZDK.Page.getField("Address_1").setValue(contact_record.Mailing_Street);

    if (contact_record.Mailing_Street)
            ZDK.Page.getField("Address_2").setValue(contact_record.Mailing_Street_2);
    if (contact_record.Mailing_Street)
        ZDK.Page.getField("Address_3").setValue(contact_record.Mailing_Street_3);

    if (contact_record.Mailing_City)
        ZDK.Page.getField("Town").setValue(contact_record.Mailing_City);

    if (contact_record.Mailing_State)
        ZDK.Page.getField("County").setValue(contact_record.Mailing_State);

    if (contact_record.Mailing_Zip)
        ZDK.Page.getField("Postal_Code").setValue(contact_record.Mailing_Zip);

    if (contact_record.Mailing_Country)
        ZDK.Page.getField("Country").setValue(contact_record.Mailing_Country);
}