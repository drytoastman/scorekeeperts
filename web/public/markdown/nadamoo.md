# Nadamoo Barcode Scanner

We are currently using the NADAMOO 433Mhz Wireless Barcode Scanner.  The frequency allows a better range and its only about $40.
The following are some recommended settings for the Nadamoo scanner.

First start by reseting to defaults, setting the interface to a COM (serial) port and enabling Instant Upload to make sure that it is
uploading right away rather than storing in the scanner.  Other useful options include setting to the beep indicator to its highest volume,
setting a quick standy (10 seconds) and a longer switch off (5 mins) so that the user doesn't have to deal with the turn on beep for every scan.

To configure Registration or Data Entry to use the scanner, select **SerialPort** as the scanner type and then verify the **SerialPort Options**
are set to:

 * no start character
 * carriage return end
 * 100ms max delay

![serialbarcodemenu](/images/serialbarcodemenu.png)
![serialbarcodeconfig](/images/serialbarcodeconfig.png)

