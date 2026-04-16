import type { ChapterStep } from "@/lib/v2/types/steps";

export const chapter3Steps: ChapterStep[] = [
  {
    id: "chapter-3-step-1-why-founder-rules-matter",
    chapterId: "chapter-3",
    order: 1,
    label: "Why rules matter",
    kind: "intro",
    sourceSections: ["c3-b1", "c3-b2", "c3-b3", "c3-b4", "c3-b5"],
    goal: "Explain why founder rules exist and why they protect the learner from mood-driven decisions.",
    summary: "Founder rules are there to protect time, money, and attention before stress or excitement start making choices.",
    content: {
      headline: "Set Your Founder Rules",
      paragraphs: [
        "This chapter is where you stop hoping that discipline will magically appear later.",
        "Instead, you decide how you will operate before stress, doubt, or excitement start making choices for you.",
        "Most early founders do not fail because they lack ideas. They fail because they keep changing direction, breaking their own limits, or making decisions based on mood instead of evidence.",
        "Your rules are not there to make the process feel rigid for the sake of it. They are there to protect your time, your money, and your attention so you can keep moving without constant second-guessing."
      ]
    },
    nextStepId: "chapter-3-step-2-real-constraints",
  },
  {
    id: "chapter-3-step-2-real-constraints",
    chapterId: "chapter-3",
    order: 2,
    label: "Start with constraints",
    kind: "concept",
    sourceSections: ["c3-b6", "c3-b7", "c3-b8"],
    goal: "Ground the learner in real limits instead of fantasy assumptions.",
    summary: "Good founder rules begin with the time, budget, and complexity the learner can actually handle.",
    content: {
      headline: "Start with your real constraints",
      paragraphs: [
        "Your business has to fit your real life, not your fantasy life.",
        "That means your rules must begin with the actual resources you have now: your weekly time, your available budget, and the level of complexity you can realistically manage."
      ],
      bullets: [
        "How many hours per week can you genuinely give this?",
        "What is the most you can afford to spend each month without stress?",
        "How long are you willing to run a test before judging the result?"
      ]
    },
    previousStepId: "chapter-3-step-1-why-founder-rules-matter",
    nextStepId: "chapter-3-step-3-rules-before-emotion",
  },
  {
    id: "chapter-3-step-3-rules-before-emotion",
    chapterId: "chapter-3",
    order: 3,
    label: "Rules before emotion",
    kind: "concept",
    sourceSections: ["c3-b9", "c3-b10", "c3-b11", "c3-b12"],
    goal: "Show why decision rules must be set before attachment distorts judgment.",
    summary: "Kill criteria, continue criteria, and escalation criteria should be defined before the learner is emotionally attached.",
    content: {
      headline: "Define rules before emotion gets involved",
      paragraphs: [
        "The best time to make good decisions is before you are emotionally attached to an idea.",
        "Once you start imagining what a product could become, it gets much harder to evaluate it fairly.",
        "That is why founder rules need to include clear kill criteria, continue criteria, and escalation criteria.",
        "You should know in advance what results mean stop, what results mean keep going, and what results justify investing more."
      ],
      callout: {
        title: "Remember",
        content: "Interesting is not enough. Personal preference is not enough. If the evidence is weak, the idea does not earn more time just because you like it."
      }
    },
    previousStepId: "chapter-3-step-2-real-constraints",
    nextStepId: "chapter-3-step-4-data-over-ego",
  },
  {
    id: "chapter-3-step-4-data-over-ego",
    chapterId: "chapter-3",
    order: 4,
    label: "Data over ego",
    kind: "action",
    sourceSections: ["c3-b13", "c3-b14", "c3-b15"],
    goal: "Turn the learner from vague intention into a measurable decision model.",
    summary: "Founder rules need a minimum test period, clear success signals, and clear stop/continue/escalate decisions.",
    content: {
      headline: "Use data over ego",
      paragraphs: [
        "Many founders waste months trying to force a weak idea to work because it feels personal.",
        "Your rules should protect you from that. Data over ego means you measure what matters and allow the evidence to guide your next step."
      ],
      numbered: [
        "Set the minimum test period.",
        "Choose the signals that matter most.",
        "Decide what result means the idea is not strong enough.",
        "Decide what result means you should continue.",
        "Decide what result means you should invest more confidently."
      ]
    },
    previousStepId: "chapter-3-step-3-rules-before-emotion",
    nextStepId: "chapter-3-step-5-boring-can-win",
  },
  {
    id: "chapter-3-step-5-boring-can-win",
    chapterId: "chapter-3",
    order: 5,
    label: "Boring can win",
    kind: "example",
    sourceSections: ["c3-b16", "c3-b17", "c3-b18"],
    goal: "Reinforce that practical, ordinary ideas can still be commercially strong.",
    summary: "Useful beats exciting if demand is real and the buyer is reachable.",
    content: {
      headline: "Boring can be profitable",
      paragraphs: [
        "A good founder does not need an exciting idea. They need a useful one.",
        "Some of the best opportunities look ordinary, practical, or even dull at first glance. That is not a weakness. Often it is a sign of real demand."
      ],
      callout: {
        title: "Mini-case",
        content: "A founder ignores flashy trends and instead tests a simple product for busy dog owners who need durable seat covers. It is not glamorous, but the demand is obvious, the buyer is easy to find, and the problem is real."
      }
    },
    previousStepId: "chapter-3-step-4-data-over-ego",
    nextStepId: "chapter-3-step-6-complete-founder-rules-sheet",
  },
  {
    id: "chapter-3-step-6-complete-founder-rules-sheet",
    chapterId: "chapter-3",
    order: 6,
    label: "Complete the sheet",
    kind: "recap",
    sourceSections: ["c3-b19", "c3-b20", "c3-b21"],
    goal: "Hand the learner into the worksheet with a clear sense of purpose and expected output.",
    summary: "The Founder Rules Sheet is the operating system for the next stage of the journey.",
    content: {
      headline: "Complete your Founder Rules Sheet",
      paragraphs: [
        "Before you move on, complete your Founder Rules Sheet.",
        "This is your operating system for the next stage of the journey. It gives you a practical way to protect your time, budget, and decision quality."
      ],
      bullets: [
        "Your business must fit your real constraints.",
        "Rules should be set before emotion distorts your judgment.",
        "Data should decide whether you stop, continue, or invest more.",
        "Boring ideas can still be commercially strong.",
        "The Founder Rules Sheet is the output of this chapter."
      ],
      callout: {
        title: "Next step",
        content: "Move into the worksheet now while the rules are fresh, so this chapter turns into something you can actually use."
      }
    },
    previousStepId: "chapter-3-step-5-boring-can-win",
  }
];
