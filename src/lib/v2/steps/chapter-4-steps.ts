import type { ChapterStep } from "@/lib/v2/types/steps";

export const chapter4Steps: ChapterStep[] = [
  {
    id: "chapter-4-step-1-your-ideas-deserve-protection",
    chapterId: "chapter-4",
    order: 1,
    label: "Your ideas deserve protection",
    kind: "intro",
    sourceSections: ["Your ideas deserve protection"],
    goal: "Frame founder rules as protection against excitement-driven mistakes, not rigid restrictions.",
    summary: "Founder rules are a gift to future-you, making hard decisions now so you don't have to under pressure.",
    content: {
      headline: "Set Your Founder Rules",
      paragraphs: [
        "You finished the last chapter with a shortlist of product ideas backed by real evidence. That is exciting. And excitement is exactly why you need this chapter.",
        "Excitement makes you spend too fast, work without structure, and hold on to ideas long after the evidence says to move on. The founders who succeed are not the ones with the most passion. They are the ones who channel their passion through a set of simple operating rules.",
        "Your Founder Rules are not about making this feel rigid. They are about making decisions easier. When you know how much time you are committing, how much money you are willing to spend, and what results would tell you to stop, continue, or invest more, you do not waste energy second-guessing yourself every week.",
        "Think of these rules as a gift to your future self. You are making the hard decisions now, when you are thinking clearly, so that future-you does not have to make them under pressure."
      ]
    },
    nextStepId: "chapter-4-step-2-time-rules",
  },
  {
    id: "chapter-4-step-2-time-rules",
    chapterId: "chapter-4",
    order: 2,
    label: "Time rules: small and steady wins",
    kind: "concept",
    sourceSections: ["Time rules: small and steady wins"],
    goal: "Help the learner set realistic, sustainable time commitments.",
    summary: "Consistency beats intensity. Four focused hours weekly for 12 weeks beats one 14-hour sprint.",
    content: {
      paragraphs: [
        "You do not need 40 hours a week to build a business. You need a few focused hours, consistently, week after week. The key word is consistently.",
        "Four focused hours every week for 12 weeks will get you further than a single 14-hour marathon followed by three weeks of doing nothing. Your brain needs repetition to build momentum. Your business needs regular attention to move forward."
      ],
      bullets: [
        "How many hours per week can you realistically give this? Not the ambitious number. The honest number. For most people starting out, that is somewhere between 5 and 15 hours.",
        "When exactly will you work on this? Pick specific days and times. 'Tuesday and Thursday evenings 7 to 9' is a rule. 'Whenever I get a chance' is a wish.",
        "When will you review your progress? Set a weekly review slot. This is 20 to 30 minutes where you look at what happened, what the numbers say, and what you will focus on next week."
      ]
    },
    nextStepId: "chapter-4-step-3-money-rules",
    previousStepId: "chapter-4-step-1-your-ideas-deserve-protection",
  },
  {
    id: "chapter-4-step-3-money-rules",
    chapterId: "chapter-4",
    order: 3,
    label: "Money rules: spend on evidence, not hope",
    kind: "concept",
    sourceSections: ["Money rules: spend on evidence, not hope"],
    goal: "Establish a spending discipline that protects finances while enabling learning.",
    summary: "Spend on evidence (tests, samples) not hope (logos, themes before validation).",
    content: {
      paragraphs: [
        "One of the most common early mistakes is spending money on things that feel productive but do not actually test anything. A premium logo, a custom website theme, three months of software subscriptions before your first listing is live. That is spending on hope.",
        "The alternative is spending on evidence. A small ad budget to test whether anyone clicks. A few product samples to check quality. A marketplace listing fee to see if anyone buys."
      ],
      bullets: [
        "What is your monthly maximum? This is the total amount you can spend each month without it causing stress. Be honest. If £200 is your comfortable limit, write down £200. You can increase it later when revenue starts coming in.",
        "How much goes to tools and how much goes to testing? Tools are the recurring costs: store platform, email software, design tools. Testing is money spent learning: ad spend, product samples, marketplace fees. Early on, most budget should go to testing.",
        "A simple starting split: keep tool costs as low as possible (many platforms have free tiers) and direct the rest toward testing real ideas with real customers."
      ]
    },
    nextStepId: "chapter-4-step-4-decision-rules",
    previousStepId: "chapter-4-step-2-time-rules",
  },
  {
    id: "chapter-4-step-4-decision-rules",
    chapterId: "chapter-4",
    order: 4,
    label: "Decision rules: stop, continue, or push harder",
    kind: "action",
    sourceSections: ["Decision rules: know when to stop, continue, or push harder"],
    goal: "Establish clear criteria for pivot decisions before testing begins.",
    summary: "Define in advance what results mean stop, continue, or invest more.",
    content: {
      paragraphs: [
        "This is the most valuable part of your Founder Rules and the part most people skip.",
        "Before you start testing any product idea, you need to decide in advance what the results would need to look like for you to:"
      ],
      bullets: [
        "Stop and try a different idea. Not because you failed, but because the evidence told you this one is not the right fit right now. This is discipline, not defeat.",
        "Continue and give it more time. Because the early signs are encouraging even if the results are not dramatic yet.",
        "Invest more because the results are strong enough to justify increasing your time, budget, or effort."
      ],
      callout: {
        title: "Write your decision rules",
        content: "These rules will get sharper as you gain experience. For now, write what makes sense to you: 'I will stop if nobody shows interest after three weeks.' 'I will continue if I get questions but sales are slow.' 'I will invest more if I make consistent sales within my first month.'"
      }
    },
    nextStepId: "chapter-4-step-5-data-over-ego",
    previousStepId: "chapter-4-step-3-money-rules",
  },
  {
    id: "chapter-4-step-5-data-over-ego",
    chapterId: "chapter-4",
    order: 5,
    label: "Data over ego",
    kind: "concept",
    sourceSections: ["Data over ego"],
    goal: "Establish a commitment to evidence-based decisions over attachment to ideas.",
    summary: "Your personal attachment is not a reason to keep going. Evidence is.",
    content: {
      paragraphs: [
        "Here is a commitment worth making now, before you need it:",
        "Your personal attachment to an idea is not a reason to keep going. Evidence is.",
        "You can genuinely like a product category and still walk away from a specific product within it if the numbers do not support it. You can feel unsure about a product and still pursue it if the evidence is strong.",
        "This is not about ignoring your instincts. It is about not letting your instincts overrule what the data is telling you. The best founders are the ones who can say 'I loved this idea but it did not work, and that is okay because now I know.'",
        "Write a version of this commitment in your own words. The act of writing it down makes it real."
      ]
    },
    nextStepId: "chapter-4-step-6-red-line-rules",
    previousStepId: "chapter-4-step-4-decision-rules",
  },
  {
    id: "chapter-4-step-6-red-line-rules",
    chapterId: "chapter-4",
    order: 6,
    label: "Red-line rules: your non-negotiables",
    kind: "action",
    sourceSections: ["Red-line rules: your non-negotiables"],
    goal: "Define boundaries that protect the learner from common traps.",
    summary: "Non-negotiable boundaries that keep you grounded regardless of how things are going.",
    content: {
      paragraphs: [
        "These are the boundaries you will not cross regardless of how things are going. They protect you from the most common traps that pull new sellers off track.",
        "Here are some examples. Pick the ones that feel right and add your own:"
      ],
      numbered: [
        "I will not skip my weekly review.",
        "I will not add a new tool or subscription without removing one I am not using.",
        "I will not increase my spending beyond my monthly cap without hitting my escalation criteria.",
        "I will track every expense and every sale from day one."
      ],
      callout: {
        title: "Track from day one",
        content: "Keeping a record of your income and expenses from the very start (even a simple spreadsheet) saves enormous hassle later. Depending on where you live, you may also need to look into registering as self-employed or understanding basic tax requirements for selling online."
      }
    },
    nextStepId: "chapter-4-step-7-operating-system",
    previousStepId: "chapter-4-step-5-data-over-ego",
  },
  {
    id: "chapter-4-step-7-operating-system",
    chapterId: "chapter-4",
    order: 7,
    label: "You now have an operating system",
    kind: "recap",
    sourceSections: ["You now have an operating system"],
    goal: "Close the chapter with a summary and transition to the worksheet and next chapter.",
    summary: "Your founder rules are the foundation that makes everything else work.",
    content: {
      paragraphs: [
        "Look at what you have built in this chapter. A realistic time commitment. A spending limit that protects your finances. Decision rules that will tell you what to do when results come in. A commitment to following the evidence. And a set of non-negotiable boundaries.",
        "This is your operating system. It is the foundation that makes everything else in this course work. When you feel unsure about a decision in a later chapter, come back here. Your rules will tell you what to do.",
        "Next up: putting your product ideas through the numbers to see which ones can actually make you money. This is where the shortlist gets shorter, and that is a very good thing."
      ],
      callout: {
        title: "Chapter close",
        content: "Complete the Founder Rules worksheet below, then continue to Chapter 5: Know Your Numbers Before You Commit."
      }
    },
    previousStepId: "chapter-4-step-6-red-line-rules",
  },
];
