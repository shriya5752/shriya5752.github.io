---
title: "Why Your Neural Network Forgets: RNNs, and the Notebooks That Fixed Them"
date: 2026-09-01
description: "writing this because I didn't actually understand it until I tried explaining it"
cover_image: "/images/blog/why-your-neural-network-forgets-rnns-and-the-notebooks-that-fixed-them-57826d5192.png"
emoji: "📄"
tags: ["substack"]
draft: false
substack_id: "https://nerdingoutwithshriya.substack.com/p/why-your-neural-network-forgets-rnns"
---
Say you’re reading a novel. By chapter 12, you still remember that the protagonist’s sister died in chapter 2 , that detail shapes how you read everything after it. Now imagine trying to build a machine that reads text (or any sequence audio, stock prices, sensor data) the same way: taking in one piece at a time, while carrying forward the context it needs from everything it’s already seen.

That’s the job of a **Recurrent Neural Network (RNN)**. And it turns out RNNs are surprisingly bad at exactly this, remembering things over long stretches. Understanding *why* they fail, and how two elegant fixes (LSTM and GRU) solved it, is one of the more satisfying rabbit holes in deep learning.

## What an RNN actually does

A regular neural network takes one input and produces one output — no memory involved. An RNN is different: at every timestep, it takes the current input *and* whatever it remembers from before, and produces both an output and an updated memory to pass forward.

This lets RNNs handle sequence problems that come in different shapes:

* **One-to-many**: a single input maps to a sequence of outputs. Image captioning is the classic example — one image in, a whole sentence out (”Boy is running”).
* **Many-to-one**: a sequence collapses into a single output. Sentiment analysis — a whole sentence in, one label out (positive/negative).
* **Many-to-many**: a sequence maps to another sequence, often of different length. Machine translation — “How are you” (3 words) becomes a sentence of a different length in another language.

To train an RNN, you use a technique called **Backpropagation Through Time (BPTT)** — essentially, you unroll the network across every timestep and propagate the error backward through all of them to update the weights.

And this is exactly where things start to break.

## The problem: gradients that vanish or explode

Here’s the issue. When you backpropagate through many timesteps, the gradient at any given step is computed by *multiplying together* a long chain of terms — one for every timestep in between. Each of those terms is bounded (roughly) by the network’s activation function and its weights.

If those terms are consistently a little less than 1, multiplying dozens of them together shrinks the gradient toward zero — this is the **vanishing gradient problem**. Early timesteps essentially stop receiving any learning signal, which means the network can’t learn dependencies that span more than a handful of steps. It’s like trying to remember chapter 2 by chapter 50 — the signal just fades out.

If those terms are consistently a bit more than 1, the opposite happens: the gradient blows up exponentially — the **exploding gradient problem**. Training becomes unstable and the model diverges.

[![](/images/blog/why-your-neural-network-forgets-rnns-and-the-notebooks-that-fixed-them-57826d5192.png)](https://substackcdn.com/image/fetch/$s_!nYYA!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fe446143c-be19-4871-8b53-f486d9cfea5a_797x478.png)

Both problems trace back to the same root cause: **repeated multiplication through time**.

There are a couple of quick fixes people tried:

* **Truncated BPTT** — only backpropagate a limited number of steps instead of the whole sequence. Cheaper, but blind to anything beyond that window.
* **Gradient clipping** — cap the gradient at a threshold so it can’t explode. Helps with exploding gradients, does nothing for vanishing ones.

Neither of these is a real fix. The real fix required rethinking the architecture itself — which is where LSTM and GRU come in.

## The fix: stop multiplying, start adding

The key insight behind both LSTM and GRU is deceptively simple: **if repeated multiplication is what destroys the gradient, replace it with addition.**

Addition lets gradients flow backward through many timesteps largely intact, instead of being forced through a long chain of shrinking multiplications. Everything else in these architectures — the gates, the extra states — exists to support that one idea.

## LSTM: a notebook with three rules

**Long Short-Term Memory (LSTM)** networks keep two things at every step:

* A **notebook** (the *cell state*) — long-term memory where important information gets written down and carried forward.
* A **spoken summary** (the *hidden state*) — what the network would actually output right now, if asked.

At each new timestep, an LSTM cell asks three questions, using gates (small neural layers that output a value between 0 and 1, acting like a dial — 0 blocks, 1 lets everything through):

1. **Forget gate** — “What should I erase from my notebook?” It looks at the new input and decides which parts of the old memory are no longer useful.
2. **Input gate** — “What new information is worth writing down?” It looks at the new input and decides what to add to the notebook.
3. **Output gate** — “What should I actually say out loud right now?” It looks at the updated notebook and decides what part of it is relevant to expose immediately — not everything remembered needs to be said right away.

The heart of it is this equation, which updates the notebook:

**Cₜ = fₜ · Cₜ₋₁ + iₜ · C̃ₜ**

[![](/images/blog/why-your-neural-network-forgets-rnns-and-the-notebooks-that-fixed-them-7cbbcd40ef.jpeg)](https://substackcdn.com/image/fetch/$s_!wc41!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fe626bed9-cba0-442d-a10d-f2869433b6f1_1874x828.jpeg)

***how much of the old memory to keep + how much new memory to add***. That’s an addition, not a multiplication — which is exactly why gradients can flow backward through many timesteps without vanishing.

---

## GRU: the lighter, faster notebook

**Gated Recurrent Units (GRU)**, introduced a few years after LSTM, ask: can we get similar benefits with less machinery? GRU simplifies the design in two ways:

* It **merges the notebook and the spoken summary into one single memory** — no separate long-term/short-term split.
* It uses **two gates instead of three**:

  + **Reset gate** — “How much of my past notes should I even consider while thinking about this new input?”
  + **Update gate** — “Should I stick with my old summary, or lean into new information?” — a sliding blend, not an all-or-nothing switch.

    [![](/images/blog/why-your-neural-network-forgets-rnns-and-the-notebooks-that-fixed-them-508a3a370c.jpeg)](https://substackcdn.com/image/fetch/$s_!-TrR!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F55ca5860-06e7-42e5-b0ac-ee3d5003cabb_1412x890.jpeg)

The update step looks like this:

**hₜ = (1 − zₜ) · hₜ₋₁ + zₜ · h̃ₜ**

Same principle as LSTM — an addition (technically an interpolation) between old memory and new candidate content, not a multiplicative chain.

## The two, side by side

LSTM GRU Memory Two states: cell state + hidden state One state: just the hidden state Gates Three: forget, input, output Two: reset, update Feel A careful editor with separate drafts A quick note-taker blending as it goes Parameters More Fewer — faster to train Best for Complex, long-range dependency tasks Simpler tasks or limited data, where speed matters

## The one idea to take away

A plain RNN forgets things because it dilutes its memory a little at every single step ,like watering down a drink over and over until, fifty steps later, there’s nothing left of the original. LSTM and GRU fix this by *topping the drink back up* at each step instead of only ever diluting it and that is by using addition, not just multiplication, to carry memory forward.

That one shift from purely multiplicative updates to additive ones is the entire reason these architectures can remember things over long sequences, and it’s the idea worth holding onto if you remember nothing else from this post.

[Subscribe now](https://nerdingoutwithshriya.substack.com/subscribe)
