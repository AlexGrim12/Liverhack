// Perfiles de repositorios de GitHub guardados para que la demo funcione sin internet (datos reales de la API de GitHub).
// Con conexión, /api/repo/analyze trae el repositorio en vivo; si falla, se usa esta copia.
import type { RepoInfo } from "@/lib/ai/types";

export const REPOS_DEMO: RepoInfo[] = [
  {
    "fullName": "medusajs/medusa",
    "url": "https://github.com/medusajs/medusa",
    "descripcion": "The world's most flexible commerce platform for agents and developers",
    "lenguajePrincipal": "TypeScript",
    "lenguajes": {
      "TypeScript": 37555074,
      "JavaScript": 5209777,
      "Shell": 103802,
      "Handlebars": 14730,
      "CSS": 6416,
      "HTML": 361
    },
    "topics": [
      "ai-coding",
      "ai-tools",
      "commerce",
      "e-commerce",
      "ecommerce",
      "framework",
      "javascript",
      "medusa",
      "nodejs",
      "react",
      "typescript"
    ],
    "stars": 36439,
    "readme": "Medusa\n Documentation |\n Website \n Building blocks for digital commerce\n## Getting Started\nThe fastest way to get started is with Medusa Cloud. It provides a managed environment optimized for Medusa applications, with automated deployments, scaling, and maintenance. Get started on Medusa Cloud\nTo set up a Medusa application locally, visit the Documentation.\n## About Medusa\nMedusa is a commerce platform with a built-in framework for customization that allows you to build custom commerce applications without reinventing core commerce logic. The framework and modules can be used to support advanced B2B or DTC commerce stores, marketplaces, distributor platforms, PoS systems, service businesses, or similar solutions that need foundational commerce primitives. Medusa's core commerce modules are open-source and freely available on npm. Enterprise Edition features are identified separately in the repository.\nLearn more about Medusa’s architecture and commerce modules in the Docs.\n## Upgrades & Integrations\nFollow the Release Notes to keep your Medusa project up-to-date.\nCheck out all available Medusa integrations.\n## Community & Contributions\nThe core team is available in GitHub Discussions, where you can create issues, share ideas, and discuss roadmap.\nOur Contribution Guide describes how to contribute to the codebase and Docs.\nJoin our Discord server to meet and discuss with more than 14,000 other community members.\n## Other channels\n- GitHub Issues\n- Community Discord\n- Twitter\n- LinkedIn\n- Medusa Blog\n## License\nMedusa uses an open-core model. The core is licensed under the MIT License. The RBAC-based Enterprise Edition materials identified in ENTERPRISE-LICENSE.md require a commercial agreement with MedusaJS, Inc.",
    "archivos": {},
    "fuente": "cache"
  },
  {
    "fullName": "juspay/hyperswitch",
    "url": "https://github.com/juspay/hyperswitch",
    "descripcion": "Open source, composable payments platform | PCI compliant | SaaS and Self-host options | Enables connectivity to multiple payment, payout, fraud, vault and tokenization providers | Uplifts authorization with intelligent routing and revenue recovery | Reduce payment processing costs with cost observa",
    "lenguajePrincipal": "Rust",
    "lenguajes": {
      "Rust": 40029894,
      "JavaScript": 8365887,
      "MDX": 258390,
      "Shell": 146152,
      "HTML": 61905,
      "TypeScript": 46340,
      "CSS": 34605,
      "Python": 29940,
      "Just": 12667,
      "Smithy": 9106,
      "Dockerfile": 7148,
      "Nix": 3868,
      "PLpgSQL": 2362,
      "Makefile": 2335,
      "RenderScript": 2
    },
    "topics": [
      "adyen",
      "beginner-friendly",
      "featured",
      "finance",
      "fintech",
      "hacktoberfest",
      "high-performance",
      "open-source",
      "orchestration",
      "payment",
      "payment-gateway",
      "payment-integration",
      "payment-processing",
      "payments",
      "payments-platform",
      "restful-api",
      "rust",
      "sdk",
      "stripe",
      "works-with-react"
    ],
    "stars": 43843,
    "readme": "Composable Open-Source Payments Infrastructure \n 📁 Table of Contents \n- What Can I Do with Hyperswitch?\n- Quickstart (Local Setup)\n- Cloud Deployment\n- Hosted Sandbox (No Setup Required)\n- Why Hyperswitch?\n- Architectural Overview\n- Our Vision\n- Community & Contributions\n- Feature Requests & Bugs\n- Versioning\n- License\n- Team Behind Hyperswitch\n What Can I Do with Hyperswitch? \nHyperswitch offers a modular, open-source payments infrastructure designed for flexibility and control. Apart from our Payment Suite offering, this solution allows businesses to pick and integrate only the modules they need on top of their existing payment stack — without unnecessary complexity or vendor lock-in.\nEach module is independent and purpose-built to optimize different aspects of payment processing.\n Learn More About The Payment Modules \n- **Cost Observability** \n Advanced observability tools to audit, monitor, and optimize your payment costs. Detect hidden fees, downgrades, and penalties with self-serve dashboards and actionable insights. \n _Read more_\n- **Revenue Recovery** \n Combat passive churn with intelligent retry strategies tuned by card bin, region, method, and more. Offers fine-grained control over retry algorithms, penalty budgets, and recovery transparency. \n _Read more_\n- **Vault** \n A PCI-compliant vault service to store cards, tokens, wallets, and bank credentials. Provides a unified, secure, and reusable store of customer-linked payment methods. Also supports bring-your-own-vault to connect existing providers including VGS and TokenEx without re-tokenizing or migrating stored cards. \n _Read more_\n- **Intelligent Routing** \n Route each transaction across Stripe, Adyen, Braintree, Worldpay, Checkout.com, and 120+ others to the PSP with the highest predicted auth rate. Reduce retries, avoid downtime, and minimize latency while maximizing first attempt success. \n _Read more_\n- **Reconciliation** \n Automate 2-way and 3-way reconciliation with backdated support, staggered scheduling, and customizable outputs. Reduces manual ops effort and increases audit confidence. \n _Read more_\n- **Alternate Payment Methods** \n Drop-in widgets for PayPal, Apple Pay, Google Pay, Samsung Pay, Pay by Bank, and BNPL providers like Klarna. Maximizes conversions with seamless one-click checkout. \n _Read more_\n## Quickstart \n Local Setup via Docker \n```bash\n# One-click local setup\ngit clone --depth 1 --branch latest \ncd hyperswitch\nscripts/setup.sh\n```\n This script: \n - Detects Docker/Podman \n - Offers multiple deployment profiles:\n - **Standard**: App server + Control Center \n - **",
    "archivos": {},
    "fuente": "cache"
  }
];
