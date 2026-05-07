---
title: "Automating Defender with Power Automate"
subtitle: "Wiring incident response to a low-code flow without losing your soul"
date: 2026-03-02
tags: [defender, power-automate, blue-team]
cover: ""
---

# the problem

You wake up. Defender flags 47 alerts overnight. 42 of them are the same noisy false positive from a particular third-party tool. You triage, close, sigh, repeat. By the third week you'd rather grep through dmesg with your bare hands.

The problem isn't the alerts — it's the **toil between alert and action**. Power Automate, for all its enterprise-y reputation, is genuinely good at gluing this gap shut.

## the flow

Here's the high-level shape of what I built:

1. **Trigger**: Defender raises an alert via Graph webhook
2. **Enrich**: pull device, user, and prior-alert context with a Graph query
3. **Score**: a small Azure Function evaluates the alert against a ruleset
4. **Branch**: low confidence → suppress; medium → page on-call; high → auto-isolate device
5. **Log**: everything to a Log Analytics workspace for forensics

```powershell
# the scoring function (simplified)
function Score-Alert {
    param($alert, $context)

    $score = 0
    if ($alert.Severity -eq 'High')              { $score += 40 }
    if ($context.User.RiskLevel -eq 'high')      { $score += 30 }
    if ($context.Device.Compliance -eq 'no')     { $score += 20 }
    if ($alert.Category -in @('Malware','Ransomware')) { $score += 50 }

    if ($context.RecentAlerts.Count -gt 5) { $score += 15 }

    return [pscustomobject]@{
        Score    = $score
        Verdict  = if ($score -ge 70) { 'auto' }
                   elseif ($score -ge 40) { 'page' }
                   else { 'suppress' }
    }
}
```

## what changed

Two weeks in, the numbers told the story:

- **alerts handled by humans**: down ~60%
- **mean time to isolate**: 14 min → 90 sec
- **false-positive close rate**: 71% (the suppressed ones)

> The win wasn't replacing analysts. It was giving them their attention back.

## what to watch out for

Auto-isolation has teeth. The first week I had a flow that quarantined the CFO's laptop because a vendor agent was doing something that *looked* exactly like credential dumping. We added an explicit allowlist for known-good processes, and an "are you sure" Teams ping with a 5-minute escape hatch.

The lesson, as always: **automation amplifies whatever judgment you encoded into it**. Encode carefully.
