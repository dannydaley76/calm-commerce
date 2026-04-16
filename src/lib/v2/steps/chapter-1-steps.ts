import type { ChapterStep } from "@/lib/v2/types/steps";

export const chapter1Steps: ChapterStep[] = [
  {
    id: "chapter-1-step-1-opening-reassurance",
    chapterId: "chapter-1",
    order: 1,
    label: "Welcome",
    kind: "intro",
    sourceSections: ["Section 1"],
    goal: "Reassure the learner that they belong here and reduce intimidation early.",
    summary: "A calm opening that lowers fear and frames the guide as practical and manageable.",
    content: {
      headline: "Welcome: You Can Do This",
      paragraphs: [
        "If you’re reading this, take a moment to give yourself some credit.",
        "Most people who dream about earning a bit of extra income never get as far as opening a guide like this. They talk themselves out of it because it feels too technical, too modern, or like something only younger people do.",
        "But here’s the truth: an online store is just a simple way for someone to find what you sell, pay you, and receive it.",
        "This guide is for someone starting from scratch who wants a calm, sensible way to build extra income in a few hours a week without risking savings or turning life upside down."
      ]
    },
    nextStepId: "chapter-1-step-2-confidence-after-action",
  },
  {
    id: "chapter-1-step-2-confidence-after-action",
    chapterId: "chapter-1",
    order: 2,
    label: "Confidence comes later",
    kind: "concept",
    sourceSections: ["Section 2"],
    goal: "Remove the belief that confidence must come before action.",
    summary: "Confidence usually follows small steps rather than arriving before them.",
    content: {
      paragraphs: [
        "A lot of people wait until they feel confident before they begin.",
        "But confidence usually doesn’t come first. It comes after you’ve taken a few small steps and realised this is actually manageable.",
        "If you feel nervous or overwhelmed, that is normal. It does not mean you can’t do this. It just means you’re doing something new.",
        "And we’re going to make new feel safe."
      ]
    },
    nextStepId: "chapter-1-step-3-what-an-online-store-is",
    previousStepId: "chapter-1-step-1-opening-reassurance",
  },
  {
    id: "chapter-1-step-3-what-an-online-store-is",
    chapterId: "chapter-1",
    order: 3,
    label: "What an online store is",
    kind: "concept",
    sourceSections: ["Section 3"],
    goal: "Reduce perceived complexity by defining the store in plain English.",
    summary: "A store is simply a way for people to see what you sell, pay safely, and receive what they ordered.",
    content: {
      paragraphs: [
        "Let’s keep it simple.",
        "An online store is a place where people can see what you sell, pay you safely, and get what they ordered.",
        "Everything else - logos, fancy design, complicated tools - can come later if it helps.",
        "The early goal is not perfection. The early goal is proof."
      ],
      numbered: ["See what you sell", "Pay you safely", "Get what they ordered"]
    },
    nextStepId: "chapter-1-step-4-what-this-guide-helps-you-achieve",
    previousStepId: "chapter-1-step-2-confidence-after-action",
  },
  {
    id: "chapter-1-step-4-what-this-guide-helps-you-achieve",
    chapterId: "chapter-1",
    order: 4,
    label: "What this helps you build",
    kind: "concept",
    sourceSections: ["Section 4"],
    goal: "Set realistic expectations and define the practical outcome of following the guide.",
    summary: "This is a calm route to something real, not a get-rich-quick promise.",
    content: {
      paragraphs: [
        "This is not a get-rich-quick promise. Those usually end in disappointment and wasted money.",
        "This is a practical approach that helps you build a real product, a clear offer, a simple selling path, and a routine you can sustain.",
        "Many people start by aiming for a first sale, then a few sales a week, then steady extra income.",
        "Even small extra income can matter when it comes from something you control."
      ],
      bullets: [
        "A product people want",
        "A clear offer that’s easy to understand",
        "A simple way to sell and deliver it",
        "A routine you can stick to"
      ]
    },
    nextStepId: "chapter-1-step-5-you-already-have-what-matters",
    previousStepId: "chapter-1-step-3-what-an-online-store-is",
  },
  {
    id: "chapter-1-step-5-you-already-have-what-matters",
    chapterId: "chapter-1",
    order: 5,
    label: "You already have strengths",
    kind: "concept",
    sourceSections: ["Section 5"],
    goal: "Reframe age and non-technical identity as assets rather than liabilities.",
    summary: "Trust often comes from reliability, clarity, and steadiness — not technical flashiness.",
    content: {
      paragraphs: [
        "You might not feel techy, but online selling is not only about technology.",
        "Many people over 50 have a real advantage because they tend to be reliable, clear communicators, steady, and sensible.",
        "Those qualities build trust online.",
        "People do not buy because your website is perfect. They buy because they trust what they are getting and feel looked after."
      ],
      bullets: [
        "Reliable",
        "Clear communicators",
        "Steady and consistent",
        "Good at keeping promises",
        "Sensible with money"
      ]
    },
    nextStepId: "chapter-1-step-6-calm-start-rules",
    previousStepId: "chapter-1-step-4-what-this-guide-helps-you-achieve",
  },
  {
    id: "chapter-1-step-6-calm-start-rules",
    chapterId: "chapter-1",
    order: 6,
    label: "Calm-start rules",
    kind: "action",
    sourceSections: ["Section 6"],
    goal: "Introduce the operating rules that protect the learner from overwhelm and unnecessary risk.",
    summary: "These six rules keep the learner grounded, specific, and protected while they start.",
    content: {
      paragraphs: [
        "You won’t be asked to spend a lot of money or learn everything at once.",
        "We’ll follow a few calm-start rules all the way through this guide.",
        "These rules are here to protect you."
      ],
      numbered: [
        "Keep spending low until you have proof",
        "Start small and specific",
        "Use templates instead of starting from scratch",
        "One channel at a time",
        "Improve gently, one step at a time",
        "Have stop rules"
      ]
    },
    nextStepId: "chapter-1-step-7-realistic-weekly-routine",
    previousStepId: "chapter-1-step-5-you-already-have-what-matters",
  },
  {
    id: "chapter-1-step-7-realistic-weekly-routine",
    chapterId: "chapter-1",
    order: 7,
    label: "A realistic weekly routine",
    kind: "example",
    sourceSections: ["Section 7"],
    goal: "Show the learner that the work cadence is manageable.",
    summary: "A few short sessions plus one longer improvement session can be enough to build steady progress.",
    content: {
      paragraphs: [
        "You do not need to work all day.",
        "A realistic routine often looks like a couple of short admin/order sessions and one longer improvement session each week.",
        "That is often enough to build steady progress.",
        "Once your systems are in place, it usually gets easier, not harder."
      ],
      bullets: [
        "Two or three short sessions each week for messages, orders, and fulfilment",
        "One longer session to improve one thing and do one marketing action",
        "Steady progress instead of intensity"
      ]
    },
    nextStepId: "chapter-1-step-8-next-30-days",
    previousStepId: "chapter-1-step-6-calm-start-rules",
  },
  {
    id: "chapter-1-step-8-next-30-days",
    chapterId: "chapter-1",
    order: 8,
    label: "Your first 30 days",
    kind: "example",
    sourceSections: ["Section 8"],
    goal: "Make the near-term path feel visible and achievable.",
    summary: "The learner should be able to imagine the next month clearly enough that action feels possible.",
    content: {
      paragraphs: [
        "If you follow the steps in this guide, your first month can look much clearer than it feels right now.",
        "You choose a product that suits your life and budget, test it in a low-risk way, build a simple selling page, and learn what customers actually care about.",
        "Even if the first attempt does not sell immediately, you are not stuck. You have evidence and a way forward."
      ],
      bullets: [
        "Choose a product that suits your life and budget",
        "Test it in a low-risk way",
        "Create a simple, trustworthy selling page",
        "Learn what customers ask and what matters to them",
        "Get first sales or clear evidence of what to adjust next"
      ]
    },
    nextStepId: "chapter-1-step-9-next-step-handoff",
    previousStepId: "chapter-1-step-7-realistic-weekly-routine",
  },
  {
    id: "chapter-1-step-9-next-step-handoff",
    chapterId: "chapter-1",
    order: 9,
    label: "You are ready to begin",
    kind: "recap",
    sourceSections: ["Section 1", "Section 8", "editorial recap"],
    goal: "Close the chapter with reassurance and a clear transition into the next chapter or next practical action.",
    summary: "End with calm confidence, not hype, and transition the learner toward the next real decision.",
    content: {
      paragraphs: [
        "You do not need to be highly technical to make progress here.",
        "What you need is a calm way to begin, sensible rules, and the willingness to keep moving in small steps.",
        "The next chapter should build on that by helping the learner choose or test the right starting direction with more confidence."
      ],
      callout: {
        title: "Chapter close",
        content: "You are not trying to become a different kind of person. You are building a calm, workable way to start."
      }
    },
    previousStepId: "chapter-1-step-8-next-30-days",
  }
];
