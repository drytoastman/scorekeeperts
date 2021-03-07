# Installation

## Requirements
1. A Docker environment for your operating system, some common installation instructions are:
    - [Ubuntu](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
    - [Debian](https://docs.docker.com/engine/install/debian/)
    - [Fedora](https://docs.docker.com/engine/install/fedora/)
    - [OS X](https://docs.docker.com/docker-for-mac/install/)
    - **Windows 10**
      1. Uninstall Docker-Toolbox and VirtualBox if present
      1. Windows logo key + R, type winver, the OS Build should be 19041 (20H1), 19042 (20H2) or later
      2. If not recent enough, [update Windows 10 to 20H1 or later](https://support.microsoft.com/en-us/windows/get-the-windows-10-october-2020-update-7d20e88c-0568-483a-37bc-c3885390d212)
      3. [Activate WSL2 (Steps 1-5) ](https://docs.microsoft.com/en-us/windows/wsl/install-win10#manual-installation-steps)
      4. [Install Docker Desktop for Windows](https://hub.docker.com/editions/community/docker-ce-desktop-windows/) - if asked, select Linux containers, NOT Windows containers

## Installing
1. Verify that the above requirements for Docker are installed (a system install of Java is no longer required)

1. Download the latest scorekeeper zip from https://github.com/drytoastman/scorekeeperfrontend/releases
   for your OS and extract to a chosen directory.  There are several scripts (or .bat files on Windows):
   * **StartScorekeeper** - the normal way to start the system
   * **StartProtimer** - used to start just the pro timer interface without requirng Docker or a database

1. Run **StartScorekeeper** while connected to the Internet so that the backend is
   properly downloaded and a database is setup

1. If you have never run **LoadCerts** on this machine before, the Cert box
   will be red as it only has a filler certificate. Select **File** &rarr;
   **LoadCerts**. You will be asked for the certificates file, select the
   **certs.tgz** provided by the server administrator. These are shared
   between versions so you only need to do it once per computer.

Without the above step, you cannot sync with scorekeeper.wwscc.org or other laptops. {.warning}

1. For non-Linux installs you **may** need to open incoming firewall ports depending on your own system:

    * For Windows machines, you can run **rules.bat** as **Administrator** to insert theses rules and
      turn off the IIS and InternetConnectionSharing services that get in the way.

    * For others, the following ports are used:
        1. **TCP:80**    for the local web server (results, etc)
        1. **TCP:54329** for syncing with other nearby machines
        1. **TCP:54328** for most network timer connections (i.e. ProSolo Timer)
        1. **UDP:53**    standard unicast dns for onsite resolving of "de" and "reg" to a Scorekeeper laptop IP
        1. **UDP:5353**  standard multicast dns for onsite resolving of "de" and "reg" to a Scorekeeper laptop IP
        1. **UDP:5454**  for discovering nearby machines or network timers
