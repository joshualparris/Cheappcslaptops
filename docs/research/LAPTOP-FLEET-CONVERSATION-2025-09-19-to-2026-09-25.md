# Laptop fleet ranking, diagnostics, game compatibility and RAM donor conversation

**Conversation period:** 19 September 2025 – 25 September 2026  
**Archived:** 25 September 2026  
**Purpose:** Preserve the laptop-fleet discussion, including the user's fixed physical ranking labels, hardware identification, diagnostics, Windows/Linux installation troubleshooting, game compatibility discussion, charger compatibility, and Toshiba Satellite P750 RAM-donor discussion.

> Important: the ranking numbers below are the user's physical tracking labels. **Do not renumber them.** Decimal labels such as 7.5, 12.5, 14.5, 17.5, 24.5, 26.5, 29.5, 36.5, 36.7 and 37.5 are intentional.

## Original ranking supplied by Josh

### Top Tier
1. Gaming PC (2019) — Intel i5-9400, NVIDIA GTX 1660 6GB, 16GB RAM.
2. Dell Latitude 5430 (2022) — 12th-gen i5-1245U, 16GB RAM, SSD. Later noted as work laptop.
3. iMac 27-inch Retina 5K (2017) — quad-core i5, Radeon Pro 570 4GB, 8GB RAM.

### Mid Tier
4. Lenovo ThinkPad L480 (2018) — originally described as quad-core 8th-gen i5, 8GB, SSD.
5. HP EliteBook 840 G3 (2016) — i5-6300U, 8GB, SSD. Later note: Josh thinks this was given to Mez.
6. MacBook Air (Early 2015) — i5-5250U, 8GB, SSD.

### Old but with discrete GPUs
7. Toshiba Satellite P750 (2011) — 2nd-gen i7 + NVIDIA GT 540M. Later noted: broken internal screen; needs VGA external display.
7.5. Dell Latitude E6510 (2010), i7.
8. ASUS N53Jq (2010) — i7-720QM + NVIDIA GT 425M.
9. HP Pavilion dv7-2206TX (2009) — i7-720QM + Radeon 4650.

### Lower Mid Tier
10. HP ProBook 4230s (2011) — Sandy Bridge i5.
11. Toshiba Satellite L850D (2012) — AMD A8-class APU.
12. Toshiba Tecra A11/P11 (2010, x4) — early Core i5 dual-core class.
12.5. HP EliteBook 2740p (2010) — first-gen i5 convertible.
13. ASUS N52/N52D/N52DA/N61 family (2010).
14. Toshiba Satellite L630 (2010).
14.5. Gateway NE56R06a-B9604G50Mnks — Pentium B960.

### Low Tier
15. Toshiba Satellite L650D (2010).
16. Toshiba Satellite L635 (2010).
17. HP Compaq 610 (2009).
17.5. Compaq Presario CQ56.
18. Toshiba Satellite L450 (2009).
19. HP 15-db0034AU (2018) — AMD A4-9125.
20. Toshiba Satellite C50D-A (2013).
21. ASUS F553M (2014) — Pentium N3540-class.
22. Toshiba Satellite C50-B (2014).
23. Toshiba Satellite Pro C50 series (2013).
24. Lenovo IdeaPad 100S (2015) — Atom Z3735F, 2GB, eMMC.
24.5. ASUS X205T / EeeBook X205TA — Atom Z3735F, 2GB, eMMC.

### Legacy Tier
25. Dell Inspiron 1525 (2008).
26. Acer Extensa 5630 (2008).
26.5. Acer TravelMate 6593 x2.
27. HP Compaq 6730b (2008).
28. HP Compaq 6710b (2007).
29. Dell Latitude D630 (2007).
29.5. HP 550.
30. Toshiba Satellite A200 (2007).
31. Toshiba Satellite A300 (2008).
32. Toshiba Satellite L300 (2008).
33. Toshiba Satellite L350 (2008).
34. Toshiba Satellite A100 (2006).
35. Toshiba Tecra A8 (2006).
36. Dell Inspiron 6400 (2006).
36.5. ASUS F5R.
36.7. HP 530.
37. HP Pavilion dv2000 (2006).
37.5. HP Pavilion dv6000.

### Older
38. Dell Inspiron 6000 (2005, Pentium M).
39. Dell Inspiron 2200 (2005, Celeron M).

### Duds / incomplete
40. Toshiba Satellite M55-S329 (2005, Pentium M, no HDD, BIOS only).
41. Compaq Presario V2000 (2005, Pentium M, no keyboard, would not boot).
42. IBM ThinkPad Type 2656 (black screen).
43. Dell Dimension 3100 (Pentium 4, dismantled).

## Ranking additions and corrections discussed

Josh asked where missing machines fitted without changing the existing physical labels. The convention became to use decimal insertions rather than renumbering.

