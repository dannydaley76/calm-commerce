import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";

/* ── Seed data: 20 weeks of realistic e-commerce metrics ──
   Oldest first (week 20 → week 1), submitted_at spaced 7 days apart.
   Revenue trends upward with realistic volatility.
   Based on Thu 16 Apr 2026 as "today" so week 1 = Thu 10 Apr 2026.
──────────────────────────────────────────────────────────── */

type SeedWeek = {
  week_ending: string;
  submitted_at: string; // ISO — spaced 7 days apart
  revenue: string;
  orders: string;
  traffic: string;
  ad_spend?: string;
  new_email_subscribers?: string;
  refunds_returns?: string;
  what_worked?: string;
  what_to_change?: string;
  notes?: string;
};

const SEED_WEEKS: SeedWeek[] = [
  {
    week_ending: "Thu, 20 Nov 2025",
    submitted_at: "2025-11-20T18:00:00Z",
    revenue: "£165",
    orders: "7",
    traffic: "540",
    refunds_returns: "0",
    what_worked: "Organic Pinterest pin drove 3 of the 7 orders.",
    what_to_change: "Product photos are poor quality on mobile — reshoot before next week.",
  },
  {
    week_ending: "Thu, 27 Nov 2025",
    submitted_at: "2025-11-27T18:00:00Z",
    revenue: "£210",
    orders: "9",
    traffic: "615",
    new_email_subscribers: "4",
    refunds_returns: "1",
    what_worked: "Black Friday adjacent — no discounting but rode traffic wave.",
    what_to_change: "Abandoned cart email needs setting up urgently.",
  },
  {
    week_ending: "Thu, 4 Dec 2025",
    submitted_at: "2025-12-04T18:00:00Z",
    revenue: "£290",
    orders: "12",
    traffic: "720",
    ad_spend: "£40",
    new_email_subscribers: "8",
    refunds_returns: "0",
    what_worked: "First paid ad test — £40 spend returned £110 in attributed sales.",
    what_to_change: "Ad creative needs split testing, currently only one version.",
  },
  {
    week_ending: "Thu, 11 Dec 2025",
    submitted_at: "2025-12-11T18:00:00Z",
    revenue: "£340",
    orders: "14",
    traffic: "810",
    ad_spend: "£60",
    new_email_subscribers: "11",
    refunds_returns: "1",
    what_worked: "Christmas gifting angle on product copy increased average order value.",
    what_to_change: "Shipping times on site not accurate — causing support messages.",
    notes: "Pre-Christmas traffic spike starting. Good time to build the email list.",
  },
  {
    week_ending: "Thu, 18 Dec 2025",
    submitted_at: "2025-12-18T18:00:00Z",
    revenue: "£480",
    orders: "19",
    traffic: "1050",
    ad_spend: "£90",
    new_email_subscribers: "17",
    refunds_returns: "2",
    what_worked: "Email to list (43 subscribers) drove 4 orders — 9% conversion from list.",
    what_to_change: "Need a proper post-purchase email sequence, currently nothing goes out.",
  },
  {
    week_ending: "Thu, 25 Dec 2025",
    submitted_at: "2025-12-25T18:00:00Z",
    revenue: "£190",
    orders: "8",
    traffic: "620",
    ad_spend: "£30",
    new_email_subscribers: "3",
    refunds_returns: "0",
    what_worked: "Paused most ads over Christmas — low cost week.",
    what_to_change: "Should have had a gift card option ready for last-minute buyers.",
    notes: "Expected dip. Back to normal next week.",
  },
  {
    week_ending: "Thu, 1 Jan 2026",
    submitted_at: "2026-01-01T18:00:00Z",
    revenue: "£225",
    orders: "10",
    traffic: "670",
    new_email_subscribers: "6",
    refunds_returns: "1",
    what_worked: "New Year resolution angle on social content got organic reach.",
    what_to_change: "January is slow — need to test a new product angle.",
  },
  {
    week_ending: "Thu, 8 Jan 2026",
    submitted_at: "2026-01-08T18:00:00Z",
    revenue: "£310",
    orders: "13",
    traffic: "790",
    ad_spend: "£50",
    new_email_subscribers: "9",
    refunds_returns: "0",
    what_worked: "Reframed product as a solution to a January problem — CTR improved.",
    what_to_change: "Email list growth is the bottleneck — need a lead magnet.",
  },
  {
    week_ending: "Thu, 15 Jan 2026",
    submitted_at: "2026-01-15T18:00:00Z",
    revenue: "£355",
    orders: "15",
    traffic: "870",
    ad_spend: "£65",
    new_email_subscribers: "14",
    refunds_returns: "1",
    what_worked: "Free checklist lead magnet added to site — 14 new subs in one week.",
    what_to_change: "Checklist PDF needs better design, currently looks amateurish.",
    notes: "Lead magnet working better than expected. Double down.",
  },
  {
    week_ending: "Thu, 22 Jan 2026",
    submitted_at: "2026-01-22T18:00:00Z",
    revenue: "£390",
    orders: "16",
    traffic: "930",
    ad_spend: "£70",
    new_email_subscribers: "19",
    refunds_returns: "0",
    what_worked: "Email sequence (3 emails) running now — welcome sequence converting at 8%.",
    what_to_change: "Second email in sequence is too salesy — needs to lead with value.",
  },
  {
    week_ending: "Thu, 29 Jan 2026",
    submitted_at: "2026-01-29T18:00:00Z",
    revenue: "£420",
    orders: "17",
    traffic: "980",
    ad_spend: "£80",
    new_email_subscribers: "22",
    refunds_returns: "2",
    what_worked: "Retargeting ads live — 3.8x ROAS on warm audiences.",
    what_to_change: "Two refunds this week from one product variant — check quality control.",
    notes: "Refund rate needs watching. Both from same SKU.",
  },
  {
    week_ending: "Thu, 5 Feb 2026",
    submitted_at: "2026-02-05T18:00:00Z",
    revenue: "£465",
    orders: "19",
    traffic: "1060",
    ad_spend: "£85",
    new_email_subscribers: "18",
    refunds_returns: "0",
    what_worked: "Fixed faulty SKU — refunds dropped to zero immediately.",
    what_to_change: "Traffic is growing but conversion holding at ~1.8% — needs work.",
  },
  {
    week_ending: "Thu, 12 Feb 2026",
    submitted_at: "2026-02-12T18:00:00Z",
    revenue: "£510",
    orders: "21",
    traffic: "1140",
    ad_spend: "£90",
    new_email_subscribers: "25",
    refunds_returns: "1",
    what_worked: "Valentine's angle on email drove a 12% open rate — best email yet.",
    what_to_change: "Need to test a higher price point — margin is thin at current pricing.",
  },
  {
    week_ending: "Thu, 19 Feb 2026",
    submitted_at: "2026-02-19T18:00:00Z",
    revenue: "£490",
    orders: "20",
    traffic: "1190",
    ad_spend: "£95",
    new_email_subscribers: "21",
    refunds_returns: "0",
    what_worked: "Slight dip but held well — post-Valentine's normalisation expected.",
    what_to_change: "Ad frequency capping needed — same audience being hit too often.",
  },
  {
    week_ending: "Thu, 26 Feb 2026",
    submitted_at: "2026-02-26T18:00:00Z",
    revenue: "£570",
    orders: "23",
    traffic: "1260",
    ad_spend: "£100",
    new_email_subscribers: "28",
    refunds_returns: "1",
    what_worked: "Price test at +£5 worked — same conversion rate, better margin.",
    what_to_change: "Product page still has no reviews — adding a review app this week.",
    notes: "Best margin week so far. Price increase was the right call.",
  },
  {
    week_ending: "Thu, 5 Mar 2026",
    submitted_at: "2026-03-05T18:00:00Z",
    revenue: "£615",
    orders: "24",
    traffic: "1340",
    ad_spend: "£105",
    new_email_subscribers: "31",
    refunds_returns: "0",
    what_worked: "First 5 reviews published — product page conversion up noticeably.",
    what_to_change: "Email unsubscribe rate crept up — content needs to be less promotional.",
  },
  {
    week_ending: "Thu, 12 Mar 2026",
    submitted_at: "2026-03-12T18:00:00Z",
    revenue: "£640",
    orders: "25",
    traffic: "1400",
    ad_spend: "£110",
    new_email_subscribers: "33",
    refunds_returns: "0",
    what_worked: "Bundling two products together increased average order value by 22%.",
    what_to_change: "Bundle page UX is clunky on mobile — needs redesign.",
  },
  {
    week_ending: "Thu, 19 Mar 2026",
    submitted_at: "2026-03-19T18:00:00Z",
    revenue: "£590",
    orders: "23",
    traffic: "1380",
    ad_spend: "£105",
    new_email_subscribers: "27",
    refunds_returns: "2",
    what_worked: "Spring campaign creative performing well on Instagram.",
    what_to_change: "Dip from last week — ad spend not scaling efficiently above £100.",
    notes: "Need to look at whether increasing budget beyond £110 makes sense.",
  },
  {
    week_ending: "Thu, 26 Mar 2026",
    submitted_at: "2026-03-26T18:00:00Z",
    revenue: "£710",
    orders: "27",
    traffic: "1560",
    ad_spend: "£115",
    new_email_subscribers: "38",
    refunds_returns: "1",
    what_worked: "Influencer mention drove a spike — 400 referral visits in one day.",
    what_to_change: "No system to capitalise on influencer traffic. Needed a landing page.",
    notes: "Best week. Influencer was unpaid — worth building that relationship.",
  },
  {
    week_ending: "Thu, 10 Apr 2026",
    submitted_at: "2026-04-10T18:00:00Z",
    revenue: "£780",
    orders: "30",
    traffic: "1680",
    ad_spend: "£120",
    new_email_subscribers: "42",
    refunds_returns: "0",
    what_worked: "Email list now 210 subscribers — list channel drove 8 orders this week.",
    what_to_change: "Conversion rate at 1.79% — still below the 2% target. CRO work needed.",
    notes: "Strong week. Need to make sure this is a trend not a spike.",
  },
];

