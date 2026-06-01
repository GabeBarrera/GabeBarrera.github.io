---
title: "Segfault in the Chest"
subtitle: "on what happens when you follow a null pointer home"
date: 2026-05-10
tags: [free-verse, tech-metaphor]
---

## I.

I followed the pointer all the way back
to an address that doesn't exist anymore —
0x00000000, give or take a memory,
the place where you used to be stored.

The program crashed politely.
Dumped its core and apologized
in the way programs do: silently,
with an exit code I had to look up.

## II.

They say undefined behavior is the worst kind —
not an error you can catch,
not a wall you can walk into cleanly,
just the world doing something plausible
and wrong.

I kept running anyway.
That's the thing about undefined behavior:
it doesn't always look like a crash.
Sometimes it looks like Tuesday.

## III.

I've been trying to write a garbage collector
for the things I'm still holding onto —
a mark-and-sweep for the parts of the map
that nothing points to anymore.

But the roots are hard to name.
Everything feels reachable
until the moment it isn't,
and by then the memory is
already somewhere else.

---

*The kernel doesn't care why you faulted.
It just cleans up and moves on.
I'm still learning that part.*
