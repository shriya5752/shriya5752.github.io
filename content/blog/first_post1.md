---
title: "understanding shells & commands: because i was lost too (part1)"
date: 2026-02-05
description: "a beginner's guide to the terminal — starting from the actual beginning"
cover_image: "/images/shell.jpg"  
emoji: "🖥️"
tags: ["tech", "linux", "beginner", "terminal"]
draft: false
---


<a href="https://www.notion.so/Understanding-Shells-Commands-Because-I-Was-Lost-Too-2f42da7f7c25805383b2e2068ea1ca0b" target="_blank" class="notion-btn">
  read on notion ↗
</a>




look, i'll be honest — i spent way too long just copying and running commands without actually understanding what was happening. everyone around me seemed to know what they were doing in the terminal, and i just... didn't. i'd paste commands, pray they worked, and move on.

the problem? nobody actually explains what a shell *is* before throwing you into it. we all start learning python or java or whatever, and suddenly professors are like "yeah just cd into this directory and run this" and you're sitting there like... what's cd? what's a directory? why does this black window exist?

so i decided to actually figure this out. and guess what? once you understand the basics , like actually understand them , everything clicks. you stop feeling like you're blindly typing magic words and start feeling like you know what you're doing.

this is basically what i wish someone had shown me on day one. we're starting from the actual beginning: what is a shell, what's the difference between a terminal and a command prompt, and why should you care. no assuming you already know stuff. no complicated jargon without explanation.

**if you've ever felt lost in the terminal, this is for you. let's fix that gap together.**

---

## part 1: why does this black window even exist?

when you open CMD, PowerShell, or a terminal, you're not opening "coding mode."

you're opening a **shell** — a program that lets you talk directly to your operating system using text commands instead of clicks. that's it.

instead of clicking buttons, you type commands. you're giving instructions to your OS:

- "show me files"
- "go into this folder"
- "run this program"

every operating system has a shell. **windows** has CMD and PowerShell. **linux** has shells like bash and zsh. same idea, different languages.

---

## then what is a terminal?

a **terminal** is just the window.

think of it like this:

- **shell** → the language
- **terminal** → the place where you type it

the terminal itself does nothing smart. it just displays text and sends what you type to the shell running inside it. different shells can run in the same terminal.

---

## the catch

most programming tools, servers, and real-world systems are built on **linux**.

so when someone says:

> "just cd into the directory and run this"

they're assuming you're in a linux shell, even if they never say it out loud.

that gap — *what shell am i even in?* — is what confuses beginners. you can't magically make CMD understand linux commands. but you **can run linux inside windows**. that's exactly what **WSL (windows subsystem for linux)** does — a real linux environment inside windows, no dual boot, no virtual machine, no OS reinstall.

---

## running linux on windows

open **powershell as administrator** and run:
```bash
wsl --install
```

it'll install WSL and ubuntu in one go. it'll ask you to set a password and while typing it, you won't be able to see it. that's normal, just keep typing.

![WSL install running in PowerShell](/images/blog/wsl-install.png)

once setup finishes, search **ubuntu** in the start menu and open it. run this to confirm linux is running:
```bash
uname -a
```

if it shows a version string like this, you're ready to go:

![uname -a output confirming Linux is running](/images/blog/uname-output.png)

---

## okay so now you're in. now what?

you'll see a prompt that looks something like `username@computername:~$` this is just telling you who you are, what machine you're on, and where you are in the file system.

the most common shell is called **bash** (which stands for "bourne again shell" — don't ask, it's a unix history thing). when you opened ubuntu, you're already using bash. that prompt you see? bash waiting for you to tell it what to do.

let's try some simple commands just to get comfortable.

---

### `date` — what time is it?
```bash
date
```

hit enter. it shows you the current date and time. you just told your computer to run a program called `date` and it did its job.

---

### `whoami` — who am i?
```bash
whoami
```

prints your username. simple — but it's showing you that when you type a command, the computer runs a program and gives you output.

---

### `man` — your best friend

this is probably **the most important command** you need to know. `man` stands for "manual", help documentation for every command.
```bash
man date
```

a page pops up explaining everything about `date`. use arrow keys to scroll, press `q` to quit.

![the man date manual page](/images/blog/man-date.png)

> whenever you see a command and think "what does this do?" — just type `man command-name`. it's dry and technical, but it has all the answers.

some commands also support `--help` for a quicker summary:
```bash
date --help
```

---

### `echo` make the computer repeat stuff

stupidly simple — it just prints whatever you tell it to.
```bash
echo hello
```

it prints `hello`. that's literally all it does. but here's where it gets interesting:

![echo hello and echo hello world demo](/images/blog/echo-demo.png)

try this:
```bash
echo "hello world"
```

see how i put quotes around "hello world"? if you don't, the shell treats each word separately. watch what happens without quotes:
```bash
echo hello            world
```

