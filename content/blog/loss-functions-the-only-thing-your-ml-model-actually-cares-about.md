---
title: "Loss Functions: The Only Thing Your ML Model Actually Cares About"
date: 2026-08-30
description: "Complicated-sounding names hiding embarrassingly simple ideas"
cover_image: "/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-b556524b3e.jpeg"
emoji: "📄"
tags: ["substack"]
draft: false
substack_id: "https://nerdingoutwithshriya.substack.com/p/loss-functions-the-only-thing-your"
---
While going deep into ML and neural networks, I kept running into this one idea over and over again: **loss functions**. And man, intuition has never been more important than here. You can memorize ten formulas, but if you don’t *feel* why each one exists, you’ll forget them in a week. So this is me trying to write it down in the simplest, most “explain it to future-me” way possible so that even if I forget everything else, I can read this and go “oh yeah, right” in five minutes.

Let’s get into it.

---

## First, what even *is* a loss function?

A loss function is just a number that answers one question: **“How wrong was the model, right now, on this example?”**

That’s it. Big number = very wrong. Small number = pretty close. Zero = perfect. The entire point of training a neural network is: compute this “wrongness number,” then nudge the model’s weights a tiny bit in the direction that makes the number smaller. Do that a million times, and the model gets good.

The part that actually matters for building intuition is that **“wrong” means different things depending on what you’re trying to do.** Being wrong in a “pick one class out of ten” problem is not the same kind of wrong as being wrong in a “how far apart should these two faces be in embedding space” problem. That’s why there are so many loss functions. Each one is just a different definition of “wrong” tailored to a different kind of task.

---

## 1. Cross-Entropy: the bread and butter of classification

This is the one everyone meets first, so let’s start here.

Imagine you’re guessing which of 10 classes an image belongs to (cat, dog, car, etc). Your model spits out 10 numbers. Cross-entropy loss basically says: **“How confident were you in the** ***correct*** **answer, and punish you (logarithmically) for not being confident enough.”**

If the model was 99% sure of the right answer → tiny loss. If the model was 1% sure of the right answer → huge loss.

The nasty bit is the **log**: getting it slightly wrong isn’t punished much, but being *confidently* wrong gets punished brutally. That’s on purpose, you want the model to be terrified of confident mistakes.

