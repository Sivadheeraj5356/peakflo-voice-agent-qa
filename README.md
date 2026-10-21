# Peakflo Voice Agent QA

A client-side QA checklist for finance voice agents before a controlled pilot. It scores prompt flows for TTS clarity, grounding to a finance source, human handoff, latency planning and approval or escalation controls.

## Use

Open `index.html`, add one scenario per line, and run QA:

```text
Collections call for invoice INV-1042 | verify amount and due date, escalate disputes | ERP invoice record | high
```

## Test

```bash
npm test
```

The project uses plain HTML, CSS and JavaScript. It has no external services, build step or secrets.