export async function POST() {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user || !projectId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const access = await getAccessStateForCurrentUser();
    if (!access.canAccessMetrics) {
      return NextResponse.json({ error: "Metrics are part of Calm Commerce OS access." }, { status: 403 });
    }

    // Check if seed has already been run (avoid duplication)
    const { count } = await supabase
      .from("weekly_metrics")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    if ((count ?? 0) >= 10) {
      return NextResponse.json({
        ok: false,
        message: `Seed skipped — project already has ${count} entries.`,
      });
    }

    // Insert all 20 weeks
    const rows = SEED_WEEKS.map((w) => ({
      project_id: projectId,
      week_ending: w.week_ending,
      submitted_at: w.submitted_at,
      data_json: {
        revenue: w.revenue,
        orders: w.orders,
        traffic: w.traffic,
        ...(w.ad_spend ? { ad_spend: w.ad_spend } : {}),
        ...(w.new_email_subscribers ? { new_email_subscribers: w.new_email_subscribers } : {}),
        ...(w.refunds_returns !== undefined ? { refunds_returns: w.refunds_returns } : {}),
        ...(w.what_worked ? { what_worked: w.what_worked } : {}),
        ...(w.what_to_change ? { what_to_change: w.what_to_change } : {}),
        ...(w.notes ? { notes: w.notes } : {}),
      },
    }));

    const { error } = await supabase.from("weekly_metrics").insert(rows);

    if (error) throw error;

    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 },
    );
  }
}
