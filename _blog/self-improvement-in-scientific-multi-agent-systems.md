---
layout: single
title: "Self-Improvement in Scientific Multi-Agent Systems"
date: 2026-10-12
last_modified_at: 2026-10-12
description: "A short literature review of how scientific multi-agent systems refine research outputs and build capabilities for future work."
author_profile: true
permalink: /self-improvement-in-scientific-multi-agent-systems/
share: false
related: false
---

*From output refinement to research capability improvement*

Last week, I presented a short literature review on LLM-based multi-agent systems for scientific discovery at our group meeting. I focused on a simple question: **when a scientific agent system improves, what actually changes?**

A system might fix its code, revise a hypothesis, or learn a reusable research strategy. These changes all help research, but they operate at different levels. In this post, I organize the papers I reviewed around this distinction and discuss two directions that interest me: adaptive research workflows and efficient continual learning.

## Scientific agents and research feedback

LLMs can support literature review, hypothesis generation, and research planning. Tools extend these abilities by allowing agents to retrieve papers, run code, and collect experimental results. Multi-agent systems distribute this work across agents with different roles.

For example, [ResearchAgent](https://arxiv.org/abs/2404.07738) uses reviewing agents to help refine research ideas. [Agent Laboratory](https://arxiv.org/abs/2501.04227) organizes research through roles such as PhD, Postdoc, and Engineer. [DeepScientist](https://arxiv.org/abs/2509.26603) connects hypothesis development with implementation, experiments, and findings that guide subsequent work.

These systems use feedback throughout the research process. The feedback may come from a human researcher, another agent, or an experiment. However, improving the current study and improving the system's ability to conduct future studies are different goals.

This distinction is the starting point of my review.

## What does the system update?

I find it useful to distinguish three update targets.

**Artifacts** are the outputs of research, such as code, experimental plans, hypotheses, and reports. Updating an artifact improves a particular piece of work.

**The harness** is the surrounding system that guides the agents. It includes prompts, memory, tools, reusable strategies, and coordination procedures. Updating the harness can change how the agents approach later tasks without changing the underlying model parameters.

**The model** is the LLM driving an agent's behavior. Updating its parameters can turn research experience into changes in the model itself.

A system may update more than one target. For instance, it can revise an experiment, save a useful procedure, and train its planner from feedback.

Based on what these updates achieve, I group research improvement into three levels.

![Three levels of research improvement]({{ '/images/blog/scientific-multi-agent-systems/three-levels.png' | relative_url }})

*An overview of the three levels used in this review. The markers indicate whether a system updates artifacts, the harness, or model parameters.*

## Level 1: Refining research execution

At the first level, the system improves how it carries out a given research task. It may repair code, choose a better tool, or adjust analysis parameters. The research direction remains the same.

[CellAgent](https://arxiv.org/abs/2407.09811) provides a clear example. It uses planner, executor, and evaluator agents to automate single-cell data analysis. The planner divides the task into subtasks. The executor selects tools and generates code. The evaluator checks the outcomes and supports further refinement.

![CellAgent execution refinement]({{ '/images/blog/scientific-multi-agent-systems/cellagent.jpg' | relative_url }})

*CellAgent improves execution through code repair, tool selection, and parameter adjustment.*

The main question at this level is: **how can we perform this task better?**

This is valuable even without changing the scientific idea. A failed analysis may reflect a programming error or an unsuitable parameter setting rather than a problem with the hypothesis.

## Level 2: Revising research ideas

At the second level, feedback changes the scientific hypothesis or proposed method. The system uses what it discovers to decide what to investigate next.

[AutoDiscovery](https://arxiv.org/abs/2507.00310) illustrates this process. It explores a tree of hypotheses and uses experimental findings to guide further search. Its search criterion includes Bayesian surprise, which measures how much the results change the model's beliefs about a hypothesis.

![AutoDiscovery hypothesis revision]({{ '/images/blog/scientific-multi-agent-systems/autodiscovery.jpg' | relative_url }})

*AutoDiscovery uses experimental findings to develop follow-up hypotheses and guide exploration.*

The question becomes: **given what we have learned, what should we investigate next?**

This captures an important part of scientific research. Experiments do more than confirm whether an implementation works. They can challenge an assumption or suggest a new direction.

In this framework, Level 2 concerns changes to the research ideas themselves. Level 3 concerns changes to the reusable capabilities that the system brings to future research.

## Level 3: Improving research capabilities

At the third level, the system uses experience to improve how it conducts subsequent research. This can happen through harness updates or model updates.

### Learning through harness updates

[STELLA](https://arxiv.org/abs/2507.02004) develops reusable reasoning strategies and expands its available tools. Its Template Library stores workflows that can guide later tasks. Its Tool Creation Agent adds new tools to a growing Tool Ocean.

![STELLA harness updates]({{ '/images/blog/scientific-multi-agent-systems/stella.jpg' | relative_url }})

*STELLA carries experience into later tasks through reusable workflows and tools.*

The important change is that useful experience persists beyond the current answer. A successful workflow can become a template, and a newly added tool can support future analyses.

This gives the system a practical way to accumulate capabilities without updating the LLM's weights.

### Learning through model updates

Another approach is to update the model itself.

[NanoResearch](https://arxiv.org/abs/2605.10813) combines reusable skills, memory, and planner updates. Its skill bank captures procedures that can be reused across projects. Its memory retains user- and project-specific experience. Researcher feedback also drives parameter updates to the planner, influencing how it coordinates later work.

![NanoResearch model updates]({{ '/images/blog/scientific-multi-agent-systems/nanoresearch.jpg' | relative_url }})

*NanoResearch combines reusable experience with planner updates based on researcher feedback.*

This example also shows why harness and model updates should be considered together. Memory supplies relevant experience, skills provide reusable procedures, and the planner decides how to use them.

## Research opportunity: Adaptive workflows

Several systems already update their tools, memory, or strategies. A further question is whether the team can learn to change its research workflow.

Different research problems may require different kinds of expertise and coordination. A fixed sequence of literature review, planning, execution, and reporting may not suit every task.

An adaptive system could reconsider:

- **Division of labor:** Which agents and expertise does this problem need?
- **Coordination:** How should agents share information and review one another's work?
- **Research procedures:** Which activities should be repeated, reordered, or stopped?

For example, repeated implementation failures might call for more engineering support. Conflicting experimental findings might call for another analysis or a review of the original assumptions.

I am interested in whether scientific multi-agent systems can learn not only how to perform individual research tasks, but also how to organize research more effectively.

## Research opportunity: Efficient continual learning

Long-running research produces a stream of new information. A system may encounter unfamiliar domain knowledge, failed experiments, useful procedures, and human feedback. Continual learning offers a way to turn this experience into lasting capability.

However, learning also costs time and compute. Updating after every interaction may be unnecessary, while waiting too long may leave the system repeating avoidable mistakes.

This raises three connected questions.

**When should the system learn?** It could adapt before a project begins, update at informative points during research, or consolidate experience between research cycles. Possible approaches include selective updates, periodic training, and background learning while research continues.

**What should it learn from?** Potential sources include domain knowledge, experimental outcomes, human feedback, and previous research experience. The system needs to identify which parts are useful beyond the current task.

**How should it learn?** Some experience may be best stored as memory or a reusable tool. Other experience may support supervised fine-tuning, self-distillation, or reinforcement learning.

For me, the central challenge is balancing the cost of learning with the research progress it enables. An update is useful when it helps the system conduct later research better enough to justify that cost.

## Closing thoughts

My main takeaway is that self-improvement in scientific multi-agent systems has several meanings.

A system can improve the execution of a task, revise the ideas behind a study, or build capabilities that carry into future work. Distinguishing these levels makes it easier to understand what each method contributes.

I am especially interested in the transition toward systems that accumulate research capability over time. Adaptive workflows and efficient continual learning offer two ways to explore this direction: learning how to organize research, and learning how to improve from the experience that research produces.
