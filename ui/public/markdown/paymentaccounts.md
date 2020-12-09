
# Payment Accounts

Accounts and Payments are setup at two different places.  Once in the series settings to setup accounts and all possible items for the entire series.  Second is in each event settings, where you select which items are presented to the user.

## Series Setup

Series &#x21D2; Accounts

![PaymentSettings](/images/paymentsettings.png){ .half }

We current integrate with two type of accounts, **Square** and **PayPal**.  **Square** will allow refunds from the main server admin page, **PayPal** will not.
All configured accounts for a series can be viewed from the accounts page.

### Square Accounts

Scorekeeper is setup as a Square application that you can authorize to lookup items and perform transactions on your account.
The Scorekeeper app will use the item list from one of your locations as the items available to the end user.

1. Before Authorizing

    Before you authorize the Scorekeeper application, you must have a location created.

2. Authorize Scorekeeper

    Click **(Re)Authorize Square**.  This should bring up a square page where you can
    login to your account and authorize Scorekeeper which produces a 30-day token for Scorekeeper to use.

    After this is successful, you will be presented with a list of your Square locations.  Select the location you wish to use for
    Scorekeeper payments.  You should be returned to the payment accounts page which know includes an entry for your Square account.

3. Periodic Updates

    Scorekeeper should automatically attempt to update the access token every 30 days without user intervention.

### PayPal Accounts

Paypal setup is a little more manual.  We do **NOT** use your account email or password.  Instead we rely on their REST API and an
app that you setup from your paypal account.

1. App Setup

    To setup your app, see the paypal documentation at https://developer.paypal.com/docs/integration/admin/manage-apps/.  You may need
    to setup developer access to do so.  The created app just needs to allow Accept Payments, nothing else.

2. Add App To Scorekeeper

    From the payment accounts page, click **Add PayPal**. The values to enter are:

    * Account Name - A user provided name
    * Client Id - The **Client ID** field from the **LIVE** version of your PayPal App
    * Client Secret - The enabled **Secret** from your PayPal App

### Membership Account

As memberships are series wide and not event specific, you must select an account that membership fees will be collected in if you wish to collect said fees online.

### Item Lists

All online payments are expected to have a list of items that the user can select from.  i.e. Member Entry and Non-Member Entry.  In the
series settings you create all the possible items for the series.  Click Add Item and enter:

  * Item Name - The visible name for the item such as Member Entry
  * Price - The amount for a single item such as 30.00
  * Item Type - Select type of car entry fee (normal), general event fee (non-entry) or series membership fee



## Event Setup
Events &#x21D2; <EventName>; PaymentSetup

![EventPaymentSettings](/images/eventpaymentsettings.png){ .half }

On the event payment setup, you can chose which items are available to the user for this specific event.

First select which account you are using to collect the payments.

If you don't want unpaid entries to be considered registered, check **Payment Required**.  The user will have a note of *Payment Required*{.warning} on their registration until they pay.

Check the **Use** box for items you wish to present.  For non-entry fee items, you also select the maximum number of the item they can pay for (such as 2 for student workers).
