const BS = "https://betterstack.com";

/** Add customer or partner names here when ready, e.g. "Acme Corp", "Globex". */
export const CUSTOMER_NAMES: string[] = [];

/** Set when you add your logo, e.g. "/logo.svg" or a remote URL. */
export const SITE_LOGO_SVG: string = "";
/** Optional hero logo shown on mobile, e.g. "/logo-3d.png". */
export const SITE_LOGO_3D: string = "";
export const SITE_LOGO_ALT = "Kai KJ";
export const CAROUSEL_CARD_BG = `${BS}/assets/v2/homepage-v3/carousel-card-bg-48b67fdb.png`;

export type HeroSlide = {
  id: string;
  label: string;
  href: string;
  imageSm: string;
  imageLg: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "ebpf-service-map",
    label: "eBPF-based service map",
    href: "/tracing",
    imageSm: `${BS}/assets/v2/homepage-v3/hero-carousel/ebpf-service-map-sm-057621f5.jpg`,
    imageLg: `${BS}/assets/v2/homepage-v3/hero-carousel/ebpf-service-map-13ad9019.jpg`,
  },
  {
    id: "log-management",
    label: "Log management",
    href: "/log-management",
    imageSm: `${BS}/assets/v2/homepage-v3/hero-carousel/log-management-sm-d5401133.jpg`,
    imageLg: `${BS}/assets/v2/homepage-v3/hero-carousel/log-management-bcc38259.jpg`,
  },
  {
    id: "opentelemetry-tracing",
    label: "OpenTelemetry-native tracing",
    href: "/tracing#otel",
    imageSm: `${BS}/assets/v2/homepage-v3/hero-carousel/opentelemetry-tracing-sm-d0d7afcb.jpg`,
    imageLg: `${BS}/assets/v2/homepage-v3/hero-carousel/opentelemetry-tracing-fdfebde4.jpg`,
  },
  {
    id: "infrastructure-monitoring",
    label: "Infrastructure monitoring",
    href: "/infrastructure-monitoring",
    imageSm: `${BS}/assets/v2/homepage-v3/hero-carousel/infrastructure-monitoring-sm-24039d46.jpg`,
    imageLg: `${BS}/assets/v2/homepage-v3/hero-carousel/infrastructure-monitoring-c097b916.jpg`,
  },
  {
    id: "error-tracking",
    label: "AI-native error tracking",
    href: "/error-tracking",
    imageSm: `${BS}/assets/v2/homepage-v3/hero-carousel/error-tracking-sm-c19d17b3.jpg`,
    imageLg: `${BS}/assets/v2/homepage-v3/hero-carousel/error-tracking-8a82c333.jpg`,
  },
  {
    id: "incident-management",
    label: "Incident management",
    href: "/incident-management",
    imageSm: `${BS}/assets/v2/homepage-v3/hero-carousel/incident-management-sm-39247c75.jpg`,
    imageLg: `${BS}/assets/v2/homepage-v3/hero-carousel/incident-management-0eb4e618.jpg`,
  },
  {
    id: "status-page",
    label: "Status page",
    href: "/status-page",
    imageSm: `${BS}/assets/v2/homepage-v3/hero-carousel/status-page-sm-98ab852e.jpg`,
    imageLg: `${BS}/assets/v2/homepage-v3/hero-carousel/status-page-53c30561.jpg`,
  },
  {
    id: "agentic-ai-sre",
    label: "Agentic AI SRE",
    href: "/tracing#sre",
    imageSm: `${BS}/assets/v2/homepage-v3/hero-carousel/agentic-ai-sre-sm-04b13a4b.jpg`,
    imageLg: `${BS}/assets/v2/homepage-v3/hero-carousel/agentic-ai-sre-889c442d.jpg`,
  },
  {
    id: "slack-teams-incidents",
    label: "Resolve incidents in Slack or Teams",
    href: "/incident-management#slack",
    imageSm: `${BS}/assets/v2/homepage-v3/hero-carousel/slack-teams-incidents-sm-a293b33a.jpg`,
    imageLg: `${BS}/assets/v2/homepage-v3/hero-carousel/slack-teams-incidents-d8bf6625.jpg`,
  },
];

