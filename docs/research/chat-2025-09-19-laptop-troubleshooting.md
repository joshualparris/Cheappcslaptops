# Laptop troubleshooting conversation — 19 Sep 2025

Archived from Josh's ChatGPT hardware/refurb conversation. This preserves the hardware observations, photos described in the chat, troubleshooting steps/questions, and conclusions so they can be reused in the Cheap PCs/Laptops project.

## Machines and evidence discussed

### Toshiba Satellite (first machine)
- A Toshiba Satellite was shown stuck at the Windows "Getting ready" screen.
- Bottom label in the photo showed a 19 V, 3.42 A requirement.
- The conversation was troubleshooting how long Windows setup should remain at "Getting ready".

### Toshiba Satellite L650D
- The L650D repeatedly fell through to Intel PXE/network boot.
- Screen message: "Check cable connection! PXE-M0F: Exiting Intel PXE ROM. No bootable device -- insert boot disk and press any key."
- This occurred despite attempts with Windows 10 boot USB media and a Windows 7 CD.
- Linux Mint was discussed as an alternative.

### Toshiba Satellite P750
- Label photographed: Satellite P750, part no. PSAY3A-02J001.
- Laptop input label: DC 19 V, 6.32 A.
- A universal adapter was photographed with selectable 12/15/16/18/19/20/24 V output and 5 A max.
- The P750's LCD was visibly severely cracked/damaged, although it could display the Windows 7 boot screen.
- Windows 10 suitability was discussed, including use without an SSD.

### Compaq 610
- Windows 10 installation and architecture were tested.
- A Windows Setup screen offering x64 editions was initially questioned as the wrong architecture.
- Later a Windows Setup screen offering x86 editions was shown; Windows 10 Home x86 was selected/discussed.
- The machine subsequently booted Windows 10 32-bit.
- Task Manager evidence showed:
  - Intel Core 2 Duo CPU
  - about 1 GB usable RAM (965/1015 MB, 95% in use in the photo)
  - mechanical HDD at 100% utilisation
  - CPU around 7% at the instant photographed
- Conclusion from the troubleshooting session: Windows 10 32-bit technically ran, but the 1 GB RAM + HDD configuration made it impractically slow. RAM and SSD upgrades or a lightweight Linux distribution were discussed.
- Universal-charger voltage for the Compaq 610 was discussed separately; the user specifically clarified the voltage question was for this machine.

### Toshiba Satellite L850D
- Label photographed: Satellite L850D, part no. PSKEA-00W002.
- Input requirement: DC 19 V, 3.95 A.
- Storage bay photographed with a Toshiba MQ01ABD100 1 TB 2.5-inch HDD.
- HDD label details visible:
  - Toshiba MQ01ABD100
  - 1 TB
  - Advanced Format
  - date 24APR2012
- Two SO-DIMM modules were visible beside the drive.
- The user asked about removing the HDD without a "star" (Torx) tool.

### HP 15-ab0034au
- A handwritten machine label identified an HP 15-ab0034au (2015).
- Notes on the machine said Windows 10 and referenced an HDMI/external-display issue.

### HP Pavilion dv7
- Handwritten label: "Pavilion dv7".
- Notes: factory reset complete and "up to date" checked.

### ASUS F553M
- Handwritten label: F553M.
- Notes: factory reset complete; needs Windows update.

### Toshiba C50D-A
- Handwritten label: C50D-A.
- Notes: factory reset and up to date checked.

### Toshiba L630
- Handwritten label: L630.
- Notes: upgraded to Windows 10; "a bit slow"; Linux Mint or SSD upgrade suggested; factory reset checked.

## SSD purchase / upgrade evidence

A photo showed MSI SPATIUM S270 2.5-inch SATA SSD packaging and invoice.

Invoice evidence visible:
- Date: 19/09/2025
- Product: MSI SPATIUM S270 240GB 2.5-inch SATA III SSD
- Quantity shown: 3

The SSDs are standard 2.5-inch SATA drives intended for upgrading compatible older laptops.

## Legacy software observed

One laptop was shown running **Video Crystal**, copyright Graeme Moore, 1985+, version 25.11, with location "BARNAWARTHA GENERAL STORE". The screen showed a DOS-era business application interface with items such as Transaction Review, Stored O'Dues, Package Deals, Automatic Booking, Movie and Frequent Hires.

Windows Task Manager showed:
- DOSBox Status Window
- SDL_app

This indicates the legacy application was being run through DOSBox rather than natively by modern Windows.

## Practical conclusions captured from the session

- Old laptops with roughly 1 GB RAM and a mechanical HDD are poor Windows 10 candidates even when Windows 10 can technically install.
- The Compaq 610 was the clearest example: memory was around 95% and the HDD at 100% immediately after setup.
- A 2.5-inch SATA SSD can dramatically improve responsiveness on compatible systems, but cannot compensate fully for extremely low RAM.
- The P750's broken internal display is a separate hardware problem from OS/storage performance.
- PXE fallback on the L650D indicated the firmware was not finding a bootable local/USB/optical device in the attempted configuration.

## Important caveat

This file archives what was observed and discussed in the conversation. Some early troubleshooting statements were provisional. Exact CPU/RAM maximums, charger polarity/tip compatibility, and OS support should be verified against the exact model/part number before hardware changes.

## Conversation chronology

The source conversation ran on **19 September 2025** and included, in order: Windows "Getting ready" troubleshooting; L650D boot-media/PXE troubleshooting; Linux Mint discussion; P750 charger and damaged-screen assessment; Windows 10/HDD questions; Compaq 610 Windows 10 and charger questions; identification of the DOSBox-hosted Video Crystal application; a temporary power-on problem; Windows architecture selection; Windows 10 suitability checks for the L850D and several labelled laptops; identification of the MSI SPATIUM S270 SSDs; L850D HDD removal; and finally evidence that the Compaq 610 was struggling badly under Windows 10 32-bit.
