---
layout: single
title: "Learning from Self-Generated Outputs: Distillation and Error Recovery"
date: 2026-09-18
last_modified_at: 2026-09-22
description: "These reading notes explore how models learn from their own outputs, and when teacher guidance helps them recover from mistakes."
author_profile: true
permalink: /learning-from-self-generated-outputs/
share: false
related: false
---

These reading notes explore how models learn from their own outputs, and when teacher guidance helps them recover from mistakes.

From GKD to Relay-OPD, my question gradually shifts from learning on the student's own states to learning how to leave an incorrect reasoning path.

## GKD: On-Policy Knowledge Distillation

[On-Policy Distillation of Language Models: Learning from Self-Generated Mistakes](https://arxiv.org/abs/2306.13649) studies knowledge distillation: how to transfer capabilities from a large teacher model to a smaller student model.

It addresses two problems. First, fixed ground-truth or teacher-generated sequences create a **distribution mismatch**: at inference, the student must continue from its own prefixes, including mistakes. Second, a student with limited capacity may struggle to cover the teacher's full distribution under forward KL.

GKD trains on student-generated sequences with token-level teacher feedback and allows alternative objectives, including reverse KL and generalized Jensen–Shannon divergence.

The general objective mixes supervised sequences with on-policy student sequences:

$$
\mathcal{L}_{\mathrm{GKD}}(\theta)
=
(1-\lambda)
\mathbb{E}_{(x,y)\sim(X,Y)}
\left[
\mathcal{D}(p_T\|p_S^\theta)(y\mid x)
\right]
+
\lambda
\mathbb{E}_{x\sim X}
\left[
\mathbb{E}_{y\sim p_S(\cdot\mid x)}
\left[
\mathcal{D}(p_T\|p_S^\theta)(y\mid x)
\right]
\right].
$$

Here, $$p_T$$ and $$p_S^\theta$$ are the teacher and student policies, and $$\lambda$$ controls the fraction of student-generated training data. When $$\lambda=0$$, the objective is fully supervised. When $$\lambda=1$$, it is fully on-policy. The sampling step is not differentiated through.

## SCoRe: Learning to Self-Correct

[Training Language Models to Self-Correct via Reinforcement Learning](https://arxiv.org/abs/2409.12917) studies intrinsic self-correction: a single model first produces an answer and then tries to improve it without external feedback at test time.

Offline SFT on correction traces suffers from **distribution mismatch** as the model's first-attempt mistakes change during training. SFT and naive multi-turn RL can also lead to **behavior collapse**: the model improves its first answer but barely revises its second.

SCoRe uses correctness rewards and a fixed reference policy during training, without a separate teacher or correction model.

### Stage I: Initialize a Non-Collapsed Policy

The first stage rewards the second attempt while strongly constraining the first-attempt policy to remain close to the reference model:

$$
\max_\theta\;
\mathbb{E}_{\substack{x_1,\,y_1\sim\pi_\theta(\cdot\mid x)\\
y_2\sim\pi_\theta(\cdot\mid[x_1,p_1])}}
\left[
\hat r(y_2,y^*)
-
\beta_2 D_{\mathrm{KL}}
\left(
\pi_\theta(\cdot\mid x_1)
\,\|\,
\pi_{\mathrm{ref}}(\cdot\mid x_1)
\right)
\right].
$$

This expands useful second attempts while keeping the first-attempt distribution stable. A smaller default KL penalty is omitted above.

### Stage II: Multi-Turn RL with Progress Reward

The second stage jointly optimizes both attempts and regularizes each turn against the reference policy:

$$
\max_\theta\;
\mathbb{E}_{\substack{x_1,\,y_1\sim\pi_\theta(\cdot\mid x)\\
y_2\sim\pi_\theta(\cdot\mid[x_1,p_1])}}
\left[
\sum_{i=1}^{2}
\left(
\hat r(y_i,y^*)
-
\beta_1 D_{\mathrm{KL}}
\left(
\pi_\theta(\cdot\mid x_i)
\,\|\,
\pi_{\mathrm{ref}}(\cdot\mid x_i)
\right)
\right)
\right].
$$

Optimizing this objective alone may still favor a strong first attempt followed by no meaningful revision. SCoRe therefore adds a progress bonus to the reward of the second attempt:

$$
\hat b(y_2\mid y_1,y^*)
=
\alpha
\left(
\hat r(y_2,y^*)-\hat r(y_1,y^*)
\right),
\qquad \alpha>1.
$$

The second-attempt reward becomes $$\hat r(y_2,y^*)+\hat b(y_2\mid y_1,y^*)$$, rewarding wrong-to-right revisions and penalizing right-to-wrong ones.

## SOD: Step-Wise Distillation for Tool-Using Agents

[SOD: Step-wise On-policy Distillation for Small Language Model Agents](https://arxiv.org/abs/2605.07725) studies tool-integrated reasoning, where the student alternates between reasoning and tool observations. Failed tool calls affect later contexts; accumulated failures can increase student--teacher divergence and make teacher supervision less reliable. SOD responds by adjusting distillation strength at each step instead of weighting the entire trajectory uniformly.

### Measuring Step-Level Divergence

SOD partitions a trajectory into $$K+1$$ model-generated steps. A step is the model response between two tool observations, or the final answer. Tool observation tokens are excluded because they come from the environment rather than the student policy.

For the token positions $$\mathcal{I}_k$$ in step $$k$$, SOD computes the following divergence score:

$$
d_k
=
\frac{1}{|\mathcal{I}_k|}
\sum_{t\in\mathcal{I}_k}
\left|
\log \pi_\theta(y_t\mid y_{<t})
-
\log \pi_{\mathrm{teacher}}(y_t\mid y_{<t})
\right|.
$$

This average absolute log-probability gap is a cheap proxy for step-level mismatch, computed on student-sampled tokens rather than over the full vocabulary.

### Turning Divergence into a Reliability Weight

The first step receives full distillation strength, $$w_1=1$$. Later weights depend on ratios between consecutive divergence scores:

$$
w_k
=
\min\left(
w_1
\prod_{u=1}^{k-1}
\frac{d_u+\epsilon}{d_{u+1}+\epsilon},
\;1+\delta
\right),
\qquad k\ge 2.
$$

Here, $$\epsilon$$ prevents numerical instability and $$\delta$$ caps the maximum amplification. The product telescopes, so the displayed rule is equivalently

$$
w_k=\min\left(\frac{d_1+\epsilon}{d_k+\epsilon},\;1+\delta\right),
\qquad k\ge 2.
$$

The first step provides the baseline: larger later divergence reduces the weight; decreasing divergence restores it, subject to the cap.

### Combining Step-Wise OPD with GRPO

For a student-generated token, the sampled-token OPD term is

$$
\ell_{\mathrm{OPD}}(y_t)
=
\log \pi_\theta(y_t\mid y_{<t})
-
\log \pi_{\mathrm{teacher}}(y_t\mid y_{<t}).
$$

SOD applies the same reliability weight to every model-generated token in a step:

$$
\mathcal{L}_{\mathrm{OPD}}^{\mathrm{step}}
=
\mathbb{E}_{y\sim\pi_\theta}
\left[
\sum_{k=1}^{K+1}
w_k
\sum_{t\in\mathcal{I}_k}
\left(
\log \pi_\theta(y_t\mid y_{<t})
-
\log \pi_{\mathrm{teacher}}(y_t\mid y_{<t})
\right)
\right].
$$

The final loss combines sparse trajectory-level reinforcement learning with dense, reliability-weighted teacher guidance:

$$
\mathcal{L}
=
\mathcal{L}_{\mathrm{GRPO}}
+
\mathcal{L}_{\mathrm{OPD}}^{\mathrm{step}}.
$$

GRPO encourages exploration through outcome rewards; step-wise OPD provides dense teacher guidance.

## Beyond Tool Errors: Reasoning Can Fail First

In my use of small models for agentic tasks, the errors I notice most often are incorrect conclusions and unsupported claims. Bad tool calls often follow from these earlier reasoning or planning mistakes.

Could OPD intervene at the reasoning decision itself? Tool boundaries are convenient for SOD, but the first mistake may occur inside a step, or without any tool use. This led me to think about token-level weighting.

### IW-OPD: Finer-Grained Weighting

[On the Position Bias of On-Policy Distillation](https://arxiv.org/abs/2606.22600) takes this finer-grained approach: IW-OPD weights each token using accumulated prefix disagreement.

For a student rollout of length $$T$$, let $$\pi_{\mathrm{old}}$$ be the student policy that collected the current batch, and define

$$
A_t=\log\pi_T(y_t\mid x,y_{<t})
-\log\pi_{\mathrm{old}}(y_t\mid x,y_{<t}).
$$

The practical weighting rule in the paper's revised version is

$$
w_t^{\mathrm{IW}}
=1+\gamma\left(
1-\frac{\sum_{j<t}|A_j|}{\sum_{j<T}|A_j|}
\right),
\qquad
A_t^{\mathrm{IW}}=\operatorname{sg}[w_t^{\mathrm{IW}}]A_t.
$$

Here, $$\gamma\geq0$$ controls extra emphasis and $$\operatorname{sg}$$ stops gradients through the weight; the denominator needs numerical stabilization at zero. Unlike SOD, these weights do not recover later in a rollout. They retain ordinary OPD as a floor while emphasizing earlier, more compatible prefixes. See [the method](https://arxiv.org/html/2606.22600v2#S4).

### Can Reweighting Suppress Useful Corrections?

But disagreement is not the same as unreliable supervision. Suppose the student makes an unsupported claim and continues as if it were true, while the teacher tries to question it. The resulting gap may contain exactly the correction the student needs to learn. Downweighting it could weaken that signal.

Later, the student may keep following its incorrect path without correcting anything. The teacher, with its own reasoning limitations and the same erroneous prefix, may also be misled into following that path. Divergence then decreases because the teacher aligns with the student's mistake, not because the student has recovered. Restoring distillation strength could reinforce this shared error. Relay-OPD reports a related pattern: later intervention becomes less effective as the teacher is increasingly influenced by the student's prefix. See [Figure 2](https://arxiv.org/html/2607.26057v1#S1).

What I want to distinguish is misleading supervision from valuable corrective disagreement, rather than simply a large gap from a small one.

## Relay-OPD: Changing the Trajectory, Not Just Its Weight

[Pass the Baton: Trajectory-Relayed On-Policy Distillation](https://arxiv.org/abs/2607.26057) changes the rollout itself. Student-generated reasoning is interrupted by short teacher continuations, creating a mixed trajectory for training.

Its handoff heuristic checks whether the teacher's most likely next token is a reflection token, such as *Wait*, *But*, or *However*, while the student's top-$$K$$ tokens contain none. The teacher then generates a short segment before the student resumes. The rollout ends after the final budgeted teacher segment. See [the implementation overview](https://github.com/ZJU-REAL/Relay-OPD).

### Learning on the Mixed Trajectory

For a relay trajectory $$z$$ and prefix $$h_t=(x,z_{<t})$$, the token advantage is

$$
A_t^{\mathrm{Relay}}
=\log\pi_T(z_t\mid h_t)
-\log\pi_{\mathrm{old}}(z_t\mid h_t).
$$

These advantages drive a clipped, reverse-KL-style policy update over both student and teacher tokens. Teacher segments therefore provide both corrected context and direct training signals. See [the objective](https://arxiv.org/html/2607.26057v1#S3.SS2).

### A Connection to Supervised Distillation

I see Relay-OPD as combining student-state coverage with teacher demonstrations: it preserves the student's own reasoning context while showing recovery actions the student might rarely generate. The connection to SFT lies in these demonstrations; the loss remains a distillation update.

This brings me back to SCoRe. I want the student to make fewer mistakes, notice when it goes wrong, and recover on its own. Learning from a teacher's correction is a promising route toward those goals.

## What These Papers Leave Me Asking

Reweighting changes how much the student learns from a visited state. Relay-style intervention changes the continuation it learns from. My central question is: when is the teacher confused by an erroneous prefix, and when is it trying to correct it? Preserving the latter signal seems essential to teaching the student how to recover.

## References

- Rishabh Agarwal et al. [On-Policy Distillation of Language Models: Learning from Self-Generated Mistakes](https://arxiv.org/abs/2306.13649). ICLR 2024.
- Aviral Kumar et al. [Training Language Models to Self-Correct via Reinforcement Learning](https://arxiv.org/abs/2409.12917). ICLR 2025.
- Qiyong Zhong et al. [SOD: Step-wise On-policy Distillation for Small Language Model Agents](https://arxiv.org/abs/2605.07725). arXiv preprint, 2026.
- Yan Xie et al. [On the Position Bias of On-Policy Distillation](https://arxiv.org/abs/2606.22600). arXiv preprint, 2026. IW-OPD; the weighting rule above follows v2.
- Haolei Xu et al. [Pass the Baton: Trajectory-Relayed On-Policy Distillation](https://arxiv.org/abs/2607.26057). arXiv preprint, 2026.