export type CarouselCard = {
  title: string;
  description: string;
  href: string;
  width: number;
  image: string;
  imageSm?: string;
  bgImage?: string;
};

export type CarouselSection = {
  title: string;
  exploreHref: string;
  exploreLabel: string;
  sectionClass?: string;
  replaces?: { alt: string; src: string; srcSm?: string; width: number; height: number; className?: string };
  cards: CarouselCard[];
};

export const CAROUSEL_SECTIONS: CarouselSection[] = [
  {
    title: "AI SRE",
    exploreHref: "/ai-sre",
    exploreLabel: "Explore AI SRE",
    sectionClass: "mb-48 mt-32",
    cards: [
      {
        title: "Robust MCP server",
        description:
          "Integrate your logs, metrics, traces, and errors into your existing LLM workflows with a top tier MCP server.",
        href: "https://betterstack.com/demos/uptime-api/#mcp-server",
        width: 720,
        image: `${BS}/assets/v2/homepage-v3/ai-sre/robust-mcp-582d442d.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/ai-sre/robust-mcp-sm-2f6a4691.jpg`,
      },
      {
        title: "Get an AI SRE",
        description: "Claude Code-like UI with the knowledge of your infrastructure.",
        href: "/ai-sre#agent",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/ai-sre/ai-sre-b5c60d29.jpg`,
      },
      {
        title: "Smart incident merging",
        description:
          "10 incidents created at the same time? Acknowledge them with a single tap and keep your phone from ringing while fixing the issue.",
        href: "/incident-management#ai-features",
        width: 720,
        image: `${BS}/assets/v2/homepage-v3/ai-sre/incidents-merging-3e0292b1.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/ai-sre/incidents-merging-sm-141eb43b.jpg`,
      },
      {
        title: "Explain with AI",
        description: "Analyze MTR, trace route, SSL certificates or connection errors.",
        href: "/incident-management#ai-features",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/ai-sre/explain-with-ai-f87b0f9a.jpg`,
      },
      {
        title: "Linear tickets suggested by AI",
        description:
          "Downtime? Create Linear tickets to fix the root cause using AI-based suggestions with a single tap.",
        href: "/incident-management#ai-features",
        width: 720,
        image: `${BS}/assets/v2/homepage-v3/ai-sre/linear-tickets-48eb41fd.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/ai-sre/linear-tickets-sm-c2ae5f1e.jpg`,
      },
      {
        title: "AI written post-mortems",
        description: "Get an automated post-mortem based on the incident timeline and Slack.",
        href: "/incident-management#ai-features",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/ai-sre/post-mortems-9db07112.jpg`,
      },
    ],
  },
  {
    title: "Tracing",
    exploreHref: "/tracing",
    exploreLabel: "Explore tracing",
    sectionClass: "mb-48 mt-32",
    replaces: {
      alt: "Replaces Datadog, New Relic",
      src: `${BS}/assets/v2/homepage-v3/replaces-tracing-a70fbcff.svg`,
      width: 177,
      height: 33,
    },
    cards: [
      {
        title: "eBPF-based service map",
        description: "See network flows, auto-instrument databases, and track SLOs.",
        href: "/tracing#otel",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/service-map-tracing-7b98776a.jpg`,
      },
      {
        title: "Instrument clusters with OpenTelemetry with no code change",
        description:
          "Gather traces, logs, and metrics using eBPF and OpenTelemetry. Remotely monitor collector’s throughput and adjust sampling, compression, and batching as needed.",
        href: "/tracing#ebpf",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/auto-instrument-tracing-54571c25.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/auto-instrument-tracing-sm-fd8aa295.png`,
      },
      {
        title: 'Explore with "bubble up"',
        description: "Investigate slow requests visually with drag & drop to find root cause.",
        href: "/tracing",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/tracing-bubble-up-72432960.jpg`,
      },
      {
        title: "Get an AI SRE: Claude Code with the knowledge of your telemetry",
        description:
          "Leverage automated root cause analysis based on the eBPF-based service map and log analysis. A human is always in charge.",
        href: "/tracing#sre",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/agent-tracing-bb1c6022.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/agent-tracing-sm-db98f8f5.png`,
      },
      {
        title: "Apdex and RED metrics",
        description: "Understand the overall health of a service in a single dashboard.",
        href: "/tracing",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/apdex-tracing-9027e73e.jpg`,
      },
    ],
  },
  {
    title: "Incident management",
    exploreHref: "/incident-management",
    exploreLabel: "Explore incident management",
    sectionClass: "mt-16 mb-28 md:mt-40 md:mb-48",
    replaces: {
      alt: "Replaces PagerDuty, OpsGenie",
      src: `${BS}/assets/v2/homepage-v3/replaces-incident-management-8f5768c0.svg`,
      width: 167,
      height: 16,
      className: "mt-[2px]",
    },
    cards: [
      {
        title: "Slack-based incident management",
        description:
          "Get the right team members involved with powerful templated workflows directly in Slack and decrease your MTTR.",
        href: "/incident-management",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/slack-incident-management-2fcf67a0.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/slack-incident-management-sm-dab9c797.jpg`,
      },
      {
        title: "Smart incident merging",
        description:
          "10 incidents created at the same time? Acknowledge them with a single tap and keep your phone from ringing while fixing the issue.",
        href: "https://betterstack.com/docs/uptime/incident-grouping/",
        width: 720,
        image: `${BS}/assets/v2/homepage-v3/ai-sre/incidents-merging-3e0292b1.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/ai-sre/incidents-merging-sm-141eb43b.jpg`,
      },
      {
        title: "AI post-mortems",
        description: "Learn from every incident instead of manually rewriting what happened.",
        href: "/incident-management#ai-post-mortems",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/ai-post-mortems-7e9741b4.png`,
        bgImage: CAROUSEL_CARD_BG,
      },
    ],
  },
  {
    title: "Uptime monitoring",
    exploreHref: "/uptime",
    exploreLabel: "Explore uptime monitoring",
    sectionClass: "my-48",
    replaces: {
      alt: "Replaces UptimeRobot, Pingdom, Status Cake",
      src: `${BS}/assets/v2/homepage-v3/replaces-website-monitoring-ec1f33e4.svg`,
      srcSm: `${BS}/assets/v2/homepage-v3/replaces-website-monitoring-sm-4afc67a6.svg`,
      width: 288,
      height: 19,
    },
    cards: [
      {
        title: "Screenshots for errors",
        description: "We record the API errors and take a screenshot of your app being down.",
        href: "/uptime#uptime-monitoring",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/screenshots-1cb32946.png`,
        bgImage: CAROUSEL_CARD_BG,
      },
      {
        title: "Traceroute & MTR for timeouts",
        description:
          "Understand connection timeouts and request timeouts with edge-based traceroute and MTR outputs.",
        href: "/uptime#uptime-monitoring",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/mtr-a75e54dd.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/mtr-sm-9d9adc1a.jpg`,
      },
      {
        title: "Playwright-based transaction checks",
        description: "Run tests with a real Chrome browser instance with a JavaScript runtime.",
        href: "/website-monitoring#transaction-monitoring",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/playwright-150b615d.png`,
      },
      {
        title: "Phone call alerts & SMS included",
        description:
          "Unlimited global phone call alerts, sms, push notifications, and Slack notifications included with every Responder license.",
        href: "https://betterstack.com/docs/uptime/monitoring-start/#step-2-choosing-the-alerting-options",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/phone-alert-4caaf9e6.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/phone-alert-sm-123d1ff3.jpg`,
      },
    ],
  },
  {
    title: "Log management",
    exploreHref: "/log-management",
    exploreLabel: "Explore log management",
    sectionClass: "my-48",
    replaces: {
      alt: "Replaces ElasticSearch, Datadog",
      src: `${BS}/assets/v2/homepage-v3/replaces-log-management-4185894e.svg`,
      width: 245,
      height: 34,
    },
    cards: [
      {
        title: "Analyze raw logs at scale",
        description:
          "Run ad-hoc queries on raw logs at scale with our built-in query time sampling. Query with SQL, PromQL, Drag & drop or a simple log filtering.",
        href: "/log-management",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/query-time-sampling-9bddbff4.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/query-time-sampling-sm-70dbe622.png`,
        bgImage: CAROUSEL_CARD_BG,
      },
      {
        title: "Don’t get billed for useless logs",
        description: "Mark irrelevant logs as spam to exclude them and don’t get charged.",
        href: "/log-management#query",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/mark-spam-63efa8ba.jpg`,
      },
      {
        title: "One-click pattern filtering",
        description:
          "Group similar logs, filter or exclude patterns with a single click. See surrounding logs from noisy neighbors.",
        href: "/log-management#query",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/pattern-filtering-a13d426c.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/pattern-filtering-sm-312da89b.jpg`,
      },
      {
        title: "SQL via HTTP API and MCP server",
        description: "Query your logs, spans or metrics with SQL over HTTP API or our MCP server.",
        href: "/log-management#wide-events",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/sql-via-http-4fa5bfa0.jpg`,
      },
      {
        title: "Store logs in your own S3 bucket",
        description:
          "No more ‘hot storage’ and ‘cold storage’. Access all your logs all the time. No need to rehydrate your logs from S3 ever again.",
        href: "/log-management#wide-events",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/always-available-storage-b3cd33f8.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/always-available-storage-sm-e7bd7d1b.jpg`,
      },
      {
        title: "Drag & drop dashboards",
        description: "Drag & drop the metrics you want to visualize. No SQL code necessary.",
        href: "/log-management#query",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/drag-n-drop-dashboards-d2df5a72.jpg`,
      },
    ],
  },
  {
    title: "Infrastructure monitoring",
    exploreHref: "/infrastructure-monitoring",
    exploreLabel: "Explore infrastructure monitoring",
    sectionClass: "my-48",
    replaces: {
      alt: "Replaces Datadog, Grafana",
      src: `${BS}/assets/v2/homepage-v3/replaces-infrastructure-monitoring-e2538c08.svg`,
      width: 277,
      height: 35,
    },
    cards: [
      {
        title: "Anomaly detection alerts",
        description:
          "Trigger alerts in real-time based on anomalies in logs and metrics. No need to configure exact alert thresholds. Get alerts via Slack, e-mail, phone, SMS, and more.",
        href: "/telemetry#resolve",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/anomaly-detection-56765e46.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/anomaly-detection-sm-4a6118ea.jpg`,
      },
      {
        title: "Collaboration built-in",
        description: "Observe your teammates and comment on note-worthy data spikes.",
        href: "/telemetry",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/collaboration-99d92110.png`,
        bgImage: CAROUSEL_CARD_BG,
      },
      {
        title: "Query with Drag & drop, SQL or PromQL",
        description:
          "Get answers fast with a powerful SQL query builder. No need to learn a new querying language or ask your data analyst.",
        href: "/telemetry#troubleshoot",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/query-4b0c6088.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/query-sm-028a3d44.jpg`,
      },
      {
        title: "OpenTelemetry & Prometheus-native",
        description: "Connect metrics in minutes using existing open-source collectors.",
        href: "/infrastructure-monitoring",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/metrics-5f9a3258.jpg`,
      },
    ],
  },
  {
    title: "Error tracking",
    exploreHref: "/error-tracking",
    exploreLabel: "Explore error tracking",
    sectionClass: "my-48",
    replaces: {
      alt: "Replaces Datadog, New Relic",
      src: `${BS}/assets/v2/homepage-v3/replaces-error-tracking-899c8943.svg`,
      width: 245,
      height: 33,
      className: "mt-1",
    },
    cards: [
      {
        title: "Made for Slack, Linear, Microsoft Teams, and Jira",
        description:
          "Integrate with tools you already use to get alerted with rich contextual notifications. Need an urgent fix? Leverage the built-in incident management.",
        href: "/error-tracking#features",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/errors-integrations-afe3bd31.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/errors-integrations-sm-85a002b8.jpg`,
      },
      {
        title: "Compatible with Sentry SDKs",
        description: "Track errors from 100+ platforms with the industry-standard Sentry SDKs.",
        href: "/error-tracking#sentry-compatible",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/sentry-compatible-ec7541c0.jpg`,
      },
      {
        title: "Integrate with Claude Code or Cursor",
        description:
          "Integrate Better Stack in seconds with a single prompt. Copy, run, and start tracking errors with Better Stack.",
        href: "/error-tracking#ai-first",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/claude-integration-bcaf201e.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/claude-integration-sm-1fba8702.jpg`,
      },
      {
        title: "Terraform, API, and MCP server",
        description: "Integrate new apps with Terraform and investigate errors with MCP.",
        href: "/error-tracking#features",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/terraform-7d19fc8a.jpg`,
      },
      {
        title: "Configurable exception grouping",
        description:
          "Have a non-standard stack and want to group exceptions in an atypical way? We got you covered.",
        href: "/error-tracking#features",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/exc-grouping-ac1f9467.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/exc-grouping-sm-07f7d69e.jpg`,
      },
    ],
  },
  {
    title: "Real user monitoring",
    exploreHref: "/real-user-monitoring",
    exploreLabel: "Explore real user monitoring",
    sectionClass: "my-48",
    replaces: {
      alt: "Replaces Datadog, Posthog, Sentry",
      src: `${BS}/assets/v2/homepage-v3/real-user-monitoring/replaces-real-user-monitoring-4aa90cf0.svg`,
      width: 245,
      height: 33,
      className: "mt-1",
    },
    cards: [
      {
        title: "Session replay",
        description:
          "See how users interact with your product. Watch at 2x speed, skip pauses, filter for rage indicators.",
        href: "/real-user-monitoring#session-replay",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/real-user-monitoring/session-replay-bf7f9de4.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/real-user-monitoring/session-replay-sm-a03af912.jpg`,
      },
      {
        title: "Auto-capture user events",
        description: "Collect clicks, form fills, and rage clicks with a single code snippet.",
        href: "/real-user-monitoring#session-replay",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/real-user-monitoring/related-errors-2b798eba.jpg`,
      },
      {
        title: "Product analytics with event funnels",
        description:
          "See what parts of the critical path of your onboarding need improving by evaluating user actions step-by-step.",
        href: "/real-user-monitoring#product-analytics",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/real-user-monitoring/funnel-6cf6cf68.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/real-user-monitoring/funnel-sm-cdccf6b7.jpg`,
      },
      {
        title: "Correlate frontend with backend",
        description: "See web events alongside backend traces and other log events.",
        href: "/real-user-monitoring#product-analytics",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/real-user-monitoring/correlate-frontend-backend-a4f397bc.jpg`,
      },
      {
        title: "Track web vitals",
        description:
          "See Largest Contentful Paint, Cumulative Layout Shift, and Interaction to Next Paint segmented per URL.",
        href: "/real-user-monitoring#features",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/real-user-monitoring/web-vitals-9c06118c.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/real-user-monitoring/web-vitals-sm-52455572.jpg`,
      },
      {
        title: "Real-time website analytics at scale",
        description: "Are you getting more visitors from ChatGPT or Gemini?",
        href: "/real-user-monitoring#website-analytics",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/real-user-monitoring/website-analytics-92f59f87.jpg`,
      },
    ],
  },
  {
    title: "Status page",
    exploreHref: "/status-page",
    exploreLabel: "Explore status pages",
    sectionClass: "my-48",
    replaces: {
      alt: "Replaces Instatus, Statuspage",
      src: `${BS}/assets/v2/homepage-v3/replaces-status-page-47d09370.svg`,
      width: 189,
      height: 19,
    },
    cards: [
      {
        title: "Branded page on your own sub-domain",
        description: "Beautifully designed status page. Fully customizable with CSS and Javascript.",
        href: "/status-page",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/whitelabel-status-page-6ce842fe.png`,
        bgImage: CAROUSEL_CARD_BG,
      },
      {
        title: "Subscribe to status page updates",
        description:
          "Send automated updates to your customers when incident occurs. Let your customers subscribe to the entire status page or just selected components.",
        href: "/status-page#branded",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/status-page-updates-0878d07e.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/status-page-updates-sm-51977166.jpg`,
      },
      {
        title: "Translated into any language",
        description: "Be perceived as a local by your foreign customers. Customize every translation.",
        href: "/status-page",
        width: 350,
        image: `${BS}/assets/v2/homepage-v3/translate-status-page-53afdb70.png`,
      },
      {
        title: "Embed custom charts",
        description:
          "Show pre-built charts with response times or add custom metrics with advanced visualizations directly to your status page.",
        href: "/status-page",
        width: 725,
        image: `${BS}/assets/v2/homepage-v3/status-page-charts-54fbce3f.jpg`,
        imageSm: `${BS}/assets/v2/homepage-v3/status-page-charts-sm-3f8f760f.jpg`,
      },
    ],
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "@BetterStackHQ is one of the best products I've ever used. Went from 0-100 on logging in 15 minutes. Incredible",
    name: "Conor",
    handle: "@cnrstvns",
    avatar: `${BS}/assets/betterstack/twitter/conor-avatar-b2a571f1.png`,
    href: "https://twitter.com/@cnrstvns",
    hiddenSm: true,
  },
  {
    quote:
      "I tested @BetterStackHQ for @gamubsapp! So much easier to configure and the interface is better than @FreshworksInc!",
    name: "Quentin",
    handle: "@glaffont",
    avatar: `${BS}/assets/betterstack/twitter/quentin-avatar-b1fa4f5b.png`,
    href: "https://twitter.com/qlaffont/status/1442463552007147527",
  },
  {
    quote:
      "@BetterStackHQ status page looks SO neat! A fantastic tool for SaaS products like @Snapodcast",
    name: "TonyHe",
    handle: "@ttttonyhe",
    avatar: `${BS}/assets/betterstack/twitter/tony-avatar-c7f7948d.png`,
    href: "https://twitter.com/ttttonyhe/status/1433488160294678529",
    hiddenSm: true,
  },
  {
    quote:
      "By far @BetterStackHQ has given me more pleasant surprises other tool in this space. We had an outage due to a domain name expiring, and it turns out we can even be alered about that. Great user experience and UI on top of all the features. How is it not more popular?",
    name: "John",
    handle: "@johncjago",
    avatar: `${BS}/assets/betterstack/twitter/john-avatar-672aa1f6.png`,
    href: "https://twitter.com/johncjago/status/1462624489284513793",
  },
  {
    quote:
      "One year one tool. @linear won my heart last year. This year so far, @BetterStackHQ is the frontrunner, well designed 👏",
    name: "Tianzhou",
    handle: "@tianzhouchen",
    avatar: `${BS}/assets/betterstack/twitter/tianzhou-avatar-58056662.png`,
    href: "https://twitter.com/tianzhouchen/status/1441046890502520835",
  },
  {
    quote: "I just checked this out, and have never been so happy that I saw an ad 👏",
    name: "Chris",
    handle: "@chrishow",
    avatar: `${BS}/assets/betterstack/twitter/chrishow-avatar-c3cd7f8e.png`,
    href: "https://twitter.com/chrislhow/status/1417794338130698240",
  },
  {
    quote:
      "Looking for a status page? I recommend @BetterStackHQ. Perfect support, answered my dms in a couple of minutes, and it's the first actual cool looking status page which allows custom domains (on the free plan 😱)",
    name: "NeverLand",
    handle: "@neverlandoff",
    avatar: `${BS}/assets/betterstack/twitter/neverland-avatar-b7306358.png`,
    href: "https://twitter.com/neverlandoff/status/1444299269872267266",
  },
  {
    quote:
      "What are you using for logging and incident management? For me the go to is currently @BetterStackHQ - love their simplicity and powerful features.",
    name: "Markus Leimer",
    handle: "@markuslei22",
    avatar: `${BS}/assets/betterstack/twitter/markus-avatar-cf69cf0e.png`,
    href: "https://x.com/markuslei22/status/1781299692254765185",
    hiddenSm: true,
  },
] as const;

export const TWITTER_ICON = `${BS}/assets/betterstack/twitter-47a84f03.png`;
