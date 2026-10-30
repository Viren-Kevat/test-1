/* ==========================================================================
   Dummy content used by the hero globe and the click-open detail views.
   Replace these values when real company data is available.
   ========================================================================== */
window.SITE_DATA = {

  // Hero globe. The first company is the origin of the connecting arcs.
  companies: [
    { id: 'cloud', name: 'Nexora Cloud', tag: 'Sovereign cloud for banks, hospitals and governments.', city: 'San Francisco', lat: 37.77, lon: -122.42, spin: -0.55,
      metrics: [['1,200', 'Clients'], ['99.99%', 'Uptime']] },
    { id: 'digital', name: 'Nexora Digital', tag: 'Modernising core systems for global enterprises.', city: 'London', lat: 51.51, lon: -0.13,
      metrics: [['640', 'Programmes'], ['28', 'Countries']] },
    { id: 'verdant', name: 'Verdant Data', tag: 'Renewable-powered data centres with heat reuse.', city: 'Frankfurt', lat: 50.11, lon: 8.68,
      metrics: [['14', 'Sites'], ['58%', 'Less energy']] },
    { id: 'aether', name: 'Aether AI', tag: 'A governed platform for building and running AI.', city: 'Bengaluru', lat: 12.97, lon: 77.59,
      metrics: [['380', 'Live models'], ['40%', 'Faster approvals']] },
    { id: 'sentinel', name: 'Sentinel Security', tag: 'Round-the-clock threat detection and response.', city: 'Singapore', lat: 1.35, lon: 103.82,
      metrics: [['2,000', 'Enterprises'], ['11 min', 'Avg. response']] },
    { id: 'academy', name: 'Nexora Academy', tag: 'Free, job-ready digital skills for new talent.', city: 'São Paulo', lat: -23.55, lon: -46.63,
      metrics: [['120k', 'Learners'], ['86%', 'Placed in jobs']] }
  ],

  // Click-open detail views, grouped so visitors can step through them.
  details: {
    initiative: {
      cloud: {
        eyebrow: 'Cloud · 2018 — Ongoing', title: 'Nexora Cloud', image: 'assets/images/hallway.jpg',
        lead: 'A sovereign cloud that lets regulated organisations modernise without moving their data abroad.',
        metrics: [['1,200', 'Customers'], ['99.99%', 'Uptime'], ['22', 'Regions']],
        text: ['Banks and health systems wanted the speed of public cloud with the control of their own data centres. Nexora Cloud gives them both, with data residency enforced at the platform level.',
               'Migration teams work alongside each customer’s engineers, so the knowledge stays in-house after go-live.'],
        points: ['Private, hybrid and sovereign regions', 'Carbon-aware workload scheduling', 'Independent annual compliance audit']
      },
      aether: {
        eyebrow: 'AI · 2022 — Ongoing', title: 'Aether AI Platform', image: 'assets/images/code.jpg',
        lead: 'A governed platform for building and operating AI, with audit trails and human sign-off by default.',
        metrics: [['380', 'Live models'], ['40%', 'Faster approvals'], ['100%', 'Named owners']],
        text: ['Most enterprise AI stalls between prototype and production because nobody can answer who is accountable. Aether makes ownership, testing and approval part of the workflow.',
               'Every model ships with a published statement of its limits and a named human owner.'],
        points: ['Model registry and evaluation', 'Automatic audit trails', 'Independent AI ethics board review']
      },
      campus: {
        eyebrow: 'Infrastructure · 2020 — 2024', title: 'Global Campus Network', image: 'assets/images/towers.jpg',
        lead: 'A unified, secure network connecting 80 offices and 62,000 colleagues on a single fabric.',
        metrics: [['80', 'Offices'], ['99.999%', 'Uptime'], ['31%', 'Lower cost']],
        text: ['Twenty years of acquisitions had left Nexora with dozens of separate networks. Over four years they were consolidated onto one software-defined fabric without a single major outage.',
               'The playbook has since become a service offered to customers facing the same problem.'],
        points: ['Zero-trust access for every colleague', 'Phased cut-over, office by office', 'Now offered as a managed service']
      },
      sentinel: {
        eyebrow: 'Security · 2019 — Ongoing', title: 'Sentinel Security Suite', image: 'assets/images/cables.jpg',
        lead: 'Threat detection and response protecting more than 2,000 enterprises from a global operations network.',
        metrics: [['2,000', 'Enterprises'], ['11 min', 'Avg. response'], ['12', 'Global centres']],
        text: ['Sentinel combines threat intelligence with analysts who know each customer’s environment, so alerts become decisions rather than noise.',
               'Twelve operations centres hand over around the clock, so an incident is never waiting for a morning shift.'],
        points: ['Managed detection and response', 'Identity and zero-trust architecture', 'Incident readiness exercises']
      },
      green: {
        eyebrow: 'Sustainability · 2021 — Ongoing', title: 'Green Data Centres', image: 'assets/images/solar.jpg',
        lead: 'Next-generation facilities powered by renewable energy, with liquid cooling and heat reuse.',
        metrics: [['14', 'Sites'], ['58%', 'Less energy'], ['2030', '100% renewable']],
        text: ['Computing demand keeps rising, so efficiency alone will not reach net zero. Each new site is designed around renewable supply and returns its waste heat to the local community.',
               'Results are published every year and audited by an independent third party.'],
        points: ['Wind and solar power agreements', 'Liquid cooling for AI workloads', 'Waste heat piped to local districts']
      },
      academy: {
        eyebrow: 'Education · 2024 — 2030', title: 'Nexora Academy', image: 'assets/images/classroom.jpg',
        lead: 'Free, job-ready digital skills training for career-changers and first-generation learners.',
        metrics: [['120k', 'Learners'], ['86%', 'Placed in jobs'], ['19', 'Countries']],
        text: ['The industry cannot hire its way out of a skills shortage. The Academy trains people who would otherwise never get an interview, then connects them to Nexora and its customers.',
               'Courses are built by working engineers and updated every quarter.'],
        points: ['Cloud, data and security tracks', 'Mentoring from Nexora engineers', 'Guaranteed interview on completion']
      }
    },
    person: {
      priya: {
        eyebrow: 'Leadership', title: 'Priya Raman', image: 'assets/images/team-priya.jpg',
        lead: 'Chief Technology Officer. Priya leads engineering and research across all Nexora companies.',
        metrics: [['19', 'Years at Nexora'], ['24k', 'Engineers led'], ['60+', 'Patents']],
        text: ['Priya joined as a platform engineer in 2006 and went on to lead the architecture of Nexora Cloud.',
               'Today the focus is on reliability at scale, and on making sure AI systems are tested as rigorously as anything else that runs critical services.'],
        points: ['Chairs the architecture council', 'Executive sponsor, Women in Engineering', 'Founding member of the AI ethics board']
      },
      sofia: {
        eyebrow: 'Leadership', title: 'Sofia Alvarez', image: 'assets/images/team-sofia.jpg',
        lead: 'Chief Operating Officer. Sofia runs global delivery and the six regional hubs.',
        metrics: [['12', 'Years at Nexora'], ['45', 'Countries'], ['96%', 'On-time delivery']],
        text: ['Sofia began by running Nexora’s São Paulo office and built the delivery model that now operates in 45 countries.',
               'The operating principle is simple: local teams, shared standards and no surprises for customers.'],
        points: ['Leads the global delivery organisation', 'Owns the customer satisfaction programme', 'Sponsor of Nexora Academy']
      },
      richard: {
        eyebrow: 'Leadership', title: 'Richard Calloway', image: 'assets/images/team-richard.jpg',
        lead: 'Lead Independent Director. Richard chairs the audit committee and advises on governance.',
        metrics: [['8', 'Years on the board'], ['30+', 'Years in finance'], ['3', 'Committees']],
        text: ['Richard spent three decades in banking technology before joining the Nexora board in 2017.',
               'As lead independent director, the role is to ask the questions that are hardest to ask from inside the company.'],
        points: ['Chairs the audit committee', 'Member of the risk committee', 'Mentor in the Founders’ Circle']
      }
    }
  }
};
