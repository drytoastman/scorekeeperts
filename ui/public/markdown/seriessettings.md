# Series Settings

Series &#x21D2; Settings

![SeriesSettings](/images/seriessettings.png){ .three4 }

All of the series wide settings (except payments) should be available here.


Series Name
: the full name of the series for the results pages

EMail List ID
: the ID of the 'mailing list' for this series, keep the same for all series under the same administration.  Lets the user select which series they don't want to hear from.  If an unsubscribed list id matches this id, their email will show as '********' in the contact list and it won't be exported.

Largest Car Number
: users will be restricted to selecting numbers from 0 up to and including this value, anyhing negative or over this will be disallowed

Minimum Events For Championship
: the minimum number of events that must be attended to be considering eligible for a championship position

Events Dropped For Championship
: the number of events that can be dropped for the series, effect depends on the number of counted events.  For example, drop 2 with 9 events means that the 7 best events are used to calculat each entrants championship points

Classing Link Help
: an external URL that provides classing help, shows up on the registration page

Request Rules Ack
: if checked, the registration page will request that users read the rules page and acknowledge them, also shows as a check box on the registration cards

Series Rules Link
: an external URL that provides the rules for the entire series, shows up on the registration page

Use Position Based Points
: if checked, calculate event points based on position not difference from first

Position Points List
: the points for each position if using position based points, the last value is repeated to fill remaining positions

Request Barcodes
: if the user does not have a barcode value set, the registration site will request that they do so if available

Index After Penalties
: Normally the final times = (raw*index)+penalties, if this is checked, the calculation will be (raw+penalties)*index

Series Wide Unique Numbers
: Normally we require unique numbers for each class code, if uniqueness is required across all cars (regardless of class)

Results Extra CSS
: Regular CSS that is prepended to the results page if you want to change styling

Results Header (HTML)
: Provide HTML to replace the regular header for the full event results, as you no longer have full access to the render
context, the following values are replaced by their event values
* EVENTNAME  = event name
* EVENTDATE  = formatted event date
* SERIESNAME = series name
* LOCATION   = event location
* COUNT      = event entry count

Card Template (HTML)
: Replace the standard card template HTML with a custom version, can provide examples if needed