- Gateway NE56R06a-B9604G50Mnks: **14.5/43**.
- HP Pavilion dv6000: after correcting an earlier assistant numbering mistake, **37.5/43**.
- Acer TravelMate 6593: **26.5/43**; Josh has two.
- Dell Latitude E6510 i7: **7.5/43**.
- ASUS X205T: **24.5/43**.
- ASUS F5R: **36.5/43**.
- HP 530: **36.7/43**. Josh clarified that non-.5 decimals are only needed when inserting between an existing .5 and a whole number.
- HP 550: after photos showed the Centrino/Core 2 Duo-era configuration, **29.5/43**.
- Presario CQ56: **17.5/43**.
- HP EliteBook 2740p: **12.5/43**.
- Toshiba Tecra P11 remains grouped with the Tecra A11/P11 at **12/43**.

Josh explicitly corrected the assistant when it attempted to renumber the fleet. The labels are already physically attached and therefore must remain exactly as assigned.

## Dell Latitude E6510 investigation

Josh booted Damn Small Linux (DSL 2024) on the Dell Latitude E6510.

Observed/confirmed during the session:
- CPU: **Intel Core i7 M620 @ 2.67GHz**, first-generation Arrandale, dual-core with Hyper-Threading (4 logical CPUs).
- BIOS later showed **8192MB / 8GB RAM** installed.
- Internal storage: Toshiba **MQ01ABF050**, approximately 500GB.
- SMART overall health reported **PASSED**.
- Reallocated/pending/uncorrectable sector counts shown as zero in the diagnostic screenshots.
- Ethernet was detected and internet ping worked.
- Audio devices were detected.
- A CPU load test using multiple `yes > /dev/null &` processes drove the logical CPUs to full load. Josh got stuck inside `top`; the correct exit was `q`, followed by `killall yes`.
- DSL did not have `acpi` available for the proposed battery test.

Windows 10 installation troubleshooting:
- F12 opened the Dell one-time boot menu.
- BIOS Setup was accessible from the boot menu when direct F2 timing was awkward.
- Legacy USB boot was used.
- SATA mode was changed from IRRT/RAID to **AHCI** for the clean-install attempt.
- Rufus settings discussed: Windows 10 x64, MBR, BIOS/UEFI-CSM target, NTFS.
- BIOS confirmed 8GB RAM, making 64-bit Windows the appropriate architecture.
- Josh encountered multiple Windows installer/boot BSODs including:
  - `PAGE_FAULT_IN_NONPAGED_AREA`
  - `SYSTEM_THREAD_EXCEPTION_NOT_HANDLED`
  - `IRQL_NOT_LESS_OR_EQUAL`
- A third-party Windows ISO triggered a Rufus warning about a revoked UEFI bootloader. The recommendation was to use an official Microsoft image rather than trust a third-party ISO.
- A later USB volume label `CCCOMA_X64FRE_EN-GB_DV9` was identified as x64 Windows media.
- Linux also produced a kernel panic during one test. Lubuntu safe graphics / `nomodeset` was discussed as a workaround if normal graphics initialisation failed.

## Toshiba Satellite P750 troubleshooting

The P750 was described as a 2011 laptop with second-gen Core i7 and NVIDIA GT 540M. Its internal display is broken, so Josh uses an external VGA display.

After Windows 10 installation it would POST, show the Toshiba/Windows startup sequence on the external monitor, then go black. Possible causes discussed included graphics-driver handoff (Intel/NVIDIA), display-primary selection, and Fast Startup. Proposed tests included Safe Mode, temporarily using Microsoft Basic Display Adapter, disabling Fast Startup, and forcing second-screen-only output.

## Presario CQ56 and Windows 10

The CQ56 was discussed as a circa-2010/2011 budget laptop. Windows 10 was considered technically possible, with an SSD and at least 4GB RAM strongly preferable.

## Toshiba PA3822E-1AC3 power adapter

A photographed Toshiba adapter was identified as model **PA3822E-1AC3**, output **19V 2.37A (~45W)**. The conversation distinguished small/low-power Toshiba models from larger machines that commonly need 65W or 90W. The key safety principle preserved here is to verify connector, voltage, polarity and required wattage from the exact laptop label/manual rather than assuming all Toshiba barrel adapters are interchangeable.

## Game list discussed for the fleet

Josh asked for machine-specific compatibility, not vague tier-level answers. Games included:

