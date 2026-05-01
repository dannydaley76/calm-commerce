import type { ChapterContent } from "@/lib/v2/types/domain";

export const calmCommerceChapterContent: Record<string, ChapterContent> = {
  "choose-how-youll-sell": {
    chapter: {
      id: "chapter-2",
      number: 2,
      slug: "choose-how-youll-sell",
      title: "Choose How You'll Sell",
      phase: 1,
      phaseLabel: "Get Started",
      estimatedReadMinutes: 8,
      worksheetId: "sourcing-model-sheet",
      canvasSections: ["sourcing_model"],
    },
    steps: [
      {
        id: "chapter-2-step-1-the-question-before-the-question",
        title: "The question before the question",
        blocks: [
          { type: "heading", level: 2, content: "The question before the question" },
          {
            type: "paragraph",
            content:
              "Most people start by asking 'what should I sell?' That is actually the second question. The first question is: how will you sell it?",
          },
          {
            type: "paragraph",
            content:
              "The answer shapes everything that follows. It affects how much money you need to start, how quickly you can have something for sale, and how much of the process you control. The exciting part is that some of these models let you start selling within days, with very little money upfront.",
          },
          {
            type: "paragraph",
            content:
              "There are five common models. Each one works. The right choice depends on where you are right now, and you can always move to a different model later as your skills and confidence grow.",
          },
          {
            type: "image",
            brief:
              "A horizontal spectrum graphic showing the five sourcing models from left (quickest start, lowest cost) to right (more investment, more control). Icons left to right: shopping bag (reselling), paintbrush on t-shirt (print-on-demand), arrows between two points (dropshipping), tag/label icon (private label), pencil and blueprint (design and manufacture). Caption: 'Start here if you want to learn fast' on the left, 'Grow into this as you gain experience' on the right. Friendly, approachable style.",
            alt: "Spectrum of the five sourcing models from quickest/cheapest to most investment and control.",
            src: null,
          },
          { type: "heading", level: 3, content: "1. Reselling: the fastest way to start" },
          {
            type: "paragraph",
            content:
              "You buy products that already exist (wholesale, clearance, or through suppliers) and sell them at a higher price. This is the simplest model and you can genuinely start within days.",
          },
          {
            type: "paragraph",
            content:
              "The beauty of reselling is that the learning curve is short. You find a good product, list it, and focus entirely on selling. This teaches you the skills that matter most early on: how to write a listing, how to price competitively, and how to handle customers. Margins are typically thinner than other models, but that is a fair trade for speed and simplicity.",
          },
          { type: "heading", level: 3, content: "2. Print-on-demand: sell your designs, hold no stock" },
          {
            type: "paragraph",
            content:
              "You create a design and a partner company prints it onto products and ships it directly to the customer. You only pay when someone orders, so there is zero upfront product cost.",
          },
          {
            type: "paragraph",
            content:
              "This is a brilliant way to test creative ideas and build an audience. Margins are tighter because the print company takes their share, but you are trading margin for freedom: no stock to buy, no products to ship, and no leftover inventory if something does not sell.",
          },
        ],
      },
      {
        id: "chapter-2-step-2-more-models",
        title: "Three more models",
        blocks: [
          { type: "heading", level: 3, content: "3. Dropshipping: test demand without buying stock" },
          {
            type: "paragraph",
            content:
              "You list a product in your store and when someone buys, a supplier ships it directly to them. You never handle the product yourself.",
          },
          {
            type: "paragraph",
            content:
              "This can work well as a demand testing tool. You can quickly find out whether anyone wants a product before committing to buying stock. Choose your suppliers carefully and start with one or two products rather than a large catalogue. Many sellers use dropshipping to identify winning products, then switch to holding stock or private labelling once they have evidence something sells well.",
          },
          { type: "heading", level: 3, content: "4. Private label: your brand, built on proven demand" },
          {
            type: "paragraph",
            content:
              "You find an existing product from a manufacturer, add your own branding and packaging, and sell it as your own. This gives you stronger margins and a product that feels genuinely yours.",
          },
          {
            type: "paragraph",
            content:
              "This model takes longer to set up: a realistic timeline from first enquiry to products in hand is around 6 to 12 weeks. It works best when you already know what sells, which is why many founders start with reselling or dropshipping and move to private label for products that proved themselves.",
          },
          {
            type: "image",
            brief:
              "A friendly timeline illustration showing the private label process as a simple journey with milestones: Find supplier → Request samples (1–3 weeks) → Review and approve → Place first order (2–4 weeks production) → Shipping (2–6 weeks) → Ready to sell. Road or path metaphor. Small encouraging icon at each milestone. Tone: 'a journey with clear steps', not 'a long complicated process'.",
            alt: "Private label timeline from finding a supplier to being ready to sell.",
            src: null,
          },
          { type: "heading", level: 3, content: "5. Design and manufacture: build something truly unique" },
          {
            type: "paragraph",
            content:
              "You create a completely new product from scratch and have it manufactured. This is the path with the highest potential because you own something nobody else can sell.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "For most people starting out, design and manufacture is the model to grow into rather than start with. Learn how to find customers, test demand, and run a profitable store first. Once those skills are in place and revenue is coming in, designing your own product becomes a much more confident move.",
          },
        ],
      },
      {
        id: "chapter-2-step-3-you-are-not-locking-yourself-in",
        title: "You are not locking yourself in",
        inlineWorksheetFieldKeys: [
          "sourcing_model",
          "why_this_model",
          "estimated_startup_cost",
          "timeline_to_first_listing",
        ],
        blocks: [
          { type: "heading", level: 2, content: "You are not locking yourself in" },
          {
            type: "paragraph",
            content:
              "This is important: your choice here is a starting point, not a permanent decision. The selling skills you build, from finding customers to writing great listings, running ads, and reading your numbers, transfer across every model.",
          },
          {
            type: "paragraph",
            content:
              "Many of the most successful online sellers started with the simplest model available to them and upgraded over time. Start where you can start now. You will know when you are ready for the next level because the course will help you recognise that moment.",
          },
          {
            type: "loop",
            message:
              "Not sure which model to choose? Pick reselling or print-on-demand. Both let you start quickly with minimal cost, and everything you learn applies to any model you move to later. You can always come back to this chapter and make a different choice.",
            targets: [
              {
                chapterSlug: "choose-how-youll-sell",
                stepId: "chapter-2-step-1-the-question-before-the-question",
                label: "Back to the five models",
              },
            ],
          },
        ],
      },
      {
        id: "chapter-2-step-4-before-you-move-on",
        title: "Before you move on",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "Before you move on" },
          {
            type: "paragraph",
            content:
              "You now understand the five sourcing models and you have made your first real business decision: how you will sell. That decision shapes your startup cost, your timeline, and how quickly you can have something live.",
          },
          {
            type: "paragraph",
            content:
              "Next up is finding something to sell. You will learn how to read demand signals, evaluate competition, and build a shortlist of ideas backed by evidence rather than guesswork. It is more fun than it sounds.",
          },
        ],
      },
    ],
  },
  "welcome-you-can-do-this": {
    chapter: {
      id: "chapter-1",
      number: 1,
      slug: "welcome-you-can-do-this",
      title: "Welcome: You Can Do This",
      phase: 1,
      phaseLabel: "Get Started",
      estimatedReadMinutes: 4,
      worksheetId: null,
      canvasSections: [],
    },
    steps: [
      {
        id: "chapter-1-step-1",
        title: "You are about to build something real",
        blocks: [
          { type: "heading", level: 2, content: "You are about to build something real" },
          {
            type: "paragraph",
            content:
              "Not a plan. Not a spreadsheet. A real product, listed for sale, bought by a real person. That is where this course takes you, and it happens sooner than you might expect.",
          },
          {
            type: "paragraph",
            content:
              "Thousands of people with no technical background, no business degree, and no special connections are running profitable online stores right now. Some started with less time and less money than you have today. The difference between them and the people still thinking about it? They started.",
          },
          { type: "paragraph", content: "This course shows you how to start well." },
        ],
      },
      {
        id: "chapter-1-step-2",
        title: "What this course is",
        blocks: [
          { type: "heading", level: 2, content: "What this course is (and is not)" },
          {
            type: "paragraph",
            content:
              "This is a course about the decisions that make an online business work. Which product to sell, how to know if people want it, how to price it so you actually make money, how to find customers, and how to keep improving once things are moving.",
          },
          {
            type: "paragraph",
            content:
              "It is not a step-by-step tutorial for a specific platform like Shopify or Etsy. Those platforms have their own free setup guides and they are designed for non-technical people.",
          },
          {
            type: "image",
            brief:
              "A simple, warm illustration showing a person at a desk with a laptop, surrounded by small icons representing the course journey.",
            alt: "Illustration placeholder for the course journey overview.",
            src: null,
          },
        ],
      },
      {
        id: "chapter-1-step-3",
        title: "How the course works",
        inlineWorksheetFieldKeys: [],
        blocks: [
          { type: "heading", level: 2, content: "How the course works" },
          {
            type: "paragraph",
            content:
              "Every chapter teaches one skill or decision. You will read, work through short exercises, and fill in a worksheet that captures your thinking.",
          },
          {
            type: "paragraph",
            content:
              "Your answers feed into a Lean Canvas, a living map of your business that builds up as you go. By Chapter 6 you could have your first sale. By Chapter 10 you will have a live store.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "If you test a product idea and it does not work out, that is not failure. It is progress. You learned something real and avoided a bigger mistake.",
          },
        ],
      },
      {
        id: "chapter-1-step-4",
        title: "What you will need",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "What you will need" },
          {
            type: "paragraph",
            content:
              "A few hours a week, consistently. A modest monthly budget for testing. And willingness to try things, look at the results honestly, and keep moving.",
          },
          {
            type: "paragraph",
            content:
              "That is it. No special skills. No experience required. No audience, no followers, no connections needed.",
          },
          { type: "paragraph", content: "You are closer to your first sale than you think. Let's get into it." },
        ],
      },
    ],
  },
  "brainstorm-with-discipline": {
    chapter: {
      id: "chapter-3",
      number: 3,
      slug: "brainstorm-with-discipline",
      title: "Brainstorm With Discipline",
      phase: 1,
      phaseLabel: "Get Started",
      estimatedReadMinutes: 10,
      worksheetId: "ideas-worksheet",
      canvasSections: ["product_candidates"],
    },
    steps: [
      {
        id: "chapter-3-step-1-where-good-ideas-come-from",
        title: "Where good ideas come from",
        blocks: [
          { type: "heading", level: 2, content: "This is where good ideas come from" },
          {
            type: "paragraph",
            content:
              "Not from staring at a blank page. Not from copying what someone else is selling. And not just from thinking about what you personally would buy.",
          },
          {
            type: "paragraph",
            content:
              "Good product ideas come from evidence. Real people, spending real money, on real products, right now. Your job in this chapter is to find that evidence. And the great news is that it is hiding in plain sight, in places you probably already visit.",
          },
          { type: "heading", level: 3, content: "Marketplace bestseller lists: your first goldmine" },
          {
            type: "paragraph",
            content:
              "Amazon, eBay, and Etsy all show you what is selling well right now. This is not secret information. It is publicly available, free, and incredibly useful.",
          },
          {
            type: "paragraph",
            content:
              "On Amazon, browse the Best Sellers section within categories that interest you. On eBay, filter completed listings to see what actually sold. On Etsy, sort by number of reviews. What you are looking for: products that sell consistently across multiple sellers. This tells you demand is real and not dependent on one specific brand.",
          },
          { type: "heading", level: 3, content: "Search patterns: is interest growing or fading?" },
          {
            type: "paragraph",
            content:
              "Google Trends is free and takes 30 seconds to check any product idea. Type in what you are considering and look at the search interest over the last 12 months. A stable or gently rising line means consistent demand: ideal for a first product. A sharp spike followed by a drop means the trend has peaked.",
          },
          {
            type: "image",
            brief:
              "Two simple Google Trends style line charts side by side. Left labelled 'Steady demand: great for a first product' shows a gently fluctuating but stable line across 12 months with a subtle upward drift. Right labelled 'Trend spike: the opportunity may have passed' shows a sharp peak followed by a decline. Clean, easy to read, not technical. Caption: 'Spend 30 seconds checking this for every idea. It could save you months.'",
            alt: "Two charts contrasting steady demand vs a trend spike that has passed.",
            src: null,
          },
        ],
      },
      {
        id: "chapter-3-step-2-review-mining-and-social-listening",
        title: "Review mining and social listening",
        blocks: [
          { type: "heading", level: 2, content: "Review mining: find gaps other sellers are missing" },
          {
            type: "paragraph",
            content:
              "Go to Amazon or any marketplace and read the 1-star, 2-star, and 3-star reviews of products in a category you are considering. Ignore the 5-star reviews. Focus on what people are unhappy about.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Every complaint is a potential opportunity. If a popular product consistently gets the same criticism, there is room for someone who solves that problem. You do not need to invent a new product: you might just need to offer a better version of something people already buy.",
          },
          { type: "heading", level: 3, content: "Social listening: hear what people are asking for" },
          {
            type: "paragraph",
            content:
              "Go where your potential customers talk: Reddit, Facebook groups, hobbyist forums, YouTube comment sections. Search for phrases like 'does anyone know where to find…', 'I wish someone would make…', or 'looking for recommendations…'.",
          },
          {
            type: "paragraph",
            content:
              "These are real people describing unmet needs in their own words. Pay attention to the language they use: it tells you not only what to sell but how to describe it in a way that resonates.",
          },
          { type: "heading", level: 3, content: "Check for seasonality" },
          {
            type: "paragraph",
            content:
              "Check Google Trends for a full 12-month view of any product idea. If you see a big spike at one time of year and a flat line otherwise, factor that into your planning. Year-round demand is usually the better choice for a first product because it gives you consistent opportunities to test and improve.",
          },
        ],
      },
      {
        id: "chapter-3-step-3-competition-and-boring-can-win",
        title: "Competition and boring can win",
        blocks: [
          { type: "heading", level: 2, content: "Competition: is there space for you?" },
          {
            type: "paragraph",
            content:
              "Finding demand is exciting. But before you get too attached to an idea, take a quick look at who else is selling it. Search for your product on the marketplaces where you would list it. How many reviews do the top results have? Are they all large established brands, or is there a mix?",
          },
          {
            type: "paragraph",
            content:
              "The sweet spot for a new seller is strong demand with imperfect supply. Products where existing sellers have mediocre listings, inconsistent quality, slow shipping, or obvious gaps in how they serve the customer. That is your opening.",
          },
          {
            type: "image",
            brief:
              "A simple, friendly 2x2 matrix. X-axis: 'Lower demand' to 'Higher demand'. Y-axis: 'Weaker competition' to 'Stronger competition'. Four quadrant labels: top-left 'Niche: small but can work nicely', top-right 'Sweet spot: this is where you want to be' (highlighted), bottom-left 'Skip this one', bottom-right 'Tough: possible but you will need to work harder'. Helpful map feel, not academic.",
            alt: "2x2 matrix of demand vs competition with the high-demand/low-competition quadrant highlighted.",
            src: null,
          },
          { type: "heading", level: 3, content: "Boring can be profitable (and that is a good thing)" },
          {
            type: "paragraph",
            content:
              "Some of the most reliable products to sell are the ones nobody brags about. Replacement parts, organisational supplies for specific hobbies, niche templates, storage solutions. These share three powerful characteristics: steady demand, a buyer who knows exactly what they want, and purchases that often repeat.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Do not filter ideas by how exciting they sound at a dinner party. Filter them by how strong the evidence is. A boring product with proven, repeating demand is a far better foundation for a business than a trendy product with a short shelf life.",
          },
        ],
      },
      {
        id: "chapter-3-step-4-score-and-shortlist",
        title: "Score and shortlist your ideas",
        inlineWorksheetFieldKeys: ["product_ideas"],
        blocks: [
          { type: "heading", level: 2, content: "Score and shortlist your ideas" },
          {
            type: "paragraph",
            content:
              "By now you should have several possibilities. For each idea, capture the evidence you found: what demand signals you spotted, what the competition looks like, and whether demand is year-round or seasonal.",
          },
          {
            type: "paragraph",
            content:
              "You are not making a final decision yet. You are building a shortlist of ideas that have earned further investigation. The next chapter puts these ideas through the numbers to see which ones can actually make you money.",
          },
          {
            type: "loop",
            message:
              "If none of your ideas show strong demand signals, that is genuinely useful information: it means you have avoided investing in something that would not have worked. Head back to the research methods, explore different categories, and try again. Many successful sellers tested several ideas before finding the one that clicked.",
            targets: [
              {
                chapterSlug: "brainstorm-with-discipline",
                stepId: "chapter-3-step-1-where-good-ideas-come-from",
                label: "Back to research methods",
              },
            ],
          },
        ],
      },
      {
        id: "chapter-3-step-5-you-are-making-real-progress",
        title: "You are making real progress",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "You are making real progress" },
          {
            type: "paragraph",
            content:
              "Think about where you were at the start of this chapter. You had a blank page. Now you have a shortlist of product ideas backed by real evidence: marketplace data, search trends, customer complaints, and competitive gaps.",
          },
          {
            type: "paragraph",
            content:
              "Most people who try to sell online never do this research. They pick something based on a hunch and hope for the best. You are already ahead of them.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Next up: setting the rules that will keep you focused and protect your time and money as you move forward. This is where your business gets its backbone.",
          },
        ],
      },
    ],
  },
  "set-your-founder-rules": {
    chapter: {
      id: "chapter-4",
      number: 4,
      slug: "set-your-founder-rules",
      title: "Set Your Founder Rules",
      phase: 2,
      phaseLabel: "Set Your Rules and Test",
      estimatedReadMinutes: 10,
      worksheetId: "founder-rules-sheet",
      canvasSections: ["operating_constraints", "decision_framework", "boundaries"],
    },
    steps: [
      {
        id: "chapter-4-step-1-your-ideas-deserve-protection",
        title: "Your ideas deserve protection",
        blocks: [
          { type: "heading", level: 2, content: "Your ideas deserve protection" },
          {
            type: "paragraph",
            content:
              "You finished the last chapter with a shortlist of product ideas backed by real evidence. That is exciting. And excitement is exactly why you need this chapter.",
          },
          {
            type: "paragraph",
            content:
              "Excitement makes you spend too fast, work without structure, and hold on to ideas long after the evidence says to move on. The founders who succeed are not the ones with the most passion. They are the ones who channel their passion through a set of simple operating rules.",
          },
          {
            type: "paragraph",
            content:
              "Your Founder Rules are not about making this feel rigid. They are about making decisions easier. When you know how much time you are committing, how much money you are willing to spend, and what results would tell you to stop, continue, or invest more, you do not waste energy second-guessing yourself every week.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Think of these rules as a gift to your future self. You are making the hard decisions now, when you are thinking clearly, so that future-you does not have to make them under pressure.",
          },
        ],
      },
      {
        id: "chapter-4-step-2-time-rules",
        title: "Time rules: small and steady wins",
        inlineWorksheetFieldKeys: ["hours_per_week", "fixed_work_blocks", "weekly_review_slot"],
        blocks: [
          { type: "heading", level: 2, content: "Time rules: small and steady wins" },
          {
            type: "paragraph",
            content:
              "You do not need 40 hours a week to build a business. You need a few focused hours, consistently, week after week. Four focused hours every week for 12 weeks will get you further than a single 14-hour marathon followed by three weeks of doing nothing.",
          },
          {
            type: "bullets",
            items: [
              "How many hours per week can you realistically give this? Not the ambitious number: the honest number you could sustain even during a busy week.",
              "When exactly will you work on this? Pick specific days and times. 'Tuesday and Thursday evenings 7 to 9' is a rule. 'Whenever I get a chance' is a wish.",
              "When will you review your progress? Set a weekly review slot of 20 to 30 minutes to check what happened and decide what to focus on next week.",
            ],
          },
          {
            type: "image",
            brief:
              "A simple weekly calendar view (Monday to Sunday) with a few time blocks highlighted in a friendly accent colour, showing example work sessions on Tuesday evening, Thursday evening, and Saturday morning. A small 'review' icon on Sunday evening. Calm, achievable schedule with plenty of white space.",
            alt: "Example weekly schedule showing protected work blocks and a Sunday review slot.",
            src: null,
          },
        ],
      },
      {
        id: "chapter-4-step-3-money-rules",
        title: "Money rules: spend on evidence, not hope",
        inlineWorksheetFieldKeys: ["money_cap_per_month", "tooling_max_spend", "budget_split"],
        blocks: [
          { type: "heading", level: 2, content: "Money rules: spend on evidence, not hope" },
          {
            type: "paragraph",
            content:
              "One of the most common early mistakes is spending money on things that feel productive but do not actually test anything. A premium logo, a custom website theme, three months of software subscriptions before your first listing is live. That is spending on hope.",
          },
          {
            type: "paragraph",
            content:
              "The alternative is spending on evidence. A small ad budget to test whether anyone clicks. A few product samples to check quality. A marketplace listing fee to see if anyone buys.",
          },
          {
            type: "bullets",
            items: [
              "What is your monthly maximum? The total you can spend each month without stress. You can increase it later when revenue starts coming in.",
              "How much goes to tools and how much goes to testing? Keep tool costs as low as possible early on and direct the rest toward testing real ideas with real customers.",
            ],
          },
        ],
      },
      {
        id: "chapter-4-step-4-decision-rules",
        title: "Decision rules and data over ego",
        inlineWorksheetFieldKeys: [
          "minimum_experiment_duration",
          "kill_criteria",
          "continue_criteria",
          "escalation_criteria",
          "data_over_ego_commitment",
        ],
        blocks: [
          { type: "heading", level: 2, content: "Decision rules: know when to stop, continue, or push harder" },
          {
            type: "paragraph",
            content:
              "This is the most valuable part of your Founder Rules and the part most people skip. Before you start testing any product idea, decide in advance what the results would need to look like to stop, continue, or invest more.",
          },
          {
            type: "bullets",
            items: [
              "Stop: not because you failed, but because the evidence told you this idea is not the right fit right now.",
              "Continue: because the early signs are encouraging even if the results are not dramatic yet.",
              "Invest more: because the results are strong enough to justify increasing your time, budget, or effort.",
            ],
          },
          {
            type: "callout",
            style: "insight",
            title: "Data over ego",
            content:
              "Your personal attachment to an idea is not a reason to keep going. Evidence is. Write a version of this commitment in your own words: the act of writing it down makes it real.",
          },
          {
            type: "image",
            brief:
              "A simple visual showing three paths branching from a central decision point. Left path labelled 'Stop: try a different idea'. Middle path labelled 'Continue: give it more time'. Right path labelled 'Invest more: the numbers support it'. Calm decision tree, each path feels like a positive, informed outcome.",
            alt: "Decision tree showing three outcome paths: stop, continue, or invest more.",
            src: null,
          },
        ],
      },
      {
        id: "chapter-4-step-5-red-line-rules",
        title: "Red-line rules",
        inlineWorksheetFieldKeys: ["red_line_rules"],
        blocks: [
          { type: "heading", level: 2, content: "Red-line rules: your non-negotiables" },
          {
            type: "paragraph",
            content:
              "These are the boundaries you will not cross regardless of how things are going. They protect you from the most common traps that pull new sellers off track.",
          },
          {
            type: "bullets",
            items: [
              "I will not skip my weekly review.",
              "I will not add a new tool or subscription without removing one I am not using.",
              "I will not increase my spending beyond my monthly cap without hitting my escalation criteria.",
              "I will track every expense and every sale from day one.",
            ],
          },
          {
            type: "callout",
            style: "tip",
            content:
              "That last one matters more than it might seem right now. Keeping a record of income and expenses from the very start saves enormous hassle later. Depending on where you live, you may also need to register as self-employed or understand basic tax requirements for selling online.",
          },
        ],
      },
      {
        id: "chapter-4-step-6-you-now-have-an-operating-system",
        title: "You now have an operating system",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "You now have an operating system" },
          {
            type: "paragraph",
            content:
              "Look at what you have built in this chapter. A realistic time commitment. A spending limit that protects your finances. Decision rules that will tell you what to do when results come in. A commitment to following the evidence. And a set of non-negotiable boundaries.",
          },
          {
            type: "paragraph",
            content:
              "This is your operating system. It is the foundation that makes everything else in this course work. When you feel unsure about a decision in a later chapter, come back here. Your rules will tell you what to do.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Next up: putting your product ideas through the numbers to see which ones can actually make you money. This is where the shortlist gets shorter, and that is a very good thing.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // PHASE 2: SET YOUR RULES AND TEST
  // ─────────────────────────────────────────────────────────────

  "know-your-numbers": {
    chapter: {
      id: "chapter-5",
      number: 5,
      slug: "know-your-numbers",
      title: "Know Your Numbers Before You Commit",
      phase: 2,
      phaseLabel: "Set Your Rules and Test",
      estimatedReadMinutes: 15,
      worksheetId: "unit-economics-worksheet",
      canvasSections: ["product_economics"],
    },
    steps: [
      {
        id: "chapter-5-step-1-the-chapter-that-saves-you-money",
        title: "The chapter that saves you the most money",
        blocks: [
          { type: "heading", level: 2, content: "The chapter that saves you the most money" },
          {
            type: "paragraph",
            content:
              "This is not a finance lesson. This is a survival skill. For every product you sell, there is a simple question: after all the costs are paid, how much do you actually keep? If the answer is 'not much' or 'less than nothing,' it does not matter how many people want the product. You will lose money selling it.",
          },
          { type: "heading", level: 3, content: "The maths is simple (genuinely)" },
          {
            type: "paragraph",
            content:
              "Selling price minus all costs equals your margin. That is it. The skill is in making sure you have counted all the costs, because the ones you miss are the ones that quietly eat your profit.",
          },
          { type: "heading", level: 3, content: "The costs most beginners miss" },
          {
            type: "paragraph",
            content:
              "Product cost is only the starting point. The full picture includes shipping to the customer (including packaging), platform fees (typically 3–15%), payment processing (roughly 2–3%), returns allowance (plan for 3–10% of orders), and, if you hold stock, shipping from the supplier to you.",
          },
          {
            type: "table",
            headers: ["Cost line", "Amount"],
            rows: [
              ["Selling price", "£25.00"],
              ["Product cost", "−£7.00"],
              ["Shipping to customer", "−£3.50"],
              ["Packaging", "−£1.00"],
              ["Platform fee (10%)", "−£2.50"],
              ["Payment processing (3%)", "−£0.75"],
              ["Returns allowance (5%)", "−£1.25"],
              ["Margin per sale", "£10.00"],
            ],
          },
          {
            type: "callout",
            style: "insight",
            content:
              "If that margin were £2 instead of £10, you would need to sell five times as many products to make the same money. A small cost increase could tip you into losing money on every sale.",
          },
          { type: "heading", level: 3, content: "A quick margin health check" },
          {
            type: "table",
            headers: ["Margin after all costs", "What it usually means", "Decision"],
            rows: [
              ["40%+ of selling price", "You have room for mistakes, discounts, and some paid testing.", "Strong candidate"],
              ["25-40%", "Workable, but you need to watch fees, shipping, and ad spend carefully.", "Continue with caution"],
              ["10-25%", "Thin. One missed cost, return, or discount can remove most of the profit.", "Revise before testing"],
              ["Below 10% or negative", "The product may sell, but the business probably does not work.", "Reject or rethink"],
            ],
          },
          {
            type: "callout",
            style: "example",
            content:
              "Example: a product selling for £18 with £4 margin looks profitable at first. But if one in ten orders is returned, or you need to spend £5 to acquire a customer, the profit disappears. A product selling for £25 with £10 margin gives you far more room to learn.",
          },
        ],
      },
      {
        id: "chapter-5-step-2-shipping-and-complexity",
        title: "Shipping and product complexity",
        blocks: [
          { type: "heading", level: 2, content: "Shipping: the cost that shapes your pricing" },
          {
            type: "paragraph",
            content:
              "You have three options: free shipping, where you absorb the cost and the product price must be high enough to cover it; charged shipping, where the customer pays but some abandon at checkout; or flat-rate shipping, a fixed fee regardless of order size.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "There is no universally right answer. What matters is that you know your shipping cost per order and factor it into your unit economics before you set your price.",
          },
          {
            type: "table",
            headers: ["Shipping choice", "Works best when", "Watch out for"],
            rows: [
              ["Free shipping", "The item is light, shipping is predictable, and the product price can absorb the cost.", "You may underprice if you forget shipping is still being paid by you."],
              ["Charged shipping", "The product is heavier, bulky, or shipping varies by location.", "Some buyers abandon when the delivery fee appears at checkout."],
              ["Flat-rate shipping", "Most orders cost roughly the same to send.", "If a few orders cost much more, they can wipe out profit."],
            ],
          },
          {
            type: "paragraph",
            content:
              "For your first test, avoid products where shipping is hard to predict. Very heavy, fragile, oversized, or regulated items can still become good businesses later, but they add operational risk before you have learned the basics.",
          },
          { type: "heading", level: 2, content: "Product complexity: when one product becomes twenty" },
          {
            type: "paragraph",
            content:
              "Some products are straightforward: one SKU, one listing, one set of stock to buy. Others multiply quickly. A single t-shirt design in 5 sizes and 4 colours is 20 SKUs. If your supplier has a minimum order quantity of 50 per variant, you are buying 1,000 units before your first sale.",
          },
          {
            type: "paragraph",
            content:
              "This does not mean avoid these categories. It means know what you are signing up for. The principle: start with the minimum viable range. If it sells, expand. If it does not, you have risked much less.",
          },
          {
            type: "callout",
            style: "example",
            content:
              "Better first version: one colour, one size, one bundle, or one best-selling variant. You are not trying to serve every possible customer yet. You are trying to prove that one clear version can sell profitably.",
          },
          {
            type: "image",
            brief:
              "A visual comparison showing two products side by side. Left: 'Simple product: 1 SKU' showing a single item with a small stock pile. Right: 'Variant product: 20 SKUs' showing a t-shirt with a grid of size/colour combinations each needing stock. Right side feels busier, but the tone is neutral. The message is 'know what you are choosing.'",
            alt: "Comparison of a simple 1-SKU product versus a complex multi-variant product showing the stock implications.",
            src: null,
          },
        ],
      },
      {
        id: "chapter-5-step-3-talking-to-suppliers",
        title: "Talking to suppliers",
        blocks: [
          { type: "heading", level: 2, content: "Talking to suppliers" },
          {
            type: "paragraph",
            content:
              "If your sourcing model involves suppliers, you need real numbers from real suppliers, not estimates from your imagination. Suppliers want to sell to you. You are not bothering them by asking questions.",
          },
          { type: "heading", level: 3, content: "A template that works" },
          {
            type: "callout",
            style: "example",
            content:
              "\"Hello, I am interested in [product name]. Could you please provide: price per unit for quantities of 50/100/500, minimum order quantity, sample cost and shipping time, and production lead time for a first order. Thank you.\"",
          },
          {
            type: "table",
            headers: ["Question to ask", "Why it matters"],
            rows: [
              ["What is the minimum order quantity?", "This tells you how much money is at risk before you know the product sells."],
              ["What is the price at 50, 100, and 500 units?", "This shows whether margins improve as you grow."],
              ["What does a sample cost, including shipping?", "A sample is your cheapest quality-control decision."],
              ["What are production and dispatch times?", "Slow lead times can create stockouts or customer delays."],
              ["Can you confirm packaging size and weight?", "You need this to estimate shipping accurately."],
            ],
          },
          { type: "heading", level: 3, content: "What to look for" },
          {
            type: "paragraph",
            content:
              "Quick replies, detailed answers, and willingness to send samples are all good signs. Vague answers, pressure to place large orders immediately, or inability to provide samples are warning signs.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Samples are essential. Never place a bulk order without seeing a sample first. A £20 sample that reveals poor quality saves you from a £500 order of products you cannot sell.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "A supplier who answers clearly helps you make calm decisions. A supplier who makes the numbers hard to understand makes your business harder to run. Treat clarity as part of the offer.",
          },
        ],
      },
      {
        id: "chapter-5-step-4-score-with-real-numbers",
        title: "Score your ideas with real numbers",
        inlineWorksheetFieldKeys: ["idea_economics", "chosen_idea", "reason_for_choice"],
        blocks: [
          { type: "heading", level: 2, content: "Score your ideas with real numbers" },
          {
            type: "paragraph",
            content:
              "Put each of your shortlisted ideas through the numbers. Use real figures wherever possible: actual supplier quotes, actual shipping rates, actual platform fees. Where you do not have real numbers yet, use conservative estimates.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "You do not need to open a separate spreadsheet for this. Add the cost, fee, and selling price numbers in the worksheet fields below. The worksheet calculates margin and shows a viability signal before you make the final decision.",
          },
          {
            type: "paragraph",
            content:
              "Once you have run the numbers, you will likely find that some ideas have strong margins and some do not. The ones with thin or negative margins get eliminated here, regardless of how promising the demand signals were.",
          },
          {
            type: "table",
            headers: ["Score", "What you are looking for"],
            rows: [
              ["Demand evidence", "People already search for, buy, review, or ask for this kind of product."],
              ["Margin", "After all costs, the product still leaves enough profit to make the effort worthwhile."],
              ["Operational simplicity", "You can source, list, pack, and ship it without too many moving parts."],
              ["Test speed", "You can get it listed or sampled quickly without committing a large amount of money."],
              ["Learning value", "Even if it does not become your final product, the test will teach you something useful."],
            ],
          },
          {
            type: "paragraph",
            content:
              "You do not need a perfect score. You need a product that is good enough to test without putting your time or money at unnecessary risk. If two ideas look similar, choose the one that is simpler and cheaper to test.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "This is your data-over-ego commitment from Chapter 4 in action. A product with fantastic demand and terrible margins is not a business. It is a way to stay very busy while losing money.",
          },
          {
            type: "callout",
            style: "example",
            content:
              "Decision example: Idea A has exciting demand but only £3 margin after costs and needs 12 variants. Idea B has steadier demand, £9 margin, and one simple SKU. For a first seller, Idea B is usually the calmer, smarter test.",
          },
          {
            type: "loop",
            message:
              "If none of your ideas survive the numbers, take a breath. This is the process working exactly as it should. You have just avoided investing weeks of effort and real money into products that would not have been profitable. Head back to Chapter 3, explore different categories or price points, and run the numbers again.",
            targets: [
              { chapterSlug: "brainstorm-with-discipline", label: "Back to Chapter 3: Brainstorm with Discipline" },
            ],
          },
        ],
      },
      {
        id: "chapter-5-step-5-you-know-which-idea-can-make-money",
        title: "You now know which idea can make money",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "You now know which idea can actually make money" },
          {
            type: "paragraph",
            content:
              "Not which idea sounds best. Not which idea you like most. Which idea has real demand (Chapter 3) and real margins (this chapter). If you have one or more ideas that passed both filters, you are in a strong position.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The next chapter is where it gets real: you are going to test your idea by listing it for sale on an existing marketplace and finding out whether someone will actually hand over money for it. Your first sale could be days away.",
          },
          {
            type: "paragraph",
            content:
              "As soon as your first listing goes live, start tracking. The Metrics section, available in the navigation, has a marketplace testing log built for this phase. It asks five simple questions each week: how many people saw your listing, how many clicked, how many bought, what you made per sale, and what you noticed. Logging from week one means you have data to learn from, not just results to wonder about.",
          },
        ],
      },
    ],
  },

  "test-before-you-build": {
    chapter: {
      id: "chapter-6",
      number: 6,
      slug: "test-before-you-build",
      title: "Test Before You Build a Store",
      phase: 2,
      phaseLabel: "Set Your Rules and Test",
      estimatedReadMinutes: 13,
      worksheetId: "pre-store-test-worksheet",
      canvasSections: ["pre_store_validation"],
    },
    steps: [
      {
        id: "chapter-6-step-1-your-first-sale-and-choose-marketplace",
        title: "Your first sale could happen this week",
        inlineWorksheetFieldKeys: ["test_idea", "test_marketplace"],
        blocks: [
          { type: "heading", level: 2, content: "Your first sale could happen this week" },
          {
            type: "paragraph",
            content:
              "You have a product idea backed by evidence. You know the numbers work. Now the question is: will someone actually buy it? You could spend weeks building a full store to find out. Or you could list it on a marketplace where millions of buyers are already shopping and get your answer much faster.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Before you choose the marketplace, confirm which idea you are testing in the worksheet below. This keeps the test attached to the same product candidate you researched in Chapter 3 and checked in Chapter 5.",
          },
          { type: "heading", level: 2, content: "Why marketplaces first" },
          {
            type: "paragraph",
            content:
              "Marketplaces like eBay, Etsy, Amazon, Vinted, and Facebook Marketplace already have buyers. When you list on a marketplace, you are borrowing their audience to test your product. If it does not sell in front of an existing audience of active buyers, the issue is likely the product, the price, or the listing: not a lack of traffic. That clarity is incredibly valuable.",
          },
          { type: "heading", level: 2, content: "Choose your test marketplace" },
          {
            type: "paragraph",
            content:
              "eBay works well for almost anything. Vinted is ideal for fashion and accessories. Etsy suits handmade items, digital products, and vintage goods. Amazon suits products with high search volume. Facebook Marketplace is useful for local testing. Pick the one where your target buyer is most likely to be shopping.",
          },
          {
            type: "table",
            headers: ["Marketplace", "Best first use", "What to watch"],
            rows: [
              ["eBay", "General products, resale, parts, accessories, and price testing.", "Competition can be broad. Look at sold listings, not only active listings."],
              ["Etsy", "Handmade, personalised, vintage, digital, and giftable products.", "Photos, search terms, and niche positioning matter a lot."],
              ["Vinted", "Fashion, accessories, and simple resale tests.", "Great for speed, but less useful for proving a standalone brand."],
              ["Facebook Marketplace", "Local, bulky, or second-hand products.", "Buyer intent can be mixed. Expect messages that do not always turn into sales."],
              ["Amazon", "Products with strong search demand and clear existing categories.", "Harder for a beginner. Fees, competition, and listing rules are stricter."],
            ],
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Do not choose the marketplace you personally like most. Choose the one where the buyer is already looking for this kind of product. A boring match beats an exciting guess.",
          },
        ],
      },
      {
        id: "chapter-6-step-2-write-listing-and-set-duration",
        title: "Write your first listing",
        inlineWorksheetFieldKeys: ["product_listed", "listing_price", "test_duration"],
        blocks: [
          { type: "heading", level: 2, content: "Write your first listing" },
          {
            type: "paragraph",
            content:
              "You will learn how to write polished listings in Chapter 9. For now, you just need something clear, honest, and good enough. Title: what it is, who it is for, one key detail. Description: what the product does, what is included, key dimensions, and shipping information.",
          },
          {
            type: "table",
            headers: ["Listing element", "Good enough for this test"],
            rows: [
              ["Title", "Product type, key use case, and one specific detail. Example: compact dog seat cover for small cars."],
              ["Main photo", "Clear, bright, and easy to understand at thumbnail size."],
              ["Description", "What it is, who it helps, dimensions, condition, what's included, and shipping details."],
              ["Price", "High enough to protect the Chapter 5 margin, but still believable next to similar listings."],
              ["Shipping", "Clear dispatch time, delivery method, and whether tracking is included."],
            ],
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Photos: natural light near a window, clean background, multiple angles. You do not need professional photography at this stage: you need clarity and honesty.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "A fair test does not mean a perfect listing. It means the product was presented clearly enough that a real buyer could understand it, trust it, and decide whether to buy.",
          },
          { type: "heading", level: 2, content: "Set your test duration" },
          {
            type: "paragraph",
            content:
              "Decide in advance how long you will run this test before judging the results. A reasonable test duration is 2 to 4 weeks. Write it down before you list: this prevents you from pulling the listing after three days because you are impatient, or leaving it up for months because you are avoiding a decision.",
          },
          {
            type: "paragraph",
            content:
              "For low-cost products or fast-moving categories, two weeks may be enough to see a signal. For higher-priced or more niche products, four weeks is usually fairer. The goal is not to force a sale. The goal is to collect enough evidence to make the next decision calmly.",
          },
        ],
      },
      {
        id: "chapter-6-step-3-when-it-sells",
        title: "When it sells: ship it well",
        blocks: [
          { type: "heading", level: 2, content: "When it sells: ship it well" },
          {
            type: "paragraph",
            content:
              "Pack it properly. Ship promptly: aim to dispatch within one to two business days. Use tracked shipping whenever the cost is reasonable. Send a brief message to the buyer confirming dispatch and providing the tracking number.",
          },
          {
            type: "table",
            headers: ["After a sale", "Why it matters"],
            rows: [
              ["Dispatch quickly", "Fast dispatch builds trust and reduces buyer anxiety."],
              ["Use sensible packaging", "Damage in transit can turn a promising test into a misleading failure."],
              ["Message the buyer", "A short dispatch note feels professional and can encourage a positive review."],
              ["Record what happened", "Questions, delays, returns, and reviews are part of the test result."],
            ],
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Many sellers skip post-purchase communication. Standing out is easy when the bar is low. A short, friendly dispatch message builds trust and often leads to positive reviews.",
          },
        ],
      },
      {
        id: "chapter-6-step-4-read-results-and-decide",
        title: "Read the results and decide",
        inlineWorksheetFieldKeys: ["result", "units_sold", "what_you_learned", "decision"],
        blocks: [
          { type: "heading", level: 2, content: "Read the results" },
          {
            type: "paragraph",
            content:
              "It sold: excellent. How quickly? How many units? Did buyers ask questions that reveal what they needed more information about? Interest but no sale: something about the listing needs work (price, photos, or description). Views but no engagement: the title or main image may not be grabbing attention. Very few views: a search visibility issue, likely in your title keywords.",
          },
          {
            type: "table",
            headers: ["Result", "Likely meaning", "Next move"],
            rows: [
              ["Sold quickly", "The product, price, and listing were good enough to convert.", "Proceed carefully or repeat the test with a small restock."],
              ["Sold slowly", "There is some demand, but the offer may need sharpening.", "Improve photos, title, price, or description before scaling."],
              ["Questions but no sale", "People are interested, but something is unclear or risky.", "Answer the repeated questions directly in the listing."],
              ["Views but no clicks", "The title, thumbnail, price, or category may not be compelling.", "Retest the listing presentation before judging the product."],
              ["Clicks but no sale", "People understand the idea but hesitate at the offer.", "Review price, trust signals, photos, shipping, and objections."],
              ["Very few views", "The marketplace may not be showing the listing to the right people.", "Improve keywords/category or test a different marketplace."],
            ],
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Use the result fields below when the test period ends. If the test is still running, leave the result open and keep logging weekly metrics until the agreed end date.",
          },
          { type: "heading", level: 2, content: "Make your decision" },
          {
            type: "paragraph",
            content:
              "This is where your kill/continue/escalate rules from Chapter 4 come in. Proceed to building your store if the product sold or generated strong interest. Iterate and retest if results were mixed. Pivot to a different product if there was little interest despite a fair test: this is not failure, this is exactly what the test was designed to discover.",
          },
          {
            type: "callout",
            style: "example",
            content:
              "Example: 400 views, 30 clicks, 5 questions about sizing, and no sales is not the same as failure. It may mean the idea has interest, but the listing needs clearer dimensions, better photos, or a lower-risk first offer before you retest.",
          },
          {
            type: "loop",
            message:
              "If your first product test did not work out, remember where you are. You have researched demand signals, run unit economics, and learned from a real marketplace test. Pick your next idea and run the test again. The loop gets faster every time.",
            targets: [
              { chapterSlug: "brainstorm-with-discipline", label: "Back to Chapter 3: Brainstorm with Discipline" },
            ],
          },
        ],
      },
      {
        id: "chapter-6-step-5-what-this-test-proves",
        title: "What this test proves",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "What this test proves" },
          {
            type: "paragraph",
            content:
              "A successful marketplace test proves that someone who does not know you is willing to pay real money for your product. That is powerful validation.",
          },
          {
            type: "paragraph",
            content:
              "What it does not prove is that you can build a profitable, repeatable business around it. That depends on whether you can drive your own traffic, acquire customers at a sustainable cost, and encourage repeat purchases: skills you will build in the chapters ahead.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "You now have something most aspiring sellers never get: evidence. Not a guess, not a hope, not a plan. A real transaction with a real customer. The next phase is exciting. Let's keep going.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // PHASE 3: BUILD YOUR OFFER
  // ─────────────────────────────────────────────────────────────

  "pick-your-customer": {
    chapter: {
      id: "chapter-7",
      number: 7,
      slug: "pick-your-customer",
      title: "Pick Your Customer",
      phase: 3,
      phaseLabel: "Build Your Offer",
      estimatedReadMinutes: 10,
      worksheetId: "customer-profile-worksheet",
      canvasSections: ["customer", "problem"],
    },
    steps: [
      {
        id: "chapter-7-step-1-you-already-know-more",
        title: "You already know more than you think",
        blocks: [
          { type: "heading", level: 2, content: "You already know more than you think" },
          {
            type: "paragraph",
            content:
              "You have tested your product on a real marketplace. You have seen who viewed it, who asked questions, and who bought. That is real customer data, even if it is a small sample.",
          },
          { type: "heading", level: 2, content: "Why 'everyone' is not a customer" },
          {
            type: "paragraph",
            content:
              "Trying to sell to everyone means you end up speaking to no one in particular. Think about it from the buyer's perspective. Which listing would you click: 'Car seat cover. Fits all vehicles. Great for pets, kids, and general use.' or 'Compact dog seat cover designed for small cars. Waterproof, folds flat for easy storage, machine washable.'?",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The second listing describes fewer people. But the people it does describe feel like it was made for them. They are far more likely to click, read, and buy. You are not excluding customers: you are attracting the right ones.",
          },
        ],
      },
      {
        id: "chapter-7-step-2-define-niche-customer",
        title: "Define your niche customer",
        inlineWorksheetFieldKeys: ["customer_description"],
        blocks: [
          { type: "heading", level: 2, content: "Define your niche customer" },
          {
            type: "paragraph",
            content:
              "A niche customer is not a tiny market. It is a focused starting point. Answer these questions as specifically as you can: Who feels this problem most? What is their situation (time-poor, on a budget, new to something)? What words do they use? That last one is crucial: go back to the reviews and forum posts from Chapter 3 and use their language.",
          },
          {
            type: "callout",
            style: "example",
            content:
              "Useful: 'First-time dog owners, aged 25–40, who drive smaller cars and need a seat cover that does not take over the back seat. They search for \"small car dog seat cover\" or \"easy clean dog seat protector.\"' This tells you what to sell, how to describe it, where to advertise, and which search terms to target.",
          },
        ],
      },
      {
        id: "chapter-7-step-3-find-where-they-gather",
        title: "Find where they gather",
        inlineWorksheetFieldKeys: ["core_problem", "where_they_gather"],
        blocks: [
          { type: "heading", level: 2, content: "Find where they gather" },
          {
            type: "paragraph",
            content:
              "Your customer is already talking about their problem somewhere online. Search Reddit, Facebook groups, hobbyist forums, and YouTube comment sections. Look for phrases like 'does anyone know where to find,' 'I wish someone would make,' or 'looking for recommendations.' These are real people describing unmet needs in their own words.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Write down three to five specific places where your customer gathers. You will use these in Chapter 11 when you start driving traffic, so the work you do now pays off directly later.",
          },
        ],
      },
      {
        id: "chapter-7-step-4-what-they-value-and-trust",
        title: "What they value most",
        inlineWorksheetFieldKeys: ["what_they_value_most", "what_builds_trust"],
        blocks: [
          { type: "heading", level: 2, content: "What they value most" },
          {
            type: "paragraph",
            content:
              "The most common purchase drivers are: Price (best deal), Convenience (easiest solution), Quality and durability, Uniqueness, and Problem solved completely. Most customers have a primary driver and one or two secondary ones. Identify your customer's primary driver and build your messaging around it.",
          },
          { type: "heading", level: 2, content: "What would make them trust a new seller?" },
          {
            type: "paragraph",
            content:
              "Your customer has never heard of you. Specificity builds trust: vague listings feel untrustworthy. Honesty about limitations ('this fits hatchbacks and small SUVs') signals you know your product. Responsive communication, a clear returns policy, and an about section that tells your story all contribute.",
          },
        ],
      },
      {
        id: "chapter-7-step-5-you-now-know-who",
        title: "You now know who you are talking to",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "You now know who you are talking to" },
          {
            type: "paragraph",
            content:
              "At the start of this chapter, you had a product. Now you have a product and a customer. You know who they are, where they spend time online, what they value, and what would make them trust you.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Most sellers skip this work entirely and write generic listings aimed at nobody in particular. You will not make that mistake. Next up: turning your product and your customer profile into an offer that stands out.",
          },
        ],
      },
    ],
  },

  "shape-your-offer": {
    chapter: {
      id: "chapter-8",
      number: 8,
      slug: "shape-your-offer",
      title: "Shape Your Offer",
      phase: 3,
      phaseLabel: "Build Your Offer",
      estimatedReadMinutes: 10,
      worksheetId: "offer-worksheet",
      canvasSections: ["value_proposition", "solution"],
    },
    steps: [
      {
        id: "chapter-8-step-1-product-is-not-an-offer",
        title: "A product is not an offer",
        blocks: [
          { type: "heading", level: 2, content: "A product is not an offer" },
          {
            type: "paragraph",
            content:
              "An offer is the complete package that makes someone choose your thing over every other option. Two sellers can sell an identical product and have completely different results because their offers are different. One wraps it in generic packaging with a bland description. The other positions it for a specific customer, prices it confidently, and backs it with a clear promise.",
          },
          { type: "heading", level: 2, content: "What is your customer doing right now?" },
          {
            type: "paragraph",
            content:
              "You are competing against whatever your customer is doing today to deal with the problem. They might be buying a competitor's product they are not happy with. They might be using a workaround. They might be ignoring the problem because nothing seemed worth the effort. Knowing which situation your customer is in changes how you talk about your product.",
          },
        ],
      },
      {
        id: "chapter-8-step-2-position-and-minimum-viable",
        title: "Position against the alternatives",
        inlineWorksheetFieldKeys: ["key_differentiator", "minimum_viable_version"],
        blocks: [
          { type: "heading", level: 2, content: "Position against the alternatives" },
          {
            type: "paragraph",
            content:
              "Positioning is not about being better at everything. It is about being clearly better at the thing your customer cares about most. Look back at the purchase drivers from Chapter 7. Your positioning should lead with that.",
          },
          { type: "heading", level: 2, content: "The minimum viable offer" },
          {
            type: "paragraph",
            content:
              "Resist the temptation to over-build your first offer. Your first offer needs to be good enough to sell, not perfect enough to win a design award. For most products that is: one product, one or two variants at most, clean and functional packaging, a strong listing, and a fair competitive price.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "A useful principle: launch version one, learn from real customers, then build version two. Version two will be better than anything you could have designed in isolation because it will be shaped by evidence.",
          },
        ],
      },
      {
        id: "chapter-8-step-3-name-and-positioning-statement",
        title: "Name it and describe it",
        inlineWorksheetFieldKeys: ["offer_summary", "positioning_statement"],
        blocks: [
          { type: "heading", level: 2, content: "Name it and describe it" },
          {
            type: "paragraph",
            content:
              "Your product name needs to be clear and searchable right now: 'Heavy-Duty Waterproof Dog Seat Cover' works perfectly at this stage. Your positioning statement is one sentence: '[Product] for [customer] who need [key benefit]: [differentiator].' This is your internal clarity tool, not a tagline. Every decision about your listing, pricing, photos, and marketing should be consistent with it.",
          },
          {
            type: "callout",
            style: "example",
            content:
              "Example: 'Heavy-duty seat cover for dog owners with small cars who need something that fits without taking over the back seat: waterproof, compact, and machine washable.'",
          },
        ],
      },
      {
        id: "chapter-8-step-4-price-and-margin-check",
        title: "Price it with confidence",
        inlineWorksheetFieldKeys: ["final_price", "margin_after_all_costs"],
        blocks: [
          { type: "heading", level: 2, content: "Price it with confidence" },
          {
            type: "paragraph",
            content:
              "Your floor is the minimum price that gives you a viable margin after all costs: calculated in Chapter 5. Your ceiling is the highest price your customer would consider reasonable. Your sweet spot is somewhere between them where the margin is healthy and the price feels fair relative to the alternatives.",
          },
          { type: "heading", level: 2, content: "Check: does your margin still work?" },
          {
            type: "paragraph",
            content:
              "Re-run the unit economics with your final selling price. As a rough early benchmark: if your margin per sale is at least 40% of the selling price, you are in a reasonable position. If it is below 25%, you may find it difficult to advertise profitably.",
          },
          {
            type: "loop",
            message:
              "If your margins do not work at any price the customer would accept, this idea may not be viable as a standalone product. Could you offer a smaller version, a different material, a bundle, or a digital complement that improves the economics? If not, revisit your Chapter 5 shortlist.",
            targets: [
              { chapterSlug: "know-your-numbers", label: "Back to Chapter 5: Know Your Numbers" },
            ],
          },
        ],
      },
      {
        id: "chapter-8-step-5-your-offer-is-ready",
        title: "Your offer is ready",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "Your offer is ready" },
          {
            type: "paragraph",
            content:
              "Look at what you have built across Chapters 2 through 8. You chose a sourcing model, brainstormed with evidence, set operating rules, ran the numbers, tested on a marketplace, identified your customer, and now have a positioned, priced offer.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The next phase is about getting your store ready and writing listings that do the selling for you. You already have all the raw material: a product, a customer, a price, and a positioning statement. Now you are going to put it all together.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // PHASE 4: GET YOUR STORE READY
  // ─────────────────────────────────────────────────────────────

  "write-listings-that-sell": {
    chapter: {
      id: "chapter-9",
      number: 9,
      slug: "write-listings-that-sell",
      title: "Write Listings That Sell",
      phase: 4,
      phaseLabel: "Get Your Store Ready",
      estimatedReadMinutes: 12,
      worksheetId: "product-listing-worksheet",
      canvasSections: ["solution"],
    },
    steps: [
      {
        id: "chapter-9-step-1-your-listing-is-your-salesperson",
        title: "Your listing is your salesperson",
        inlineWorksheetFieldKeys: ["product_title"],
        blocks: [
          { type: "heading", level: 2, content: "Your listing is your salesperson" },
          {
            type: "paragraph",
            content:
              "A great product with a weak listing will sit unsold. A decent product with a strong listing will outsell it every time. The good news is that writing a strong listing is a learnable skill, and you already have most of the raw material from Chapters 7 and 8.",
          },
          { type: "heading", level: 2, content: "Write a title that gets found and gets clicked" },
          {
            type: "paragraph",
            content:
              "Your title has two jobs: contain the words people search for, and be compelling enough to click. Start with core search terms from Chapter 3. Then add specificity: size, key feature, material, compatibility.",
          },
          {
            type: "table",
            headers: ["Before", "After"],
            rows: [
              ["Dog Seat Cover", "Waterproof Dog Car Seat Cover: Universal Fit, Heavy-Duty, Machine Washable"],
              ["Phone Case", "Slim Silicone Phone Case for iPhone 15: Drop Protection, Matte Black"],
              ["Planner", "Weekly Planner for Freelancers: Undated, Project Tracking, A5 Size"],
            ],
          },
        ],
      },
      {
        id: "chapter-9-step-2-write-a-description",
        title: "Write a description that answers every question",
        inlineWorksheetFieldKeys: ["product_description_draft", "objections_addressed"],
        blocks: [
          { type: "heading", level: 2, content: "Write a description that answers every question" },
          {
            type: "paragraph",
            content:
              "Lead with the problem and the solution, not a list of features. Then cover the specifics: what the product does, exact dimensions and materials, what is included, compatibility, care instructions, and shipping details.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Address objections before they arise. Think about why someone might hesitate: 'Will it fit?' 'Is it easy to install?' 'What if it does not work?' Build the answers into your description. Every objection you answer is a customer you do not lose at checkout.",
          },
        ],
      },
      {
        id: "chapter-9-step-3-take-photos",
        title: "Take photos that build confidence",
        inlineWorksheetFieldKeys: ["key_images_needed", "images_captured"],
        blocks: [
          { type: "heading", level: 2, content: "Take photos that build confidence" },
          {
            type: "paragraph",
            content:
              "Your photos are the closest thing to a physical experience the buyer gets. Natural light near a window is your best tool: never use your phone's flash. Use a clean background (a sheet of white card is all you need). Aim for: a front view, back view, close-up of key details, a scale shot, and an in-use shot.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The in-use shot is particularly powerful. A seat cover photographed flat on white looks like fabric. The same cover installed in a car with a dog sitting on it tells a story the buyer can see themselves in.",
          },
        ],
      },
      {
        id: "chapter-9-step-4-social-proof",
        title: "Social proof when you are starting from zero",
        blocks: [
          { type: "heading", level: 2, content: "Social proof when you are starting from zero" },
          {
            type: "paragraph",
            content:
              "You may not have reviews yet. But you can include lifestyle photos showing the product in use, specific details about where and how it is made, and a genuine about section. While you are building your review count, the specificity, clarity, and honesty of your listing do the trust-building work.",
          },
          {
            type: "paragraph",
            content:
              "When customers do leave reviews: positive or negative: respond promptly and professionally. How you respond to a negative review matters more than the review itself, because every future buyer will read your response. A thoughtful response to a negative review actually builds trust.",
          },
        ],
      },
      {
        id: "chapter-9-step-5-your-listing-is-ready",
        title: "Your listing is ready to work for you",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "Your listing is ready to work for you" },
          {
            type: "paragraph",
            content:
              "You now have a product title built for search and clicks, a description that sells by answering every question, photos that build confidence, and a plan for gathering social proof.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "This listing is not just a description of your product. It is your best salesperson, working around the clock. Next up: assembling your store so buyers can find it, trust it, and check out with confidence.",
          },
        ],
      },
    ],
  },

  "what-your-store-needs": {
    chapter: {
      id: "chapter-10",
      number: 10,
      slug: "what-your-store-needs",
      title: "What Your Store Actually Needs",
      phase: 4,
      phaseLabel: "Get Your Store Ready",
      estimatedReadMinutes: 8,
      worksheetId: "store-readiness-checklist",
      canvasSections: [],
    },
    steps: [
      {
        id: "chapter-10-step-1-choose-platform",
        title: "It is simpler than you think",
        inlineWorksheetFieldKeys: ["platform_chosen"],
        blocks: [
          { type: "heading", level: 2, content: "It is simpler than you think" },
          {
            type: "paragraph",
            content:
              "Modern e-commerce platforms are designed for people who are not technical. Shopify, WooCommerce, Squarespace, Big Cartel, Etsy: every one of them walks you through setup with guided steps, templates, and built-in tools. You do not write code. You fill in forms, choose options, and upload the content you created in Chapter 9.",
          },
          { type: "heading", level: 2, content: "Choose your platform" },
          {
            type: "paragraph",
            content:
              "Shopify is the most popular choice: handles everything in one package, ideal for a standalone branded store. Etsy gives you existing buyer traffic, best for creative and unique products. WooCommerce is free but requires more technical setup. Big Cartel is simpler and cheaper with a free tier for small catalogues. Amazon gives access to an enormous buyer base but is the most competitive environment.",
          },
        ],
      },
      {
        id: "chapter-10-step-2-essential-building-blocks",
        title: "The essential building blocks",
        inlineWorksheetFieldKeys: ["product_page_live", "about_page_live", "contact_method_visible", "returns_policy_published"],
        blocks: [
          { type: "heading", level: 2, content: "The essential building blocks" },
          {
            type: "paragraph",
            content:
              "Every store needs: a product page (your Chapter 9 listing, formatted correctly and checked on mobile), an about page (a few honest paragraphs answering who you are, why you started, and why they should buy from you), visible contact information (at minimum an email address), and a clear returns and refunds policy.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Check your product page on your phone before you consider it done. More than half of online shopping happens on mobile. If the buy button is hard to find on a small screen, you will lose sales.",
          },
        ],
      },
      {
        id: "chapter-10-step-3-payment-and-legal",
        title: "Payment processing and legal pages",
        inlineWorksheetFieldKeys: ["payment_processing_active", "privacy_policy_live", "store_tested_with_friend"],
        blocks: [
          { type: "heading", level: 2, content: "Payment processing" },
          {
            type: "paragraph",
            content:
              "Your platform will guide you through connecting Stripe and PayPal. Offer both: PayPal in particular is worth enabling because many buyers feel safer using it when buying from a store they have not purchased from before.",
          },
          { type: "heading", level: 2, content: "Legal pages and checkout testing" },
          {
            type: "paragraph",
            content:
              "Most platforms provide templates for a privacy policy and terms of service. Use them. Before you launch, go through the entire buying process yourself: add to cart, go to checkout, confirm that everything works, and check that the order confirmation email sends.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Ask a friend or family member to go through your store as a real customer. Fresh eyes catch things you cannot see because you have been staring at it for too long.",
          },
        ],
      },
      {
        id: "chapter-10-step-4-what-ready-means",
        title: "What 'ready' actually means",
        closingStep: true,
        inlineWorksheetFieldKeys: ["store_url"],
        blocks: [
          { type: "heading", level: 2, content: "What 'ready' actually means" },
          {
            type: "paragraph",
            content:
              "Your store does not need to be perfect. It needs to be functional, trustworthy, and clear. A buyer should be able to land on your store, understand what you sell, find the product, feel confident enough to buy, and check out without friction.",
          },
          {
            type: "loop",
            message:
              "If something in this checklist is blocking you and you cannot figure it out, search for your specific platform's help documentation or community forum. You are not the first person to hit this snag, and the answer is almost certainly already written down. Do not let a single technical hiccup stop your momentum.",
            targets: [
              { chapterSlug: "write-listings-that-sell", label: "Back to Chapter 9: Write Listings That Sell" },
            ],
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Most people who talk about starting an online business never get to this point. You are here. The next phase is the exciting one: getting real customers to your store.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // PHASE 5: GET CUSTOMERS
  // ─────────────────────────────────────────────────────────────

  "free-traffic": {
    chapter: {
      id: "chapter-11",
      number: 11,
      slug: "free-traffic",
      title: "Free Traffic: Start Without Spending",
      phase: 5,
      phaseLabel: "Get Customers",
      estimatedReadMinutes: 10,
      worksheetId: "traffic-plan-worksheet",
      canvasSections: ["channels_free"],
    },
    steps: [
      {
        id: "chapter-11-step-1-your-store-is-open",
        title: "Your store is open: now people need to find it",
        blocks: [
          { type: "heading", level: 2, content: "Your store is open. Now people need to find it." },
          {
            type: "paragraph",
            content:
              "Free traffic takes more time and patience than paid ads, but the visitors you attract through these methods are often more engaged because they found you through genuine interest. And critically: if your listing does not convert free traffic, paying for traffic will just mean losing money faster.",
          },
          { type: "heading", level: 2, content: "Share in communities (without being the person everyone ignores)" },
          {
            type: "paragraph",
            content:
              "The approach that works: first become a genuine member. Spend time participating, answering questions, sharing useful information. Then, when someone asks a question your product solves, mention it. A single genuine recommendation from a trusted community member can drive more sales than a dozen promotional posts everyone scrolls past.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Be transparent. If the community has rules about self-promotion, follow them. 'Full disclosure, this is my product, but I think it is relevant' is honest and usually well received.",
          },
        ],
      },
      {
        id: "chapter-11-step-2-seo-and-social-media",
        title: "Basic SEO and social media as distribution",
        blocks: [
          { type: "heading", level: 2, content: "Basic SEO: help people find you when they search" },
          {
            type: "paragraph",
            content:
              "SEO at this stage comes down to one principle: use the words your customer uses. You have already done most of this work. In Chapter 9 you wrote a product title using the search terms your customer uses and a description that naturally includes their language. That is SEO in practice.",
          },
          {
            type: "paragraph",
            content:
              "A few additional things: customise your page titles and meta descriptions with your key search terms. Name your image files descriptively (waterproof-dog-seat-cover-installed.jpg). Add alt text to each image. SEO results take time, but every piece of content you create with the right language is a small investment that compounds over weeks and months.",
          },
          { type: "heading", level: 2, content: "Social media as distribution, not a branding project" },
          {
            type: "paragraph",
            content:
              "Pick one platform: the one where your customer spends time. Show the product in context: a 15-second video of it being used, a before-and-after showing the problem and solution. Post consistently at a sustainable pace. Three posts per week for 12 weeks beats daily posts for 2 weeks followed by silence.",
          },
        ],
      },
      {
        id: "chapter-11-step-3-network-and-channels",
        title: "Your personal network and tracking what works",
        inlineWorksheetFieldKeys: ["free_channels_chosen", "community_plan"],
        blocks: [
          { type: "heading", level: 2, content: "Your personal network (used respectfully)" },
          {
            type: "paragraph",
            content:
              "The right approach: a direct, specific message to people who might genuinely know someone in your target audience. 'I have just launched a seat cover designed for dog owners with smaller cars. You probably do not need one, but if you know anyone who might, I would really appreciate you sending them the link.' This is honest, specific, and asks for a referral rather than a pity purchase.",
          },
          { type: "heading", level: 2, content: "Track what is working" },
          {
            type: "paragraph",
            content:
              "As traffic starts coming in, pay attention to where it comes from. Your store analytics shows traffic sources. Check them during your weekly review. Knowing that your Reddit comments drive 10 times more traffic than Instagram tells you where to focus your limited time.",
          },
        ],
      },
      {
        id: "chapter-11-step-4-patience-and-first-actions",
        title: "Free traffic takes patience",
        inlineWorksheetFieldKeys: ["posting_frequency", "first_week_actions"],
        blocks: [
          { type: "heading", level: 2, content: "Free traffic takes patience, and that is fine" },
          {
            type: "paragraph",
            content:
              "You may not see results in the first week. Communities take time to build trust in. SEO takes time to index. Social media takes time to find its audience. The consistency principle from your Founder Rules applies here: small, regular effort over weeks will build a steady stream of visitors.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The Reddit comment you post today might drive traffic for months. That is the beauty of free traffic: once it is built, it keeps delivering without ongoing cost. And it tells you whether your listing converts: essential knowledge before you start spending money on ads.",
          },
        ],
      },
      {
        id: "chapter-11-step-5-you-are-building-momentum",
        title: "You are building momentum",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "You are building momentum" },
          {
            type: "paragraph",
            content:
              "You have a live store, a listing that sells, and traffic flowing in. Some of those visitors are becoming customers.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The next chapter teaches you how to accelerate this with paid advertising. Small budgets, simple tests, clear signals. You already know your listing works. Paid ads simply put it in front of more of the right people.",
          },
        ],
      },
    ],
  },

  "paid-ads-small-budget": {
    chapter: {
      id: "chapter-12",
      number: 12,
      slug: "paid-ads-small-budget",
      title: "Paid Ads: Small Budget Testing",
      phase: 5,
      phaseLabel: "Get Customers",
      estimatedReadMinutes: 12,
      worksheetId: "ad-test-worksheet",
      canvasSections: ["channels_paid"],
    },
    steps: [
      {
        id: "chapter-12-step-1-accelerate-and-how-ads-work",
        title: "Now you can accelerate",
        blocks: [
          { type: "heading", level: 2, content: "Now you can afford to accelerate" },
          {
            type: "paragraph",
            content:
              "You have proven something important with free traffic: people visit your store and some of them buy. Your listing converts. Putting more of the right people in front of that listing should mean more sales. That is what paid advertising does.",
          },
          { type: "heading", level: 2, content: "How paid ads actually work" },
          {
            type: "paragraph",
            content:
              "When you run an ad, you tell the platform: here is my ad, here is the type of person I want to see it, here is my daily budget. The platform shows it to matching people and charges you based on interactions. You set a daily budget and the platform will not exceed it. You can pause or stop at any time. This makes testing very low risk.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "For most physical products, Meta (Facebook and Instagram) is the best starting point. The targeting is sophisticated, the audience is enormous, and the ad creation tools are straightforward. Start with one platform before adding others.",
          },
        ],
      },
      {
        id: "chapter-12-step-2-set-up-first-test",
        title: "Set up your first test",
        inlineWorksheetFieldKeys: ["ad_platform", "daily_budget", "test_duration", "target_audience_description"],
        blocks: [
          { type: "heading", level: 2, content: "Set up your first test" },
          {
            type: "paragraph",
            content:
              "Keep your first test deliberately simple. You are trying to answer one question: can paid ads bring you customers at a cost that makes sense? Budget: £5 to £10 per day. Duration: at least 7 days. Audience: use your customer profile from Chapter 7. The ad: your best product photo, a short benefit-led message, a clear call to action. Send traffic directly to your product page.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Check that your daily budget fits within your monthly cap from Chapter 4 before you start. A 7-day test at £7/day costs £49: confirm that is comfortable before you launch.",
          },
        ],
      },
      {
        id: "chapter-12-step-3-numbers-that-matter",
        title: "The numbers that matter",
        blocks: [
          { type: "heading", level: 2, content: "The numbers that matter (and what they actually mean)" },
          {
            type: "paragraph",
            content:
              "CTR (click-through rate): the percentage who clicked on your ad. Above 1.5% is a positive sign. Low CTR means the ad image or message is not resonating.",
          },
          {
            type: "paragraph",
            content:
              "CPC (cost per click): how much you pay each time someone clicks. Only matters in relation to what those clicks are worth. A £1 CPC that leads to a £15 profit sale is better than a £0.10 CPC where nobody buys.",
          },
          {
            type: "paragraph",
            content:
              "Conversion rate: the percentage of visitors who purchased. 1–3% is normal for a new store. Below 1% suggests your listing or price needs work.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "CPA (cost per acquisition) is the most important number. Total ad spend ÷ number of sales. Compare it directly to your margin per sale from Chapter 5. If your margin is £10 and CPA is £8, you make £2 profit per sale. If CPA is £15, you lose £5 per sale.",
          },
        ],
      },
      {
        id: "chapter-12-step-4-read-results",
        title: "Read your results and decide",
        inlineWorksheetFieldKeys: ["ctr_after_test", "cpc_after_test", "conversion_rate_after_test", "cpa_after_test", "cpa_vs_margin", "decision"],
        blocks: [
          { type: "heading", level: 2, content: "Read your results and decide" },
          {
            type: "paragraph",
            content:
              "Strong signal: CTR above 1.5% and CPA at or below your margin: continue and consider a gradual 20–30% budget increase. Mixed signal: decent CTR but CPA above your margin: work on the product page, price, or targeting. Weak signal: low CTR: try a different image, headline, or audience. No sales despite 200+ visitors: the issue is almost certainly the product page or offer.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Fill in the result fields after your test period. These are designed to be empty while you are learning the theory: come back when you have real data.",
          },
        ],
      },
      {
        id: "chapter-12-step-5-update-founder-rules",
        title: "Update your Founder Rules with real numbers",
        inlineWorksheetFieldKeys: ["updated_kill_criteria", "updated_continue_criteria", "updated_escalation_criteria"],
        blocks: [
          { type: "heading", level: 2, content: "Update your Founder Rules with real numbers" },
          {
            type: "paragraph",
            content:
              "You now have real data. Real numbers from real customers responding to real ads. Go back to your Founder Rules and update your kill, continue, and escalation criteria with specific thresholds. These rules are no longer abstract: they are grounded in evidence from your own business.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Avoid common mistakes: do not change the ad after two days (the algorithm needs time), do not target too broadly or too narrowly, do not judge results by likes and comments, and do not increase budget too fast after early success.",
          },
          {
            type: "loop",
            message:
              "If your first ad test did not produce profitable results, that is not a signal to stop advertising. It is a signal to diagnose and adjust. Was the CTR low (ad problem) or the conversion rate low (page or offer problem)? Most successful ad campaigns took several rounds of testing.",
            targets: [
              { chapterSlug: "paid-ads-small-budget", label: "Back to Chapter 12: Paid Ads on a Small Budget" },
            ],
          },
        ],
      },
      {
        id: "chapter-12-step-6-you-have-a-customer-acquisition-engine",
        title: "You now have a customer acquisition engine",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "You now have a customer acquisition engine" },
          {
            type: "paragraph",
            content:
              "A free traffic foundation that brings steady visitors. A paid advertising channel you can dial up or down. Clear numbers that tell you exactly what each customer costs and what each customer is worth.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The next chapter adds the third piece: getting the customers you have already paid to acquire to come back and buy again. Because the cheapest customer is always the one you already have.",
          },
        ],
      },
    ],
  },

  "email-and-repeat-customers": {
    chapter: {
      id: "chapter-13",
      number: 13,
      slug: "email-and-repeat-customers",
      title: "Email and Repeat Customers",
      phase: 5,
      phaseLabel: "Get Customers",
      estimatedReadMinutes: 10,
      worksheetId: "email-retention-worksheet",
      canvasSections: ["revenue_streams"],
    },
    steps: [
      {
        id: "chapter-13-step-1-most-valuable-customer",
        title: "The most valuable customer already knows you",
        blocks: [
          { type: "heading", level: 2, content: "The most valuable customer already knows you" },
          {
            type: "paragraph",
            content:
              "Every customer you have acquired cost you something. If they buy once and never return, you need to find a brand new person for every future sale. But if they buy a second time, the second purchase costs you almost nothing to generate. The revenue is almost entirely profit.",
          },
          { type: "heading", level: 2, content: "Why email beats social media for revenue" },
          {
            type: "paragraph",
            content:
              "You do not own your social media audience. The platform decides who sees your posts through its algorithm, and organic reach is typically 2–10% of followers. Email is different: when you send an email, it lands in the inbox. Open rates for e-commerce emails are 15–25%, vastly higher than social media reach. And subscribers have given you permission to contact them.",
          },
        ],
      },
      {
        id: "chapter-13-step-2-start-collecting-emails",
        title: "Start collecting emails from day one",
        inlineWorksheetFieldKeys: ["email_collection_method", "incentive_offered"],
        blocks: [
          { type: "heading", level: 2, content: "Start collecting emails from day one" },
          {
            type: "paragraph",
            content:
              "Do not wait until you have a large store. Add an email signup form now. The key is offering something in return: a discount on the first order, early access to new products, or a useful piece of content related to your product. The discount approach is the most effective for most stores.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Mailchimp has a generous free tier for up to 500 subscribers. Klaviyo is popular specifically for e-commerce. Many platforms like Shopify also have built-in email features. The tool matters far less than actually sending emails.",
          },
        ],
      },
      {
        id: "chapter-13-step-3-your-first-three-emails",
        title: "Your first three emails",
        inlineWorksheetFieldKeys: ["welcome_email_subject", "welcome_email_key_message"],
        blocks: [
          { type: "heading", level: 2, content: "Your first three emails" },
          {
            type: "paragraph",
            content:
              "You need three emails that go out automatically to every new subscriber. Email 1 (immediately): welcome and deliver your promise: include the discount code or promised content, a warm intro, and a link to your best product. Email 2 (day 2–3): your story: why you started this business, in genuine and specific terms. Email 3 (day 5–7): the product with a clear reason to buy: benefit-led, address the main hesitation, clear link.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Write these three emails once and they work for every person who signs up, forever. That is leverage: a few hours of work that runs on autopilot indefinitely.",
          },
        ],
      },
      {
        id: "chapter-13-step-4-after-the-sale",
        title: "After the sale: repeat customers and LTV",
        inlineWorksheetFieldKeys: ["post_purchase_follow_up_plan", "repeat_purchase_strategy"],
        blocks: [
          { type: "heading", level: 2, content: "After the sale: turn a buyer into a returning customer" },
          {
            type: "paragraph",
            content:
              "The purchase is the beginning of the relationship, not the end. A post-purchase sequence: order confirmation (customise it to feel personal), shipping notification (with tracking), follow-up 7–14 days after delivery (check in, catch problems before they become bad reviews, ask for a review), then a repeat purchase prompt 30–60 days later.",
          },
          { type: "heading", level: 2, content: "Customer lifetime value: the number that changes everything" },
          {
            type: "paragraph",
            content:
              "If your margin is £10 and CPA is £8, you make £2 on the first sale. But if that customer buys three times over the next year, your total margin is £30 from an £8 acquisition cost: a £22 total profit. This means you could afford a CPA of up to £29 and still break even over a year. Suddenly campaigns that looked unprofitable on a single sale become highly profitable.",
          },
        ],
      },
      {
        id: "chapter-13-step-5-you-now-have-three-engines",
        title: "You now have three engines",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "You now have three engines" },
          {
            type: "paragraph",
            content:
              "Engine 1: Free traffic: communities, social media, and SEO at no cost. Engine 2: Paid advertising: a tested, measured channel you can dial up or down. Engine 3: Email and retention: a system that brings existing customers back.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "These three engines work together. Free traffic tests your listing. Paid ads accelerate what is working. Email turns one-time buyers into repeat customers. The next phase is about reading your numbers and making evidence-based decisions.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // PHASE 6: MEASURE, LEARN, GROW
  // ─────────────────────────────────────────────────────────────

  "read-your-numbers": {
    chapter: {
      id: "chapter-14",
      number: 14,
      slug: "read-your-numbers",
      title: "Read Your Numbers",
      phase: 6,
      phaseLabel: "Measure, Learn, Grow",
      estimatedReadMinutes: 10,
      worksheetId: null,
      canvasSections: [],
    },
    steps: [
      {
        id: "chapter-14-step-1-guessing-vs-knowing",
        title: "The difference between guessing and knowing",
        blocks: [
          { type: "heading", level: 2, content: "The difference between guessing and knowing" },
          {
            type: "paragraph",
            content:
              "You have a live store, traffic from multiple channels, customers buying, and emails going out. The question is: how do you know what is actually working? Most small store owners operate on feeling. This chapter teaches you to replace feelings with facts.",
          },
          { type: "heading", level: 2, content: "The six numbers that matter right now" },
          {
            type: "paragraph",
            content:
              "Your business generates a lot of data. Most of it is noise. These six are signal: Traffic (visitors per week: find in your store analytics), Conversion rate (percentage who bought: orders ÷ visitors × 100), Average order value (total revenue ÷ orders), CPA (ad spend ÷ ad-attributed sales: only if running ads), Margin per sale (from your own records: the one number platforms will not calculate for you), Email list growth (new subscribers this week).",
          },
          {
            type: "image",
            brief:
              "A simple dashboard-style visual showing six cards in a 2x3 grid. Each card has an icon, metric name, example number, and a one-line interpretation. Traffic: 340 visitors ('Steady'). Conversion: 2.4% ('Healthy'). AOV: £22 ('Consistent'). CPA: £9.50 ('Below margin: profitable'). Margin: £10.80. Email subscribers: 47 new ('Growing'). Should feel like a calm weekly check-in, not an overwhelming analytics tool.",
            alt: "Six-card dashboard showing the key weekly business metrics.",
            src: null,
          },
        ],
      },
      {
        id: "chapter-14-step-2-where-to-find-numbers",
        title: "Where to find your numbers",
        blocks: [
          { type: "heading", level: 2, content: "Where to find your numbers" },
          {
            type: "paragraph",
            content:
              "Store platform (Shopify, WooCommerce, etc.): traffic, conversion rate, average order value, revenue, orders. Ad platform (Meta Ads Manager, Google Ads): impressions, clicks, CTR, CPC, conversions. Email tool (Mailchimp, Klaviyo): subscriber count, open rates, click rates. Your own spreadsheet: actual product costs, real margins, total expenses: the source of truth that no platform dashboard captures.",
          },
          { type: "heading", level: 2, content: "What 'good' looks like at your stage" },
          {
            type: "paragraph",
            content:
              "Conversion rate: 1–3% is normal, below 1% needs attention, above 3% is strong. CPA: only matters relative to your margin: is CPA below margin per sale? Email open rate: 15–25% is healthy for e-commerce. Do not compare to large brands. Compare to your own numbers from last week. The trend matters more than the absolute number.",
          },
        ],
      },
      {
        id: "chapter-14-step-3-weekly-review-ritual",
        title: "Your weekly review ritual",
        blocks: [
          { type: "heading", level: 2, content: "Your weekly review ritual" },
          {
            type: "paragraph",
            content:
              "Once your store is live, this is the ritual you will repeat every week for as long as you run your business. Step 1 (5 min): collect your six numbers. Step 2 (5 min): compare to last week: up, down, or flat? Step 3 (5 min): identify one thing that worked. Step 4 (5 min): identify one thing to change. Step 5 (5 min): plan next week.",
          },
          {
            type: "paragraph",
            content:
              "You are reading this before your store is live, so you do not have numbers to log yet. That is fine: this chapter is about understanding the system so that when data starts arriving, you already know what to do with it.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Twenty to thirty minutes total. The discipline of doing this every single week is what separates businesses that improve from businesses that drift.",
          },
        ],
      },
      {
        id: "chapter-14-step-4-update-founder-rules",
        title: "Update your Founder Rules",
        blocks: [
          { type: "heading", level: 2, content: "Update your Founder Rules" },
          {
            type: "paragraph",
            content:
              "Your Founder Rules from Chapter 4 were written before you had real data. Once you have a few weeks of real numbers, revisit them and sharpen them: kill criteria can include specific numbers, continue criteria can reference trends, escalation criteria can be grounded in evidence.",
          },
          {
            type: "paragraph",
            content:
              "You will do this update for real once your store has been running. For now, understand that the rules you wrote are a starting point: they become more precise and more useful as data arrives.",
          },
          {
            type: "callout",
            style: "example",
            content:
              "'I will stop if conversion stays below 1% after two listing revisions and 500 visitors.' Updated rules like this are not just numbers on a page: they are the decision-making system that tells you exactly what to do when results come in.",
          },
        ],
      },
      {
        id: "chapter-14-step-5-managing-a-real-business",
        title: "You are now managing a real business",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "You are now managing a real business" },
          {
            type: "paragraph",
            content:
              "Take a moment to recognise what is happening. You are not planning a business. You are running one, with real customers, real revenue, and real data that you review and act on every week.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The next chapter teaches you what to do when the numbers tell you something needs to change: whether that means small adjustments or a bigger shift, you will have a clear framework for deciding.",
          },
        ],
      },
    ],
  },

  "iterate-and-pivot": {
    chapter: {
      id: "chapter-15",
      number: 15,
      slug: "iterate-and-pivot",
      title: "Iterate and Pivot",
      phase: 6,
      phaseLabel: "Measure, Learn, Grow",
      estimatedReadMinutes: 10,
      worksheetId: "iteration-decision-worksheet",
      canvasSections: [],
    },
    steps: [
      {
        id: "chapter-15-step-1-diagnose-before-you-decide",
        title: "Diagnose before you decide",
        inlineWorksheetFieldKeys: ["current_diagnosis", "evidence_for_diagnosis"],
        blocks: [
          { type: "heading", level: 2, content: "Something is not working. That is normal." },
          {
            type: "paragraph",
            content:
              "No business runs perfectly, especially not a new one. The good news is that you have data. You know your numbers, you know your trends, and you have decision rules. Before you decide what to do, figure out where the problem actually is.",
          },
          { type: "heading", level: 2, content: "Diagnose before you decide" },
          {
            type: "paragraph",
            content:
              "Low traffic, everything else fine → marketing channels problem (Chapters 11–12). Good traffic, low conversion → product page, price, or offer problem (Chapters 8–9). Good conversion but CPA too high → advertising efficiency problem (Chapter 12). Good conversion but margin too thin → cost structure problem (Chapter 5). Mixed results with no clear pattern → you may need more time or more data.",
          },
        ],
      },
      {
        id: "chapter-15-step-2-iterate-small-changes",
        title: "Iterate: small changes, one at a time",
        inlineWorksheetFieldKeys: ["planned_iteration", "expected_outcome"],
        blocks: [
          { type: "heading", level: 2, content: "Iterate: small changes, one at a time" },
          {
            type: "paragraph",
            content:
              "Once you have diagnosed the problem, make one change at a time and measure the result. If you change your ad image, rewrite your description, and lower your price all in the same week, and sales go up: which change caused the improvement? You have fixed the problem but learned nothing.",
          },
          {
            type: "callout",
            style: "tip",
            content:
              "Keep a record of what you tested, why you changed it, and what happened. Three months of documented experiments is a goldmine of knowledge about your business that no competitor has.",
          },
        ],
      },
      {
        id: "chapter-15-step-3-when-to-pivot",
        title: "When to pivot",
        blocks: [
          { type: "heading", level: 2, content: "When to pivot (and what that actually means)" },
          {
            type: "paragraph",
            content:
              "A pivot is not failure. It is a disciplined response to evidence. Consider a pivot when: you have exhausted reasonable iterations and the numbers still do not work, the demand you thought existed was not as strong as signals suggested, or a different opportunity has emerged with stronger evidence.",
          },
          { type: "heading", level: 2, content: "What pivoting looks like in practice" },
          {
            type: "paragraph",
            content:
              "Product pivot: switch product, keep customer. Customer pivot: same product, different audience. Channel pivot: same product and customer, different traffic source. Offer pivot: same product, different packaging, price, or positioning. The key: change one element at a time so you can measure the impact.",
          },
          {
            type: "loop",
            message:
              "If you have decided to pivot, take a moment to write down what you learned from the approach you are leaving behind. What worked? What did not? What surprised you? This is the raw material that makes your next attempt better. The most successful sellers are not the ones who got it right the first time: they are the ones who learned the most from each round.",
            targets: [
              { chapterSlug: "brainstorm-with-discipline", label: "Back to Chapter 3: Brainstorm with Discipline" },
            ],
          },
        ],
      },
      {
        id: "chapter-15-step-4-when-not-to-pivot",
        title: "When not to pivot",
        inlineWorksheetFieldKeys: ["iteration_result", "decision"],
        blocks: [
          { type: "heading", level: 2, content: "When not to pivot" },
          {
            type: "paragraph",
            content:
              "A bad week is not a reason to pivot. A seasonal dip is not a reason to pivot. A single negative review is not a reason to pivot. Impatience is the most common cause of premature pivots.",
          },
          {
            type: "paragraph",
            content:
              "Go back to your minimum experiment duration from Chapter 4. Have you given this approach enough time? Have you tested enough iterations to be confident the problem is fundamental rather than fixable? The data-over-ego commitment works in both directions: it means sticking with an approach when the evidence is still developing, not just walking away from ideas you love.",
          },
        ],
      },
      {
        id: "chapter-15-step-5-making-better-decisions",
        title: "You are making better decisions than most",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "You are making better decisions than most" },
          {
            type: "paragraph",
            content:
              "Whether you are iterating on something that is nearly working or pivoting to a fresh approach, you are making decisions based on evidence. Most small business owners never do this.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The next chapter is for the moment when the evidence says something wonderful: it is working. Your numbers are hitting your escalation criteria. Revenue is growing. And you need to decide what to do with that momentum.",
          },
        ],
      },
    ],
  },

  "what-changes-when-it-works": {
    chapter: {
      id: "chapter-16",
      number: 16,
      slug: "what-changes-when-it-works",
      title: "What Changes When It Works",
      phase: 6,
      phaseLabel: "Measure, Learn, Grow",
      estimatedReadMinutes: 10,
      worksheetId: "growth-strategy-worksheet",
      canvasSections: [],
    },
    steps: [
      {
        id: "chapter-16-step-1-you-have-earned-this",
        title: "You have earned this chapter",
        blocks: [
          { type: "heading", level: 2, content: "You have earned this chapter" },
          {
            type: "paragraph",
            content:
              "Your product is selling. Your CPA is within target. Conversion is stable. Customers are coming back. Revenue is growing week on week. This is the moment most founders dream about. It is also the moment where many of them make mistakes that undo everything they have built: growing too fast, adding too many products, spreading too thin.",
          },
          { type: "heading", level: 2, content: "Recognise what 'working' actually looks like" },
          {
            type: "paragraph",
            content:
              "Look for: consistent performance over at least four weeks (not a single spike), positive unit economics confirmed by real data (actual margin matches projection), and systems that are functioning (orders shipped on time, weekly review happening, email sequences running). If any of these is shaky, strengthen it first. Growth amplifies everything, including problems.",
          },
        ],
      },
      {
        id: "chapter-16-step-2-scale-grow-and-ad-spend",
        title: "Scale versus grow",
        inlineWorksheetFieldKeys: ["growth_strategy", "reason"],
        blocks: [
          { type: "heading", level: 2, content: "Scale versus grow: know the difference" },
          {
            type: "paragraph",
            content:
              "Growing means doing more of the same: more ad spend, more products, more hours. Scaling means increasing revenue without proportionally increasing time or cost: automating sequences, improving conversion rate, negotiating better supplier terms. Both have their place. Be intentional about which one you are doing.",
          },
          { type: "heading", level: 2, content: "Increase ad spend gradually" },
          {
            type: "paragraph",
            content:
              "The safe approach: increase your ad budget by 20–30% at a time. Run for at least a week at the new level. Check whether CPA remains within your range. If it does, increase again. If CPA rises above your target, pull back. This sounds slow. It is also how you scale ad spend without losing money.",
          },
          { type: "heading", level: 2, content: "Add products or go deeper?" },
          {
            type: "paragraph",
            content:
              "Is there more to gain from the current product? Does a second product serve the same customer? Can you handle the operational complexity? If you add a product, apply the same process: validate demand, run the numbers, test before committing.",
          },
        ],
      },
      {
        id: "chapter-16-step-3-second-store",
        title: "A second store: when it makes sense",
        inlineWorksheetFieldKeys: ["second_store_considerations"],
        blocks: [
          { type: "heading", level: 2, content: "A second store: when it makes sense" },
          {
            type: "paragraph",
            content:
              "When it makes sense: your first store is operationally stable, could run for a week without your daily involvement, you have identified a different market with strong demand evidence, and your Founder Rules can accommodate the additional time and budget.",
          },
          {
            type: "paragraph",
            content:
              "When it does not make sense: your first store still needs significant attention, you are spending most hours managing operations rather than growing, or you are drawn to a second store because the first one feels boring.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "Running two stores is not twice as hard operationally if your processes are solid. But it is roughly twice the mental load. Your attention is your scarcest resource.",
          },
        ],
      },
      {
        id: "chapter-16-step-4-update-founder-rules",
        title: "Update your Founder Rules for the next phase",
        inlineWorksheetFieldKeys: ["new_time_budget", "new_money_cap", "updated_decision_thresholds"],
        blocks: [
          { type: "heading", level: 2, content: "Update your Founder Rules for the next phase" },
          {
            type: "paragraph",
            content:
              "Your business has changed. Your rules should change with it. Time budget: are you spending more hours now, and are they on high-impact activities? Money cap: if revenue is coming in, your cap can shift from 'what I can afford from savings' to 'what the business earns minus what I keep as profit.' Decision thresholds: recalibrate kill, continue, and escalation for a more mature business.",
          },
        ],
      },
      {
        id: "chapter-16-step-5-growth-is-a-continuation",
        title: "Growth is a continuation",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "Growth is a continuation, not a destination" },
          {
            type: "paragraph",
            content:
              "There is no finish line where your business is 'done.' The habits you built in Chapter 4 (rules), Chapter 14 (weekly review), and Chapter 15 (iteration) are not training wheels you remove. They are the operating system that keeps it running well.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The final chapter gives you a permanent home for all of this: your operating dashboard. A place to enter your weekly numbers, track your trends, and keep your entire business picture in one view. Everything you have built across 16 chapters comes together in one place. You are almost there.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // PHASE 7: ONGOING OPERATIONS
  // ─────────────────────────────────────────────────────────────

  "your-operating-dashboard": {
    chapter: {
      id: "chapter-17",
      number: 17,
      slug: "your-operating-dashboard",
      title: "Your Operating Dashboard",
      phase: 7,
      phaseLabel: "Ongoing Operations",
      estimatedReadMinutes: 8,
      worksheetId: null,
      canvasSections: [],
    },
    steps: [
      {
        id: "chapter-17-step-1-everything-you-have-built",
        title: "Everything you have built, in one place",
        blocks: [
          { type: "heading", level: 2, content: "Everything you have built, in one place" },
          {
            type: "paragraph",
            content:
              "Across sixteen chapters you have made more decisions, run more tests, and learned more about building a business than most people manage in a year of reading blog posts. You chose a sourcing model, brainstormed with discipline, set operating rules, ran the numbers, tested on a marketplace, identified your customer, shaped your offer, built your store, wrote listings, drove traffic, built an email system, learned to read your numbers, iterated based on evidence, and started growing.",
          },
          { type: "heading", level: 2, content: "The weekly review is your most important habit" },
          {
            type: "paragraph",
            content:
              "You have been doing weekly reviews since Chapter 4. This chapter formalises it into a permanent practice and gives it a permanent home. Without it, problems go unnoticed until they become expensive. Opportunities get missed. The discipline you built slowly erodes. With it, you catch issues early, double down on what is working, and make evidence-based decisions every single week.",
          },
        ],
      },
      {
        id: "chapter-17-step-2-what-to-review-and-when",
        title: "What to review and when",
        blocks: [
          { type: "heading", level: 2, content: "What to review and when" },
          {
            type: "paragraph",
            content:
              "Weekly (your vital signs): revenue and orders, traffic, conversion rate, CPA, email list growth, one thing that worked and one thing to change. Monthly (deeper check): actual margin per sale from real records, channel performance, email performance, customer feedback patterns. Quarterly (big picture): revisit Founder Rules, assess positioning, check growth direction, review product range.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "The weekly habit is the core and everything else builds outward from it. Twenty to thirty minutes. That is the cost. The return is a business you understand and control.",
          },
        ],
      },
      {
        id: "chapter-17-step-3-entering-your-metrics",
        title: "Entering your metrics",
        blocks: [
          { type: "heading", level: 2, content: "Entering your metrics" },
          {
            type: "paragraph",
            content:
              "Each week, log your numbers in the Metrics dashboard. Over time, this becomes the most valuable record your business has: the history of what happened, what you tried, and what worked. Consistency matters more than precision. A rough weekly entry is infinitely more useful than a perfect monthly entry.",
          },
          { type: "heading", level: 2, content: "How to read your dashboard" },
          {
            type: "paragraph",
            content:
              "Stable metrics are good news: they give you a foundation to test changes from. Gradual trends matter more than single-week changes. Connected metrics tell a story: if traffic is up but revenue is flat, conversion rate has dropped. If CPA is rising but conversion is stable, your ads are getting more expensive. The dashboard shows these relationships when you track everything in one place.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "When your store is live and you have your first week of numbers, head to the Metrics section in the navigation. Log your first entry there and the dashboard will start building your performance history.",
          },
        ],
      },
      {
        id: "chapter-17-step-4-when-dashboard-shows-trouble",
        title: "When the dashboard shows trouble",
        closingStep: true,
        blocks: [
          { type: "heading", level: 2, content: "When the dashboard shows trouble" },
          {
            type: "paragraph",
            content:
              "When something looks wrong, resist the urge to panic or make sweeping changes. Go back to the diagnostic framework from Chapter 15. Your kill criteria from Chapter 4 (updated in Chapter 14) tell you when the situation warrants a bigger decision. The dashboard is not there to make you feel good. It is there to tell you the truth.",
          },
          { type: "heading", level: 2, content: "What happens next" },
          {
            type: "paragraph",
            content:
              "This is the final chapter of the course. But it is not the end of your business. The dashboard is your ongoing operating tool: it works for you every week for as long as you run your business.",
          },
          {
            type: "callout",
            style: "insight",
            content:
              "You started this course wondering if you could do this. You can. You chose a sourcing model, validated an idea, set your rules, tested with real customers, built a store, drove traffic, built an email system, measured everything, learned from the data, and started growing. That is not a side project. That is a business. Now keep building.",
          },
          {
            type: "image",
            brief:
              "A warm, understated illustration. The same person from the Chapter 1 image, at the same desk, but with a live dashboard on their laptop showing positive trend lines. The small icons from Chapter 1 (lightbulb, calculator, storefront, megaphone, chart) are now filled in or completed rather than outlined. The feeling: quiet accomplishment and forward momentum, not fireworks and confetti. A cup of tea nearby.",
            alt: "Person at desk with completed business dashboard showing positive trend lines.",
            src: null,
          },
        ],
      },
    ],
  },
};
