# DadLAN laptop inventory, faults and charger notes

Source: ChatGPT conversation, 7 September 2025. Archived to preserve the hardware evidence and decisions from the conversation.

## Conversation record

### User
Asked to assign the 10 previously mentioned laptops to their statuses, with actual brands and models.

### Evidence supplied by user

**HP Pavilion dv7**
- Photo label: Product Pavilion dv7
- Model: **dv7-2206TX**
- User labelled it **HP17**
- User: “This is one of the good ones.”
- At the time it was running Windows 10 / DadLAN.

**Toshiba Satellite C50D-A**
- Photo label: **Satellite C50D-A**
- Part no. **PSCFWA-03J00K**
- Input: **DC 19V 2.37A**
- User labelled it **Toshiba16**
- User: “This is one of the other good Windows 10 ones.”

**HP 15-b003AU / b0035AU identification from label**
- White HP laptop.
- Photo label showed HP Laptop model text around **15-b003AU** (earlier assistant transcribed b0035AU; preserve photo as authority).
- Input shown: **19.5V DC 2.31A**
- User note: Windows 10, “needs external HDMI monitor”.
- User: “This is good, has Windows 10 but needs external HDMI screen to run.”

**Toshiba Satellite A100**
- Photo label: **Satellite A100 SYSTEM UNIT**
- Model no. **PSAA2A-05301N**
- Input: **DC 19V 3.42A**
- User labelled it **Toshiba19**
- Note: “XP - put on Linux?”
- User: “This is the XP one.”

**ASUS F553M**
- User corrected prior assistant: **pending charger**.
- Status at this point: untested / pending charger.

**Toshiba Satellite L850D**
- White Toshiba, labelled **Toshiba20**.
- Photo label: **Satellite L850D**
- Part no. **PSKECA-00W002**
- Input: **DC 19V 3.95A**
- AMD A10 / Radeon stickers visible.
- At first factory recovery / Windows 7 work was underway, with plan to upgrade to Windows 10.
- Later user reported it **runs but randomly shuts down** and suspected the charger.

### Four machines identified by user as duds

1. **Toshiba Satellite M55-S329**
   - Part no. **PSM50U-05X01V**
   - Input: **DC 15V 5.0A**
   - User note: “Probably no HDD; Lubuntu / Windows installs fail; will boot to BIOS.”
   - User: “One of the four duds.”

2. **Compaq Presario V2000**
   - Product label: **Presario V2000**
   - Service tag/model visible: **V2157AP**
   - Windows XP Home licence.
   - User note: charge light, doesn’t turn on, no keyboard.
   - User: “2 of four duds.”

3. **Toshiba Satellite C50-B**
   - Photo label: **Satellite C50-B**
   - Part no. **PSCMLA-03200S**
   - Input: **DC 19V 2.37A**
   - User note: charge light, continually restarts / black screen.
   - User: “Dud 3/4.”

4. **IBM ThinkPad**
   - Photo underside: **TYPE 2656-EM7**, manufactured 02/06.
   - Windows XP Professional licence.
   - User note: charge light, black screen, doesn’t start.
   - User: “Dud 4/4.”

## Ten-laptop status list established in conversation

### Good / usable
1. HP Pavilion dv7-2206TX (HP17)
2. Toshiba Satellite C50D-A / PSCFWA-03J00K (Toshiba16)
3. White HP 15-b003AU-family laptop — Windows 10; internal display issue; external HDMI required
4. Toshiba Satellite A100 / PSAA2A-05301N (Toshiba19) — XP-era / Linux candidate
5. Toshiba Satellite L850D / PSKECA-00W002 (Toshiba20)

### Pending
6. ASUS F553M — pending charger

### Duds
7. Toshiba Satellite M55-S329
8. Compaq Presario V2000 / V2157AP
9. Toshiba Satellite C50-B / PSCMLA-03200S
10. IBM ThinkPad Type 2656-EM7

## Toshiba L850D shutdown / charger investigation

User reported Toshiba20 (Satellite L850D) randomly shutting down.

The laptop label states:
- **19V**
- **3.95A**
- approximately **75W**

The charger being used at the time was photographed. The conversation treated it as a lower-powered Toshiba adapter (approximately 65W / 19V 3.42A) and suspected insufficient available power as a possible contributor to shutdowns. Other possibilities discussed were battery condition, overheating/cooling, RAM/storage, and DC-jack intermittency.

The user said: “Yes it runs, I just think it’s a charger issue. I’ll have to wait for the Kogan charger to arrive.”

## Kogan charger ordered

User supplied order screenshot:
- **OZNALA 12–24V 96W Universal Power Supply Charger**
- purchased via Kogan Marketplace
- order screenshot said expected by **Friday 12 September 2025**

The intended test for the L850D was to use the correct Toshiba tip and **19V**, with sufficient current/wattage for the L850D’s 19V / 3.95A requirement.

## Universal charger notes recorded in the conversation

Known label requirements from the supplied photos:
- Toshiba L850D PSKECA-00W002: **19V 3.95A**
- Toshiba C50D-A PSCFWA-03J00K: **19V 2.37A**
- Toshiba C50-B PSCMLA-03200S: **19V 2.37A**
- Toshiba A100 PSAA2A-05301N: **19V 3.42A**
- White HP 15: label photographed at **19.5V 2.31A**
- Toshiba M55-S329: **15V 5.0A**

The conversation also discussed the HP Pavilion dv7, ASUS F553M, Compaq Presario V2000 and IBM ThinkPad as needing exact label/tip verification before using a universal supply.

## Important corrections / confidence notes

This archive preserves both photo-derived facts and conversation conclusions. Where an exact value was not clearly supported by a photographed label, it should be re-verified before connecting power.

In particular:
- Do **not** assume a universal charger’s maximum 96W rating means every selectable voltage can deliver the full equivalent current.
- Match the laptop’s required **voltage**, polarity and connector first, then confirm the adapter can supply at least the required current/wattage at that voltage.
- The HP white laptop model was transcribed inconsistently in the original conversation (b003AU vs b0035AU); use the physical label/photo as the authoritative source.
- The L850D charger hypothesis was plausible but not proven merely by the shutdown symptom; overheating, battery/DC-jack or other hardware faults remain alternatives if the correct adapter does not solve it.

## Later relevance

This is historical DadLAN inventory evidence from September 2025. Some of these machines may have subsequently been upgraded, renumbered, repurposed, or removed from the active fleet. Do not overwrite newer inventory facts with this snapshot.
