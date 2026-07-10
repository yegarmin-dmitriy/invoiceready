# Demo video script (English, target 3:00, hard cap 5:00)

A screen recording of the live app with voiceover. Record at 1080p, browser in
dark mode, window clean (no bookmarks bar, no notifications). Speak calmly; the
product does the talking. No on-screen cursor jitter: move deliberately.

Live URL: https://invoiceready-air-slate.vercel.app
Deck (optional B-roll): https://invoiceready-air-slate.vercel.app/deck.html

There are two demo paths. Path A (samples) works today and is the safe primary
take. Path B (drop a real photo) needs the LiteLLM key and is a stronger opener
if it is wired in before recording. Record Path A regardless.

---

## Scene 1. Hook (0:00 to 0:20)

On screen: the landing page, slowly. Let the headline and the three stat cards
breathe.

Voiceover:
> "In 2026, e-invoicing becomes mandatory across the European Union. Poland,
> Belgium, France and more. And they will not accept a PDF or an Excel file.
> Millions of small businesses are about to find out their invoices no longer
> count. InvoiceReady fixes that in about thirty seconds."

---

## Scene 2. The problem invoice (0:20 to 1:30)

On screen: click the sample card "Invoice with problems". Land on Review.

Voiceover:
> "Here is a real-world invoice. Watch what happens."

Action: let the red and amber flags render. Hover the seller VAT field, then the
totals.

Voiceover:
> "InvoiceReady already checked it against the European standard, EN 16931. The
> VAT number is missing. The line total does not match quantity times price. The
> tax and the grand total do not add up. And it says so in plain language, not
> error codes."

Action: click "Recalculate totals". The arithmetic flags clear. Then type a VAT
id into the seller field, for example PL1234567890.

Voiceover:
> "I fix the numbers with one click, add the missing VAT number, and the invoice
> turns green. It is now compliant."

Action: click "Generate e-invoice".

---

## Scene 3. The payoff (1:30 to 2:10)

On screen: the Done screen with the compliant badge.

Voiceover:
> "That is a legally valid European e-invoice. UBL 2.1, Peppol standard."

Action: click "Download UBL XML" (show the file appear). Then click the "UBL XML"
tab to reveal the generated XML, scroll a little.

Voiceover:
> "Real, structured XML that an accounting system or a tax authority will accept.
> No ERP, no setup, and the file never leaves the browser. Privacy is built in."

---

## Scene 4. Even a photo (2:10 to 2:40)

Path A (no key): click "Convert another", then the sample "Photo of a paper
invoice". Land on Review, compliant.

Path B (with key): drag a real phone photo of an invoice onto the drop zone.
Show the short "Reading your invoice" state, then the filled Review form.

Voiceover:
> "It does not care where the invoice came from. A clean PDF, a scan, or a photo
> taken on a phone. The AI reads it. But here is the important part: the AI only
> reads. Whether the invoice is compliant is decided by deterministic rules, in
> code, with unit tests. Predictable and auditable."

---

## Scene 5. Close (2:40 to 3:00)

On screen: back to the landing page, or the closing deck slide.

Voiceover:
> "Any invoice in. A compliant European e-invoice out. In thirty seconds.
> InvoiceReady."

Show the URL on screen: invoiceready-air-slate.vercel.app

---

## Pre-record checklist (run the full path twice before recording)

- [ ] Browser in dark mode, 1080p, clean chrome, notifications off.
- [ ] Landing page loads, aurora and stat cards visible.
- [ ] "Invoice with problems" shows 4 issues with human messages.
- [ ] "Recalculate totals" clears the three arithmetic issues.
- [ ] Typing a valid VAT id clears the last error and the banner turns green.
- [ ] "Generate e-invoice" reaches the Done screen with the compliant badge.
- [ ] "Download UBL XML" downloads a file; the XML tab shows real UBL.
- [ ] "Photo of a paper invoice" sample lands compliant (Path A).
- [ ] If the key is wired: dropping a real photo returns a filled form (Path B).
- [ ] Total runtime under 5:00, ideally near 3:00.

## Notes

- Keep the voiceover free of jargon on first mention; say "the European
  standard" before "EN 16931".
- If a take runs long, cut Scene 4 to a single sentence; Scenes 2 and 3 are the
  core and must stay.
- Record one clean take of each scene; assemble in the editor rather than doing
  one continuous run.
