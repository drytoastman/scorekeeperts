
# Recommended Setups

The frontend pieces run on top of Java and are relatively platform agnostic
expect for items such as serial port access.

The backend pieces run in Docker containers to maintain the same behavior
everywhere.  The Docker requirement is the primary driver of the below
recommendations.

## 1. Linux

The cheapest and lightest weight setup would a simple Linux install as docker
runs natively here.  I find that installing Debian with the XFCE desktop to be
the quickest to boot and shutdown as it doesn't have all the extra visual bells
and whistles that you don't use.

Pros:

  * Native Docker
  * Lowest resource usage
  * Free

Cons:

  * Different interafce than Windows/OS X for non-Scorekeeper stuff
  * Maybe not ideal if laptop has dual use outside of events


## 2. Windows 10

Windows 10 has a new version of the Windows Subsystem for Linux.  This lightweight
virtualization is actually running a regular Linux kernel and is capable of
running Docker.

Pros:

  * Almost native Docker
  * Still pretty lightweight
  * Still have Windows 10 stuff for non-event use

Cons:

  * Not free (though most laptops come with Windows)


## 3. Newer OS X (not well tested)

This also allows installation of Docker Desktop via a slightly heavier
weight virtual machines, Hypervisor.framework for OS X.

Pros:

  * Available now for more recent OS versions
  * Still have normal OS stuff for non-event usage
  * VM is managed by a system service

Cons:

  * middleweight VM, takes some time to start up
  * more resource usage then 1 or 2


## Other types

I don't believe Docker will run on anything else like Chrome OS so Scorekeeper
won't be supporting those.  If you have another system where you can bring up
a docker environment and a local API connection is available, Scorekeeper will
run there too but you must configure the docker system yourself.
