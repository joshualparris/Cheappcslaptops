# Build a Windows GPU resale-test station (Dubbo)

Updated: **11 November 2026**. This is a repeatable **one-card-at-a-time** procedure for second-hand GPUs, including cards removed from mining rigs. It is not a claim that any of the photographed cards or parts have been tested.

## 0. Start here: what we actually know

The photos show several open multi-slot mining-style motherboards with Intel stock CPU fans, stacks of graphics cards, cables and other loose computer parts. The *exact* motherboard models, CPU types, RAM, GPU models, PSU ratings, cables and working condition **cannot be established** from the photos alone.

**First target:** get one reliable Windows test computer booting with one known-good GPU. Do **not** start by filling a mining board with 8-13 GPUs. Test other cards only after the reference machine is stable.

### Items to gather

- **Motherboard + compatible CPU/cooler.** Find the model printed on the PCB; locate its manual. Check CPU support, RAM type, CPU power header, BIOS/UEFI and PCIe slot. The photographed bare boards may be suitable, but are unverified.
- **8+ GB compatible RAM** (DDR3 vs DDR4 matters; check the board's manual).
- **120+ GB SSD** with SATA data and PSU SATA power (or a board-compatible M.2 drive).
- **Known-good quality ATX PSU**, typically 650-850 W for a single mid/high-power second-hand GPU, with enough *native, correct* 6/8-pin PCIe cables for the hungriest card. Compute the actual requirement from the card's power rating, the rest of the system and PSU rating; **do not blindly assume 650 W covers every GPU**.
- **Case or secure nonconductive open-air frame with standoffs**, plus a proper case/bench power button. No motherboard or powered GPU on metal, loose cardboard or carpet.
- Monitor, matching HDMI/DisplayPort cable, USB keyboard/mouse, Ethernet/internet, Windows installation USB.
- One **known-good** GPU to establish a baseline, ideally with an ordinary full-length PCIe x16 slot.
- Optional only if required: correctly powered PCIe x16 riser and an open-air support frame.

### Mandatory electrical precautions

1. Shut down, **switch PSU off and unplug it** before adding/removing cards, plugs, risers or power leads. Allow components to cool.
2. Fit the board to insulated standoffs; connect a CPU fan, and support the GPU's weight.
3. **No SATA-to-PCIe or SATA-powered mining risers.** ASRock recommends 6-pin powered risers for mining-style boards; follow the exact board and riser maker's instructions.
4. **Never mix modular PSU cables from different PSU models**, even if the plugs fit. Do not adapt CPU EPS connectors into GPU PCIe power. Use manufacturer-approved cables.
5. Do not energise scorched, cracked, corroded or wet cards. Do not leave a bare test bench unattended.
6. For the first PC, **one PSU, one GPU**. Multi-PSU rigs need careful design; do not cobble multiple power supplies together.
7. Test with mains power switched off while wiring, and monitor connector/PSU temperature and fan operation. If anything smells hot, buzzes unusually or overheats, stop.

## 1. Hardware build — exact order

1. Pick a motherboard, **read the model printed on it** and get its official manual. Check its CPU and RAM compatibility. If it has only PCIe x1 sockets, a suitable powered riser is mandatory; otherwise use a normal full-length x16 slot.
2. Mount motherboard securely on standoffs in a case or test frame.
3. Install CPU if absent, cooler with suitable thermal paste, connect cooler to **CPU_FAN**. Verify heatsink mounting is firm.
4. Fit compatible RAM in the manual's preferred slot (one stick is fine for testing).
5. Connect the PSU **24-pin ATX** motherboard cable and **4/8-pin CPU EPS** power cable (match the board and PSU labels).
6. Connect SSD to motherboard SATA data and PSU SATA power. Connect the **PWR_SW** front-panel switch according to the motherboard manual. Connect a keyboard, monitor and USB installer.
7. Install one known-good GPU directly into an x16 PCIe slot if possible. Fully seat it. Plug in all its required **native PCIe GPU power** leads. Some motherboard designs also require extra slot-power connectors: consult the manual before powering any occupied slots.
8. Connect the monitor to the GPU's output (not the motherboard unless intentionally using a known-good integrated GPU to troubleshoot).
9. Check no tools or screws are loose, fans turn freely and no PCB touches metal. Plug in AC power, switch PSU on, press power button.
10. Enter BIOS/UEFI using the motherboard's documented key (often **Del** or **F2**). Check CPU, RAM, SSD and temperatures. Restore safe stock settings; disable any GPU overclock/undervolt. Do not flash an unknown BIOS just to begin.
11. If no POST: power off, verify monitor input, CPU EPS and 24-pin power, RAM seat, GPU power, debug LEDs/beep codes and CPU/RAM compatibility. Test known-good parts one at a time.

## 2. Install Windows and GPU drivers

1. On a different working computer, use Microsoft's **Windows 11 installation media** tool: https://www.microsoft.com/software-download/windows11 . Use an empty USB drive of at least 8 GB, which will be erased.
2. Boot the test machine from USB (refer to its BIOS boot menu), choose **Custom install**, and install Windows to the dedicated SSD. Ensure no other disk with wanted data is selected for erasure.
3. Activate Windows as appropriate. Connect the internet and run **Settings > Windows Update** repeatedly until current.
4. Install chipset/network drivers from the **motherboard maker**. Install GPU drivers from https://www.nvidia.com/en-us/drivers/ or https://www.amd.com/en/support/download/drivers.html for the actual card.
5. In **Device Manager > Display adapters**, check the GPU name and **Properties > General**. **Code 43/Code 31**, missing drivers or “Microsoft Basic Display Adapter” mean testing is *not* complete.
6. If the board does not support Windows 11, stop and assess supported OS/hardware choices. Windows 10 general support ended 14 October 2025; do not expose an unsupported OS casually to the internet.

## 3. Establish a known-good baseline

Before testing sale stock, verify the **test station itself** with a known-good GPU: boot normally, check Device Manager, run 3D load and VRAM test once, confirm temperatures/fans and restart. A station fault can make good cards appear defective. If the motherboard or PSU cannot be verified, do not use its results to grade sale stock.

## 4. Install tools once

| Tool | Action | Notes |
| --- | --- | --- |
| **Windows Device Manager** | Built into Windows | Read vendor/name, problem code and driver state; no additional licence. |
| **GPU-Z** | Download https://www.techpowerup.com/gpuz/ | Inspect GPU model, VRAM, clock/BIOS fields and Sensors tab. Review its own licence for your intended use. |
| **memtest_vulkan** | Download the Windows exe from https://github.com/GpuZelenograd/memtest_vulkan/releases | Open-source VRAM tester; requires Vulkan 1.1-compatible GPU/driver. Run the selected **correct GPU** for the standard **at least 5-6 minute test**. Read its on-screen result. Unsupported hardware is *not a pass*. |
| **Blender Open Data Benchmark** | Download https://opendata.blender.org/ | Free/open-source GPU render workload. Select **GPU device, not CPU**, run a supported scene, check for crashes/artefacts and use GPU-Z to monitor temperature. Some older cards cannot use modern Blender GPU rendering; record **not tested** and choose another appropriately licensed workload. |
| **OCCT Pro (optional)** | https://www.ocbase.com/occt/pro | Commercial diagnostic alternative for 3D + VRAM + reporting. **OCCT Personal is prohibited in commercial/business environments**; don't use its free Personal edition for stock being tested for business resale. |
| **UNIGINE Superposition Pro (optional)** | https://benchmark.unigine.com/superposition | Commercial option; Basic/Advanced licences do not permit business testing. |

**Do not automatically download or run any installers through the supplied PowerShell recorder.** Only download tools from official publishers. Record tool versions and durations in the notes. Keep evidence/screenshots **local**. Never upload a customer/device serial number or private sales records into this public GitHub repository.

## 5. For each GPU (about 20-30 minutes of hands-on testing plus swaps)

1. With PSU **off and unplugged**, label the physical card `GPU-001`, `GPU-002` etc. Photograph **both sides**, identify visible connector type, fans and any defects. Inspect for corrosion, missing parts, signs of overheating and damaged PCIe contacts. Reject unsafe cards without applying power.
2. Replace the known-good GPU with the sale GPU. Connect the exact required native PCIe power. Recheck cables and ventilation. Power up.
3. Confirm Windows **Device Manager** sees the right GPU with no problem code. Install the appropriate official driver where needed. If it shows Code 43 or no display, try known-good cable/display/PSU and then retry in the baseline slot before deciding it is faulty.
4. In **GPU-Z**, record chip/model, genuine-looking VRAM amount, BIOS and driver. Compare against the physical board/serial/part number. A flashing or mining-modified BIOS may cause problems; **do not flash** it as part of the quick test. GPU-Z identification alone does **not** prove health or authenticity.
5. In GPU-Z Sensors, enable **Log to file** if you want a temperature trace. Run **Blender GPU** workload (or licensed commercial 3D test) with the **actual card** selected, check the screen for pixels, flickering, crashes, resets and the fans for odd behaviour. Aim for **at least 10 minutes of cumulative load**; repeat benchmark scenes as needed. Record peak core temp, noting that safe ranges vary by card/cooler/ambient conditions; **no universal passing temperature** is assumed.
6. Run **memtest_vulkan**. Make sure its device label matches **the card you are selling**, not an iGPU or fallback Vulkan translator. Run at least its standard 5-minute cycle (allow about **6 minutes** total) and stop via **Ctrl+C** when prompted. Record **zero errors / errors / unsupported**. A card with a detected error needs further diagnosis, not a clean pass.
7. Plug a known-good monitor into **each applicable physical video output** you intend to advertise as working. Check the image is stable. Some mining-only cards may not offer conventional outputs: disclose the limitation.
8. Shut down. Let the GPU cool. Power PSU off/unplug before swapping to the next card.
9. Record the result with the PowerShell script below. A short test is a **screen**, not an extended reliability warranty. For more expensive or questionable cards, extend 3D and VRAM testing and document exact durations.

## 6. Save results with a built-in PowerShell recorder

Download this repository as a ZIP (green **Code > Download ZIP** at https://github.com/joshualparris/Cheappcslaptops) and extract it somewhere convenient, or use `git clone`.

Open **Windows PowerShell** in the repository folder, then run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Start-GpuSaleTest.ps1 -CardId GPU-001
```

Replace `GPU-001` as you proceed. The command's policy setting applies **only to that PowerShell process**; it does not change the machine-wide execution policy.

- Choose which Windows graphics adapter corresponds to the labelled physical GPU.
- Answer each check honestly with **P** (pass), **F** (fail), **N** (not tested).
- Record GPU-Z model/VRAM, optional serial, peak temperature and test software/duration/observations.
- Results are saved locally at `Documents\GPU-Sale-Tests\gpu-sale-register.csv` and one timestamped JSON file per test.
- **PASSED_QUICK_SCREEN** requires all six checks explicitly passed, a recorded temperature, a non-generic driver and Windows PnP code 0.
- **INCOMPLETE** means checks/temperature are missing; **REVIEW_DEVICE_OR_DRIVER** means the driver/device needs attention; **FAULT_REPORTED** means a recorded failed check. None of these three may be marketed as a clean pass.
- The script **does not** install drivers, run stress tests, verify honesty of manual answers, price cards or publish listings.

### Listing wording (only when fully supported)

> Tested in Windows [version] on [date]. Identified as [exact model/VRAM]. Completed [X min] 3D load and [Y min] VRAM test with no detected errors; maximum observed GPU core temperature [Z °C]. Fans and listed display outputs tested. Used card, sold with any disclosed cosmetic/functional limitations.

Never imply factory-new condition, unknown mining history or a comprehensive warranty from a short test.

## 7. Future batch-testing upgrade (not step one)

Once the one-GPU baseline is stable, a **properly designed** multi-GPU mining board with known-good correctly powered risers, adequately sized PSU(s), spacing and ventilation might test 2-4 cards at once. The OS must see *each GPU* and the test app must unambiguously target *each* card; a single successful benchmark does not validate all installed GPUs. Recheck the board manual, cables and power budget first. Do not attempt parallel testing with the unverified parts in the photos.

## Sources and licensing

- ASRock mining-board power/riser notes: https://www.asrock.com/support/faq.asp?k=connector
- NVIDIA guide to collecting GPU-Z sensor logs: https://nvidia.custhelp.com/app/answers/detail/a_id/4749
- memtest_vulkan README/release: https://github.com/GpuZelenograd/memtest_vulkan
- Blender Benchmark: https://opendata.blender.org/
- OCCT Personal commercial restriction: https://www.ocbase.com/download-personal
- OCCT Pro commercial: https://www.ocbase.com/occt/pro
- UNIGINE Superposition EULA: https://benchmark.unigine.com/policies/superposition-eula
