/**
 * data.js — All customizable content lives here.
 * Edit this file directly OR use the Edit Mode in the UI.
 */
const DEFAULT_DATA = {

  hero: {
    badge:  "🎯 MASTER PLAN",
    title:  "Backend, Big Data & FAANG Prep",
    sub1:   "Daily execution plan for OrderStream, system design, DSA, Docker, Kubernetes, cloud, and portfolio growth.",
    sub2:   "Use this as the default plan. If your college or work hours differ, shift the blocks but keep the same order and priorities."
  },

  cards: [
    { label: "PRIMARY GOAL",    title: "Build OrderStream",    desc: "One production-style capstone" },
    { label: "DAILY HABIT",     title: "Code + commit",        desc: "Small progress every day" },
    { label: "INTERVIEW EDGE",  title: "DSA + design",         desc: "Explain tradeoffs clearly" },
    { label: "PORTFOLIO PROOF", title: "Docs + demo",          desc: "Show what works, not just claims" }
  ],

  week: {
    title: "The Ideal Week",
    sub:   "Each day has one main technical theme, one coding deliverable, and one interview maintenance task.",
    days: [
      {
        name: "Mon", color: "#1e3a5f",
        focus:  "FastAPI + clean architecture",
        build:  "Products and orders API",
        theory: "REST, SOLID, validation",
        dsa:    "1 medium problem",
        deliverable: "API commit + notes"
      },
      {
        name: "Tue", color: "#2563eb",
        focus:  "Postgres + Redis cache",
        build:  "Indexes, cache, rate limit",
        theory: "ACID, isolation, EXPLAIN",
        dsa:    "Graph or DP",
        deliverable: "cache demo + tests"
      },
      {
        name: "Wed", color: "#7c3aed",
        focus:  "Kafka + outbox",
        build:  "Publisher and consumer",
        theory: "Partitions, offsets, retry",
        dsa:    "1 medium problem",
        deliverable: "event flow screenshot"
      },
      {
        name: "Thu", color: "#059669",
        focus:  "Spark + data lakehouse",
        build:  "Raw to gold analytics job",
        theory: "Shuffle, partitioning",
        dsa:    "SQL + arrays",
        deliverable: "gold table output"
      },
      {
        name: "Fri", color: "#0e7490",
        focus:  "Testing + observability",
        build:  "pytest, logs, metrics",
        theory: "SLOs, tracing, dashboards",
        dsa:    "Timed problem",
        deliverable: "tests green + metrics"
      },
      {
        name: "Sat", color: "#047857",
        focus:  "Deep build sprint",
        build:  "Integrate week milestone",
        theory: "Docker or K8s deployment",
        dsa:    "2 problems",
        deliverable: "demo video or README"
      },
      {
        name: "Sun", color: "#1d4ed8",
        focus:  "Review + system design",
        build:  "Fix bugs and clean docs",
        theory: "Mock design + STAR stories",
        dsa:    "Light revision",
        deliverable: "next week plan"
      }
    ]
  },

  daily: {
    title: "Ideal Day Blocks",
    sub:   "Keep the same sequence even if you shift the clock. DSA first, project build second, theory after hands-on work.",
    columns: ["TIME", "BLOCK", "WHAT TO DO", "OUTPUT"],
    rows: [
      ["06:30–07:00", "Prime the day",      "Plan 3 tasks, open yesterday's notes, remove distractions",  "Clear target"],
      ["07:00–08:15", "DSA practice",       "One focused LeetCode problem; explain approach aloud",        "Accepted + notes"],
      ["09:00–17:30", "Work, college, life", "Use tiny breaks for reading docs or reviewing flash notes",  "No guilt block"],
      ["18:30–20:30", "OrderStream build",  "Implement one real feature from the weekly theme",            "Working code"],
      ["20:45–21:30", "Theory + design",    "Read docs, draw system design, write tradeoff notes",        "1-page note"],
      ["21:30–22:00", "Close the loop",     "Run tests, commit, write tomorrow's first task",             "Commit done"]
    ]
  },

  exec: {
    title: "Six-Week Execution Map",
    sub:   "This is the fastest sane path from roadmap to portfolio-ready project.",
    weeks: [
      { week: "WEEK 1", name: "API + DB",      color: "#2563eb", desc: "FastAPI, Postgres, migrations, tests",   proof: "Proof: CRUD works" },
      { week: "WEEK 2", name: "Reliability",   color: "#7c3aed", desc: "Idempotency, Redis, auth, pagination",   proof: "Proof: safe retry" },
      { week: "WEEK 3", name: "Events",        color: "#059669", desc: "Outbox, Kafka, workers, retries",        proof: "Proof: event flow" },
      { week: "WEEK 4", name: "Big Data",      color: "#0e7490", desc: "MinIO/S3, Spark, gold analytics",        proof: "Proof: revenue table" },
      { week: "WEEK 5", name: "Ops",           color: "#d97706", desc: "Docker, metrics, logs, load test",       proof: "Proof: dashboard" },
      { week: "WEEK 6", name: "Deploy",        color: "#dc2626", desc: "Kubernetes, cloud, README, demo",        proof: "Proof: portfolio" }
    ]
  },

  longterm: {
    title: "Long-Term Goals",
    sub:   "The north stars that everything else feeds into. Review monthly.",
    items: [
      { icon: "🏢", title: "Land a FAANG/FAANG-adjacent role",      desc: "SWE or Data Engineer at a top-tier company within 12 months",   progress: 25 },
      { icon: "🚀", title: "Ship OrderStream to production",         desc: "Full-stack distributed system with Kafka, Spark, Kubernetes",    progress: 40 },
      { icon: "📈", title: "Portfolio with 3 demo-ready projects",   desc: "Each with README, live demo, and metrics screenshots",           progress: 35 },
      { icon: "🧠", title: "Master system design interviews",        desc: "Solve any design question clearly and explain all tradeoffs",    progress: 30 },
      { icon: "💡", title: "Become a recognized open-source contributor", desc: "Meaningful PRs to tools used by > 1k people",              progress: 10 }
    ]
  },

  shortterm: {
    title: "Short-Term Goals",
    sub:   "Focus items for this week and next. Check off and replace as you go.",
    items: [
      { icon: "✅", title: "Complete FastAPI orders endpoint",        desc: "With Postgres schema, migrations, and Swagger docs",            progress: 80 },
      { icon: "⚡", title: "Solve 5 LeetCode mediums this week",     desc: "Focus: arrays, graphs, and dynamic programming patterns",       progress: 60 },
      { icon: "📝", title: "Write system design note on Kafka",      desc: "1-pager: producers, partitions, consumer groups, at-least-once",progress: 50 },
      { icon: "🔧", title: "Add Redis caching to the orders API",    desc: "Cache-aside pattern with TTL and invalidation on write",        progress: 20 },
      { icon: "📹", title: "Record a 3-min demo video",              desc: "Show the API running end-to-end with Postman collection",       progress: 0  }
    ]
  },

  rules: {
    title: "Rules that make this work",
    body:  "70% building, 20% theory, 10% notes. One commit per day. One demo per week. Sleep before midnight. Missed day? Resume the next block, do not restart the plan."
  }
};
