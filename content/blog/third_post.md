---
title: "machine learning: the big picture (before you learn anything else)"
date: 2026-03-13
description: "a complete visual map of the ml landscape — paradigms, algorithms, history, and the mental models that make everything click"
cover_image: "/images/blog/mll.png"
emoji: "🧠"
tags: ["machine learning", "ai", "beginners"]
draft: false
---

Machine learning has always fascinated me. But honestly? The field is so huge that I often felt intimidated, not knowing where to even start. So I made a map.

here's everything i wish someone had shown me on day one.

---

{{< ml-overview >}}

---

## in plain words

everything above, distilled:

**what is ml?** instead of writing rules (`if this, then that`), you show examples and the machine finds the rules itself. that's why it can do things impossible to hand-code — no one knows how to write rules for recognising a face, but a machine can *learn* them from millions of examples.

**the four paradigms** are the four ways a machine can learn: from labelled data (supervised), from structure in unlabelled data (unsupervised), from rewards (reinforcement), or by generating its own labels (self-supervised — the secret behind GPT).

**training** is always the same five-step loop: get data → predict → measure error → calculate gradients → nudge weights. repeat millions of times. every algorithm from linear regression to GPT is a variation on this.

**the nine concepts** — overfitting, bias-variance, gradient descent, regularisation, train/val/test split, embeddings, attention, transfer learning, scaling laws — are the ideas that connect everything. learn those and every specific algorithm clicks faster.

---

## if you're starting off with ML, here's the order that can help you learn 

1. **linear + logistic regression** — learn loss functions, gradient descent, overfitting from first principles
2. **classical ml algorithms** — k-NN, naive bayes, decision trees, SVMs
3. **neural networks from scratch** — backprop, activations, training loops in numpy
4. **CNNs** — vision, convolutions, receptive fields
5. **transformers** — attention, the architecture that runs the world right now
6. **LLMs** — BERT, GPT, fine-tuning, RLHF, the modern stack


---