[![](/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-b556524b3e.jpeg)](https://substackcdn.com/image/fetch/$s_!8NyP!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fe88e554b-6569-4f2a-96ee-9f6f8708b0e6_1708x443.jpeg)

Now, there’s a fork in the road depending on the *type* of classification problem, and honestly this fork is the thing I used to mix up the most:

* **Categorical Cross-Entropy (a.k.a. “Softmax Loss”):** Use this when exactly **one** answer is correct out of many options like say for eg a photo is a cat OR a dog OR a bird, never more than one. Softmax first turns your raw scores into a probability distribution that sums to 1 (like slicing a pizza, the classes are literally competing for slices), and cross-entropy scores how much pizza went to the right slice.

  [![](/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-6d63998154.jpeg)](https://substackcdn.com/image/fetch/$s_!xazh!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff84aec43-b1e8-4ccc-9421-101424a42649_1631x1180.jpeg)
* **Binary Cross-Entropy (a.k.a. “Sigmoid Loss”):** Use this for yes/no problems, or, for **multi-label** problems where several things can be true at once (a photo has a cat AND a ball AND a person in it). Here you don’t do one big pizza-slicing competition. Instead, each label gets its *own* independent yes/no sigmoid question, and you just sum up the log-loss across all of them.

  [![](/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-534f1b75c5.jpeg)](https://substackcdn.com/image/fetch/$s_!Neg9!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F20f1f482-0f35-4321-ab58-8d63ab964826_1601x366.jpeg)

  **The one-liner that fixed this for me:** *Softmax asks “which ONE is it?” Sigmoid asks “is THIS one true, independently of the others?”*
* **Weighted Cross-Entropy:** Same idea, but if your dataset is lopsided (say 950 “no fraud” examples vs 50 “fraud” ones), you multiply the rare class’s loss by a bigger weight so the model can’t just get lazy and always guess the majority class.

---

## 2. KL Divergence : “how far off is my guess-distribution from reality?”

Okay, this one sounds scary but it’s actually a pretty intuitive idea once you strip the notation away.

Say there’s a **true** distribution of something (like, “80% of emails are spam, 20% are not”) and your model produces a **predicted** distribution (”I think it’s 60% spam, 40% not”). KL Divergence is just a number that says **how different these two distributions are.**

[![](/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-f731b1f405.jpeg)](https://substackcdn.com/image/fetch/$s_!I4U5!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb0af93a3-0986-4154-96cf-c22a8f0c5668_1905x836.jpeg)

Here’s the intuition: cross-entropy = entropy (a fixed baseline “surprise” cost of the true distribution) + KL divergence (the *extra* surprise cost you pay because your guess wasn’t perfect). So when you’re minimizing cross-entropy during training, you are ,behind the scenes, literally minimizing KL divergence, because the entropy part is a constant you can’t do anything about anyway.

Two quirks worth remembering:

1. **It’s not symmetric.** The “distance” from P to Q is not the same as from Q to P. It matters which one you call “the truth.” Kind of like how “how far is the gym from your house” and “how far is your house from the gym” *feel* symmetric in real life, but here they aren’t mathematically — because you’re weighting the distance by *whose* probabilities you trust as the ground truth.
2. **It can blow up to infinity.** If the true distribution says “this thing definitely happens” but your model says “impossible, 0% chance” — that’s an infinite penalty. Makes sense: if reality assigns probability to something you swore was impossible, your model deserves to be infinitely embarrassed.

That “blows up to infinity” problem is annoying enough in practice that people invented a fix:

### Jensen-Shannon (JS) Divergence : the symmetric, well-behaved cousin

Instead of comparing P directly to Q (and risking asymmetry / infinities), JS divergence says: let’s create an **average distribution M** of the two, and then measure how far *both* P and Q are from that middle-ground M, and average those two measurements.

It’s like: instead of asking “how far is your opinion from mine,” you both agree on a neutral halfway point, and measure how far each of you is from that halfway point. Much more fair, always symmetric, and never explodes to infinity. Great for comparing things like two documents’ word-frequency distributions, or clustering similar data points.

[![](/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-43edae7c08.jpeg)](https://substackcdn.com/image/fetch/$s_!jnu9!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fdc6b6c7f-ad18-4d0d-89ba-0f4a445fced1_1164x667.jpeg)

---

## 3. Focal Loss : for when your dataset is embarrassingly lopsided

Imagine a fraud detection dataset with **950 normal transactions** and **50 fraudulent ones**. With regular cross-entropy, the model spends most of its time learning from the hundreds of easy, normal examples because they dominate the dataset. As a result, it doesn’t pay enough attention to the rare but important fraud cases.

**Focal Loss fixes this by making the model focus on the mistakes instead of the easy wins.**

* If the model is **already confident and correct**, the loss is reduced significantly. The model essentially says, *“I already know this.”*
* If the model is **wrong or uncertain**, the loss remains high, encouraging the model to learn from that example.

The **γ (gamma)** parameter controls how strongly easy examples are down-weighted:

* **γ = 0** → Same as regular Cross-Entropy Loss.
* **Higher γ** → The model focuses more on hard, misclassified examples.

  [![](/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-9c9415f577.jpeg)](https://substackcdn.com/image/fetch/$s_!onGA!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F44778c2c-8262-4e2d-b8f2-c882d8feddc0_992x649.jpeg)

An optional **α (alpha)** parameter can also be used to give extra importance to the minority class.

[![](/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-4f246c5d8b.jpeg)](https://substackcdn.com/image/fetch/$s_!Loov!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F1afadcc5-a048-4c32-a149-acc291f21738_1092x707.jpeg)

As shown in the graph, **higher values of γ (gamma)** make the loss drop much faster for easy examples (high confidence), while **hard examples continue to contribute a large loss**. In other words, increasing γ makes the model pay progressively more attention to difficult samples.

**In short:** Focal Loss tells the model, **“Stop spending time on examples you’ve already mastered. Focus on the difficult and rare ones.”**

It is widely used in **object detection, medical imaging, and fraud detection**, where important examples are rare but missing them can be costly.

---

## 4. Hinge Loss & SVMs — “correct isn’t good enough, I want *confidently* correct”

This one has a genuinely fun mental image attached to it: think of a hinge on a door. A door swings freely one way, but the hinge stops it dead the other way. Hinge loss behaves the same: **it goes to exactly zero once you’re “good enough,” and stays zero no matter how much** ***more*** **good you get. But if you’re not good enough, the penalty keeps climbing.**

Concretely, for SVMs: L=max(0, 1−y⋅f(x))

Three scenarios:

* You’re correctly classified **and** comfortably far from the decision boundary → loss = 0. Nice, done, no more homework.
* You’re correctly classified but **too close for comfort** to the boundary → you still get a small positive penalty. Hinge loss doesn’t just want “correct,” it wants “correct with breathing room.”
* You’re straight-up misclassified → big loss, growing the more wrong you are.

[![](/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-a72bc8bcd2.jpeg)](https://substackcdn.com/image/fetch/$s_!vvsD!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5a2c09bb-22a2-4357-b1a4-7f6b377739b0_1350x660.jpeg)

This is *the* key difference from cross-entropy: cross-entropy keeps rewarding you infinitesimally more the more confident you get (there’s no ceiling). Hinge loss says “once you’ve cleared the margin, I genuinely do not care anymore — go help train on a different example.”

That’s exactly what makes SVMs work: they minimize a mix of (a) keeping the margin as wide as possible, and (b) keeping hinge-loss violations small, balanced by a regularization knob **C**. Wide margin = more confident, generalizable separation between classes.

There’s also **squared hinge loss**, which is the same idea but squared — giving you a smoother curve that’s a bit friendlier for optimizers to work with.

---

## 5. Contrastive Loss & Triplet Loss — “learn to measure similarity, not categories”

Here’s a shift in mindset: sometimes you don’t want to classify things into buckets at all. You want to learn a *space* where similar things end up close together and different things end up far apart. Classic example: face recognition. You’re not trying to say “this is person X’s face, class B” — you’re trying to say “these two photos are the same person” without needing a fixed list of every person who will ever exist.

### Contrastive Loss

You feed the network **pairs** of things, each labeled either “similar” or “dissimilar.”

* If the pair is **similar** → just directly shrink the distance between their embeddings. Push them together, no exceptions.
* If the pair is **dissimilar** → push them apart, but only up to a margin. Once they’re far enough apart, stop pushing — don’t waste effort making already-distant things *even more* distant.

It’s basically hinge-loss logic applied to distances instead of classification scores.

[![](/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-6438136ca6.png)](https://substackcdn.com/image/fetch/$s_!DqXc!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F387cba63-2f4d-45f9-ae36-dc6bcd8b2912_922x547.png)

### Triplet Loss

Took me quite some time to understand the difference between this and contrastive losses. Instead of pairs, you use **three** things at once: an **anchor** (some reference example), a **positive** (same identity/class as the anchor), and a **negative** (different identity/class).

In plain English: *“I want the anchor to be closer to its positive match than to its negative match, by at least some safety margin.”* It’s a relative comparison, not an absolute “shrink to zero” rule — which is why it tends to organize the embedding space more gracefully. It doesn’t obsessively crush same-class points into a single point; it just makes sure they stay closer than the different-class stuff, with room to breathe.

[![](/images/blog/loss-functions-the-only-thing-your-ml-model-actually-cares-about-cff9cf42a5.png)](https://substackcdn.com/image/fetch/$s_!QXxb!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F3fe4b7cc-8275-4d36-8d82-97204a5f8846_341x341.png)

If I had to summarize the difference in one line: **contrastive loss judges pairs in isolation (”are you two close enough / far enough?”), while triplet loss judges relative ranking (”are you closer to your friend than to a stranger?”)** — and that relative framing is why triplet loss tends to behave better in practice, especially for things like face recognition.

---

## 6. Activation functions — the reason “differentiability” even matters

Quick zoom-out: none of these losses are useful unless we can actually compute a *gradient* through the entire network — loss all the way back to every single weight. That chain of derivatives has to flow through whatever activation functions you used. If an activation function has a gradient of zero (or undefined) almost everywhere, the chain snaps and learning just... stops.

Here’s the activation “family tree,” rated on how training-friendly they are:

* **Step function** (old-school, output is a hard 0 or 1): basically useless for training. Its derivative is zero everywhere except one undefined point. No gradient = no learning. Historical footnote at this point.
* **Linear/identity**: perfectly differentiable, but has zero personality — no non-linearity. Stack ten linear layers and mathematically it collapses into being just *one* linear layer. You gain nothing from depth.
* **Sigmoid**: squashes to (0,1), great for probabilities, smooth gradient — but the gradient vanishes for big positive/negative inputs. In a deep network, tiny gradients multiplied across many layers shrink to basically nothing, and early layers stop learning. This is the infamous “vanishing gradient problem.”
* **Tanh**: same idea as sigmoid but squashes to (-1,1) and is zero-centered, which helps a bit, and its gradient is steeper. Still has some vanishing-gradient issues, just less severe.
* **ReLU** : the modern default for hidden layers. Dead simple, cheap to compute, and for positive inputs the gradient is a constant 1 — no vanishing. Downside: negative inputs get a gradient of exactly zero, so a neuron can get permanently “stuck” and stop learning (”dying ReLU”).

**Rule of thumb for picking activations:**

* **Hidden layers** → ReLU, basically by default, unless you have a specific reason not to.
* **Output layer** → depends entirely on the task:

  + One correct class out of many → **softmax**
  + Multiple independent correct answers → **sigmoid**
  + Predicting a continuous number (regression) → **linear** (no squashing at all)

---

## 7. The magic simplification: softmax + cross-entropy

Okay, this is the part that genuinely made me go “whoa” when I first worked through the math, so I want to preserve that feeling here.

Softmax’s derivative, on its own, is honestly kind of a pain — every output probability depends on *every* input logit (because they all share the same normalizing denominator), so you end up with a full matrix of cross-dependencies (a Jacobian) instead of a single simple number.

BUT — when you chain that softmax derivative together with the cross-entropy loss derivative and do the algebra, almost everything cancels out, and you’re left with this absurdly clean result:

∂L/∂z=p−y

**The gradient is just (predicted probability) minus (true label).** That’s it. No exponentials, no matrices, no mess. If the model predicted 0.9 probability on the correct class, and the true label is 1, the gradient is $0.9 - 1 = -0.1$ — small and gentle, because it’s already close. If it predicted 0.2 on the correct class, the gradient is 0.2 - 1 = -0.8 — a big, aggressive nudge, because it’s way off.

This is exactly why softmax + cross-entropy is the go-to combo for classification: not just because it’s intuitive (which it is), but because the math turns out to be almost efficient to compute. No neural network library ever actually builds the full softmax Jacobian during training — it just computes `prediction - label` and moves on.

---

If future-me forgets everything else: **every loss function is just a different, purpose-built definition of “how wrong were you,” and the whole game is making sure that definition is both meaningful for your task and differentiable enough for gradient descent to act on.**

[Subscribe now](https://nerdingoutwithshriya.substack.com/subscribe?)