Doom II (1994); Warcraft II: Tides of Darkness (1995); Quake (1996); Command & Conquer: Red Alert (1996); Diablo (1996); Duke Nukem 3D (1996); Super Mario 64 (1996); Quake II (1997); Total Annihilation Commander Pack (1997); NetStorm: Islands at War (1997); StarCraft (1998); Half-Life (1998); Battlezone (1998); Liero (1999); Heroes of Might and Magic III (1999); Quake III Arena (1999); F-22 Lightning 3 (1999); Star Wars Episode I Racer (1999); Unreal Tournament 99 (1999); Hidden & Dangerous (1999); Earth’s Special Forces (2000); Red Alert 2 (2000); Aliens vs Predator 2 (2001); Tribes 2 (2001); Empire Earth Gold Edition (2001); Soldat (2002); C&C Renegade (2002); Soldier of Fortune 2 (2002); C&C Generals + Zero Hour (2003); Wolfenstein: Enemy Territory (2003); OpenTTD (2004); Unreal Tournament 2004 (2004); Prop Hunt; Counter-Strike-era title; Civilization IV (2005); Air Buccaneers (2006); Super Mario 64 co-op mod (2007); Team Fortress 2 (2007); Supreme Commander Gold Edition (2007); Savage (2008); Brutal Doom (2010); Civilization V (2010); Civilization VI (2016); Factorio (2016); Farming Simulator 19 (2018); Age of Empires II: Definitive Edition (2019).

Josh repeatedly requested that future compatibility work name **specific machines**, ideally using the fixed rank labels, rather than saying only “lower mid tier”, “legacy tier”, etc.

## P750 RAM donor discussion

Josh's question was: which weaker laptops could donate RAM to the Toshiba Satellite P750 (#7), while retaining the fixed ranking numbers so the physical donor machine could be located.

The final compatibility list given in the conversation was:

- **7.5 — Dell Latitude E6510 (i7)**
- **9 — HP Pavilion dv7-2206TX (2009)**
- **10 — HP ProBook 4230s (2011)**
- **11 — Toshiba Satellite L850D (2012)**
- **12 — Toshiba Tecra A11/P11 (2010, x4)**
- **12.5 — HP EliteBook 2740p (2010)**
- **13 — ASUS N52/N52D/N52DA/N61 (2010)**
- **14 — Toshiba Satellite L630 (2010)**
- **14.5 — Gateway NE56R06a-B9604G50Mnks**
- **15 — Toshiba Satellite L650D (2010)**
- **16 — Toshiba Satellite L635 (2010)**
- **17.5 — Presario CQ56**
- **20 — Toshiba Satellite C50D-A (2013)**
- **21 — ASUS F553M (2014)**
- **22 — Toshiba Satellite C50-B (2014)**
- **23 — Toshiba Satellite Pro C50 (2013)**

Important caveat for future work: this list was produced conversationally from model-family assumptions, not from reading every installed RAM module's label. **Before physically moving RAM, verify the exact module label and voltage.** The P750 should be checked against the exact model/part number and installed module. DDR3 vs DDR3L voltage compatibility should not be assumed blindly.

## Important conversation corrections / lessons

Several earlier assistant responses were too broad or contained overconfident hardware assumptions. Preserve these corrections:

1. Do **not** infer exact installed RAM from a CPU sticker or model family. The E6510's 8GB was only confirmed when Josh showed the BIOS.
2. Do **not** renumber Josh's physical ranking labels.
3. When a new machine is inserted, use a decimal slot such as 14.5. Use another decimal (for example 36.7) only when necessary to insert between an existing decimal and whole-number label.
4. For RAM donor advice, exact photographed module part numbers are more reliable than model-family assumptions.
5. For game compatibility, Josh wants specific machine names/ranks rather than broad tier labels.
6. The user's fleet list is a tracking system as much as a performance ranking.

## Image evidence in the original chat

The original conversation included numerous photos/screenshots that are not embedded in this Markdown archive, including:
- Dell Latitude E6510 DSL desktop and terminal diagnostics.
- Dell BIOS System Information showing 8192MB RAM and i7 M620.
- Dell boot menu and SATA/AHCI BIOS settings.
- Windows BSOD screens.
- Rufus configuration/warning screens.
- HP 550 exterior/sticker photos.
- Toshiba P750 boot/black-screen photos.
- Toshiba PA3822E-1AC3 adapter label.
- Photos of potential RAM-donor laptops.

Where exact component identification matters, consult the original image evidence rather than relying solely on this textual archive.

## Current instruction carried forward

**Keep Josh's ranking labels exactly as assigned.** In future fleet/hardware work, identify machines using both rank and model, for example:

- **#7 Toshiba Satellite P750**
- **#7.5 Dell Latitude E6510**
- **#12.5 HP EliteBook 2740p**
- **#14.5 Gateway NE56R06a**
- **#17.5 Presario CQ56**
- **#24.5 ASUS X205T**
- **#26.5 TravelMate 6593**
- **#29.5 HP 550**
- **#36.5 ASUS F5R**
- **#36.7 HP 530**
- **#37.5 HP Pavilion dv6000**

This avoids the confusion caused by re-normalising the list.