the output comes back with just one space! the shell splits your command by whitespace, so it sees three things: the command `echo`, first argument `hello`, second argument `world`. all those extra spaces get ignored — `echo` prints them with a single space between.

---

## where am i? (navigation basics)
```bash
pwd
```

"print working directory" - tells you your current location. you'll probably see something like `/home/yourusername`.

want to see what's in this directory?
```bash
ls
```

lists all files and folders. now let's move around:
```bash
cd /
```

`cd` means "change directory." `/` is the root of your entire file system. type `ls` again — you'll see folders like `bin`, `home`, `usr`, `etc`. these are the core folders of your linux system.

to go back home:
```bash
cd ~
```

the `~` is shorthand for your home directory. you'll use this constantly.

---

## understanding paths

when you type `cd /home/username`, that's an **absolute path** — starts from root (`/`) and gives the full route.

you can also use **relative paths**. if you're already in `/home` and want to go to `/home/username`, just type `cd username`. no `/` at the start means it's relative to where you currently are.

two special shortcuts:

- `.` → this directory (where i am right now)
- `..` → parent directory (one level up)

![cd, pwd, ls navigation demo](/images/blog/navigation.png)

---

## working with files

![touch, cat, echo file commands demo](/images/blog/working-files.png)
```bash
touch filename.txt        # creates an empty file
ls                        # lists files in current directory
echo "text" > file.txt    # puts text into a file (overwrites)
cat file.txt              # reads and prints what's inside
echo "text" >> file.txt   # adds text to a file (appends)
```

- `>` → redirect and overwrite
- `>>` → redirect and append

---

## how does the shell even find these commands?

you've been typing `echo` and `ls`,  but where do these programs actually live?

the shell has a cheat sheet called **`$PATH`**.
```bash
echo $PATH
```

you'll see something like `/usr/local/bin:/usr/bin:/bin`, directories separated by colons. when you type a command, the shell hunts through these folders in order until it finds a program with that name.

![echo $PATH, which ls, and cat file demo](/images/blog/path-cat.png)

want to see exactly where a command lives?
```bash
which ls
```

it'll say `/bin/ls` — the actual file that runs when you type `ls`. you can even run it by full path:
```bash
/bin/echo "Hello!"
```

same result as `echo "Hello!"` but now you're being very specific.

---

## the `-e` flag and why heredocs are better

by default, `echo` treats everything as literal text. if you type `\n`, it prints the characters `\` and `n`. the `-e` flag tells echo to interpret escape sequences:

- `\n` → newline
- `\t` → tab
- `\\` → actual backslash

so `echo -e "line1\nline2"` prints on two lines. but it gets messy fast:
```bash
echo -e "Hello\nThis is my blog\n\nTopic 1\nTopic 2" > myfile.txt
```

ugh. hard to read, hard to edit. there's a much better way — **heredocs**:
```bash
cat <<EOF > myfile.txt
Hello
This is my blog

Topic 1
Topic 2
EOF
```

you write your content *exactly as you want it to appear*. no escaping, no quotes, nothing.

![heredoc cat <<EOF demo](/images/blog/heredoc.png)

the `<<EOF` part is called a **here document**. here's what's happening:

1. `cat` normally reads from a file, but `<<EOF` tells it: "read from right here instead"
2. everything after `<<EOF` until you type `EOF` again is treated as input
3. `> myfile.txt` redirects that output into your file

`EOF` isn't special — you can use any word, just make sure the ending marker is on its own line.

> **why is this better?** readable. consistent across systems. no escaping issues. easy to edit.

---

## piping: where things get cool

most commands read from input and write to output. you can *chain* them using the pipe symbol `|`:
```bash
ls | sort
```

takes the output of `ls` and feeds it into `sort`. remove duplicate lines from a file:
```bash
sort filename | uniq
```

chain as many as you want:
```bash
cat filename | grep "error" | sort | uniq
```

reads a file, finds lines with "error", sorts them, removes duplicates. all in one line.

---

## some more useful commands
```bash
grep "error" filename    # find every line containing "error"
sort filename            # sort lines alphabetically
head filename            # show first 10 lines
tail filename            # show last 10 lines
head -n 5 filename       # show first 5 lines specifically
```

three power tools to know about when you're ready to level up — **`find`**, **`sed`**, and **`awk`**. these are their own little universes. look into them when you're comfortable with the basics.

---

## wrapping up part 1

here's what we've covered:

- **the basics** — what a shell actually is (not magic, just a program)
- **getting started** — running linux on windows with WSL
- **navigation** — moving around with `cd`, `ls`, `pwd`
- **file operations** — creating, reading, and editing files
- **the real magic** — piping and redirection
- **useful tools** — `grep`, `sort`, `head`, `tail`, and why `cat <<EOF` beats `echo -e`


the best part? once you understand how the shell works as a programming language (and it totally is one), you'll stop copying commands and start *thinking* in terminal.

until then, play around. combine commands with pipes. make some files. break things. it's the best way to learn.

