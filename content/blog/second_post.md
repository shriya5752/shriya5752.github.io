---
title: "how google docs lets 100 people type at once (without everything exploding)"
date: 2026-02-17
description: "the surprisingly elegant engineering behind real-time collaboration"
cover_image: "/images/blog/gdocs.png"
emoji: "📝"
tags: ["tech", "distributed systems", "engineering"]
draft: false
---

somewhere in google's infrastructure, right now, thousands of people are typing into the same documents simultaneously. cursors flying, edits overlapping, nobody waiting for anyone else. and somehow — through what looks like pure coordination magic, everyone ends up with the same document.

it's one of those things that feels obvious until you try to explain how it works. then it gets interesting fast.

i started pulling on this thread after a perfectly ordinary tuesday afternoon where a friend and i typed over each other in a shared doc and nothing broke. that shouldn't be as hard as it is. here's why it is, and how google solved it.

---

## first, let's appreciate why this is hard

the obvious fix is to **lock the document** — one person edits, everyone else waits. works fine when edits are infrequent. in a live doc with twenty people typing simultaneously, it's unusable. collaboration, but make it a hostage situation.

option two: **last write wins**. everyone types freely, but on conflict, whoever committed most recently overwrites everything else. this is the default in plenty of sync tools today — and it's not just annoying, it's a data loss bug dressed up as a feature.

option three: broadcast the full document to the server on every keystroke. technically consistent, completely impractical. every period you type, a 40-page thesis hits the wire.

each of these fails for the same reason: they treat the document as a monolithic blob instead of what it actually is — a sequence of independent, composable changes. that reframing is the insight that makes everything else possible.

---

## the real thing: operational transformation

the foundational idea is called **Operational Transformation**, first described by ellis and gibbs in 1989 in a paper on a collaborative editor called GROVE. google didn't invent it — they just built the infrastructure to run it at planetary scale. classic google, really.

instead of treating a document as a file you open, edit, and save, OT treats it as a **live sequence of discrete operations**. every change is a precise, structured action: *insert "hello" at position 5*, *delete characters 10–15*, *bold range 22–34*.

when you press a key, google docs wraps that keystroke in an operation, applies it locally so your screen feels instant, and fires it to their servers. your collaborator's machine does the same thing simultaneously. now two operations arrive at the server with no knowledge of each other.

here's the problem: if user A inserts a word at position 10 and user B deletes a character at position 8, applying A's operation first shifts all the positions B was targeting. apply them naively and the document goes rogue — different users see different text.

the server maintains a **Transformation Function** that adjusts one operation relative to the other. A's insert at position 10 becomes position 9 after accounting for B's delete. the math ensures every client converges to the same final state regardless of arrival order — a property called **Convergence**.

> implementing this correctly across all possible operation pairs and network conditions is notoriously hard. researchers spent two decades patching edge cases. turns out making every combination of human typing decisions play nice is, who knew, complicated.

---

## you'll hear about CRDTs. here's the real story.

five minutes into this rabbit hole and you'll hit **CRDTs** — conflict-free replicated data types, from distributed systems research at INRIA in the late 2000s. operations are designed to be **Commutative and Associative** — apply them in any order, on any device, no server needed, they always converge. pure peer-to-peer.

sounds like a strict upgrade. so why does google still run OT?

CRDTs are digital hoarders. every deletion is still sitting in the data structure, marked as a tombstone, just in case a late operation needs to reconcile against it. over months of heavy editing that metadata compounds into something opaque and difficult to compact without breaking the guarantees. you wanted a document. you got a document plus the ghosts of every edit ever made.

OT is more compact, handles character-level precision that prose demands, and has been in google's production long enough that its edge cases are well-patched.

CRDTs shine elsewhere. **Figma** uses a CRDT-inspired approach for canvas objects — rectangles, frames, components — because design objects have discrete, independent properties. move a rectangle and change its color simultaneously? different properties, no conflict, both changes survive. that simplicity works great for design. it'd be a disaster for prose, where inserting a word at position 5 invalidates every positional reference downstream.

> the right algorithm is determined by the shape of your data.

but there's something worth sitting with here. CRDTs don't need a central server. OT does. a world where google docs ran on CRDTs would be a world where your document could theoretically sync peer-to-peer — without google's infrastructure ever touching it. infrastructure choices at this scale are never purely technical. they're decisions about who sits at the center of the system.

---

## version history is basically a freebie

hit *file → version history* and there's a complete, timestamped record of every edit ever made — who typed what, going back to the first keystroke. equal parts useful and mildly unsettling.

this isn't a separate archival system. it's a direct structural consequence of OT.

the pattern is called **Event Sourcing** — instead of storing current state, you store the sequence of events that produced it. the document is just a projection: a replay of every operation from the beginning. less "saved file," more "very detailed confession."

under OT, every operation is already being logged to a server-side journal to sequence concurrent edits. google keeps that journal. version history is just a clean, human-readable window into it — grouped by user, bucketed by time. the infrastructure was already there.

---

## those colored cursors are a completely different system

those floating cursors with your collaborators' names have nothing to do with document sync. they're a separate mechanism entirely — which, given how much the sync system is already doing, seems fair.

it's called **Presence**, and it runs over **WebSockets** — a protocol that keeps a persistent, full-duplex connection open between your browser and google's servers. unlike a standard HTTP request, which opens, exchanges data, and closes, a websocket stays open indefinitely. think less "exchanging letters," more "leaving a call on all day."

every cursor move fires a compact position event: "user X is at paragraph Y, offset Z." the presence server fans it out to every other client instantly. text selections work the same way — broadcast start and end positions, render the highlight.

presence is deliberately decoupled from OT sync for one reason: **different performance requirements**. OT needs to be *correct*. presence needs to be *now*. running them on separate channels means neither can slow the other down.

---

## offline? the system was designed for this

google docs keeps accepting edits when you lose wi-fi. nothing freezes, no error, no drama. it's giving "everything is fine" energy while your router throws a fit in the other room.

the OT client simply switches to local mode. operations queue in your browser's storage instead of going to the server. your screen stays current because state is updated optimistically.

when connectivity returns, the sync engine flushes the queue. the server reconciles your offline operations against whatever others did in the meantime, pushes the result back, and the document converges. your edits are preserved — the queue held everything.

> this pattern is called **Optimistic Replication** — the same principle behind how notion, linear, and figma handle spotty connections. the bet: conflicts are rare enough that assuming a clean merge and correcting exceptions beats blocking all edits on server confirmation. optimism, it turns out, is a valid distributed systems strategy.

---

## what's actually going on

four well-understood ideas, composed carefully and run at scale:

- **operational transformation** — concurrent edits, same final document, every time
- **event sourcing** — turns the OT log into complete rewindable history as a side effect
- **websockets** — keep cursor presence instant, fully separate from sync
- **optimistic replication** — makes the whole thing seamless across any network condition

none of these are new. what google built wasn't a novel algorithm — it was infrastructure capable of running them reliably at billions of operations per day, without most users noticing the machinery underneath. the best engineering usually works that way.

next time you and a collaborator land on the same sentence and both your edits survive know that a server quietly ran a transformation function, adjusted two conflicting operations into compatible ones, and distributed the result in under a hundred milliseconds.

not magic. just really good engineering. which is more impressive anyway.