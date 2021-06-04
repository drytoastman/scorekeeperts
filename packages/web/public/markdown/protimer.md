# ProTimer

## Serial Port Required

Right on startup, it will bring up an open serial port dialog.  If there is an available serial port, you can select it.  

![COM2](/images/procom2.png)

If there are no ports that can be opened, you will see a no available ports error.   You must ensure that you have a serial port or USB adapter for the Pro hardware and that noone else has the port opened.

![NoPort](/images/pronoports.png)


## Main Window

![MainWindow](/images/prowindow.png){ .half }

Once connected, no user action is usually required.  The display will show the left and right results in scrolling table.  If there is a red light, the times will show red with a redlight label(seen on left).  If there is a not-staged error, the times will show as blue with a not-staged label.  

The data will show live so reaction and sixty times will show once the car leaves so a blank final time box simply means that they haven't finished yet.

At the very bottom are two indicators for the connected serial port and the network address that is listening for data entry clients to send times to.

## Menu 

![timermenu](/images/protimermenu.png)

1. Open Comm Port to try and open a new Comm port
2. Show/Hide Dialin will show or hide the left/right dialin status/entry panel at the top of the display
3. Delete Left Finish is just there so a keyboard shortcut will work
4. Delete Right Finish same thing
5. Set Run Mode will set the mode to run mode (useful when in align mode) and clear and reset warning message
6. Set Align Mode will set the mode to align mode for aligning lights
7. Soft Reset will tell the hardware to do a software reset (quick)
8. Hard Reset will tell the hardware to do a power cycle which goes through its light test first

## Resetting

If things are in a weird state, resetting usually helps.  You can do this from the timer menu.  Once complete, both the software and the hardware should be in sync again.

If only done from the hardware, the software will not be in sync.{.warning}

## Errors

Align mode is not an error but an indication that the hardware is in align mode, not run mode

![aligmode](/images/alignmode.png){ .half }

The reset warning indicates that the box did a soft reset on its own for some reason and we matched, it can be cleared by setting run mode again

![resetwarn](/images/resetwarn.png){ .half }

*TESTING*{.smallwarning} If we detect that the hardware thinks we are in a different state in terms of runs in progress, this warning will show up.  If the next check is correct, the warning will clear or it can be cleared by clicking clear.  Once we've finished testing, this indicates that we should finish all active runs and reset the hardware.

![nipwarning](/images/nipwarning.png){ .half }

## Debug Pane

The debug tab will show a debug pane where the incoming data is shown in blue and outgoing data is shown in green.  You can also type in your own serial command data and click **Send** to send it.   This is generally only for someone who knows the details of the debugging commands that will produce useful data.

![debugpane](/images/debugpane.png)

## Simulator

The Simulator menu command will open a dialog useful for simulating incoming data from the hardware.
