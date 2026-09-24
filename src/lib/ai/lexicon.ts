import type { Cat } from "./types";

export type LexSkill = { id: string; label: string; cat: Cat; aliases: string[]; ambiguo?: boolean };

const S = (id: string, label: string, cat: Cat, aliases: string[], ambiguo = false): LexSkill => ({ id, label, cat, aliases, ambiguo });

// Vocabulario de habilidades, herramientas y dominios (alias ya normalizados: minúsculas y sin acentos).
export const LEXICON: LexSkill[] = [
  // Lenguajes
  S("typescript", "TypeScript", "lenguaje", ["typescript", "ts"], true),
  S("javascript", "JavaScript", "lenguaje", ["javascript", "js", "ecmascript", "es6"], true),
  S("nodejs", "Node.js", "lenguaje", ["node.js", "nodejs", "node js", "node"]),
  S("python", "Python", "lenguaje", ["python"]),
  S("java", "Java", "lenguaje", ["java"]),
  S("kotlin", "Kotlin", "lenguaje", ["kotlin"]),
  S("go", "Go", "lenguaje", ["golang", "go"], true),
  S("rust", "Rust", "lenguaje", ["rust"]),
  S("csharp", "C# / .NET", "lenguaje", ["c#", ".net", "dotnet", "asp.net"]),
  S("php", "PHP", "lenguaje", ["php"]),
  S("ruby", "Ruby", "lenguaje", ["ruby", "rails"]),
  S("swift", "Swift", "lenguaje", ["swift"], true),
  S("sql", "SQL", "lenguaje", ["sql"]),
  S("bash", "Bash / Shell", "lenguaje", ["bash", "shell"]),
  S("dart", "Dart", "lenguaje", ["dart"]),
  S("cpp", "C++", "lenguaje", ["c++", "cpp"]),
  // Frameworks y APIs
  S("react", "React", "framework", ["react", "react.js", "reactjs"]),
  S("nextjs", "Next.js", "framework", ["next.js", "nextjs"]),
  S("angular", "Angular", "framework", ["angular"]),
  S("vue", "Vue", "framework", ["vue", "vue.js"]),
  S("express", "Express", "framework", ["express", "express.js"]),
  S("nestjs", "NestJS", "framework", ["nestjs", "nest.js"]),
  S("spring", "Spring Boot", "framework", ["spring boot", "spring"], true),
  S("django", "Django", "framework", ["django", "flask", "fastapi"]),
  S("flutter", "Flutter", "framework", ["flutter"]),
  S("android", "Android", "framework", ["android", "jetpack compose"]),
  S("ios", "iOS", "framework", ["ios", "swiftui"]),
  S("graphql", "GraphQL", "framework", ["graphql"]),
  S("rest", "APIs REST", "framework", ["rest", "restful", "api rest", "apis rest"], true),
  S("grpc", "gRPC", "framework", ["grpc"]),
  S("kafka", "Kafka", "framework", ["kafka", "rabbitmq", "sqs", "mensajeria"]),
  S("redis", "Redis", "datos", ["redis"]),
  // Datos
  S("postgresql", "PostgreSQL", "datos", ["postgresql", "postgres", "plpgsql"]),
  S("mysql", "MySQL", "datos", ["mysql", "mariadb"]),
  S("mongodb", "MongoDB", "datos", ["mongodb", "mongo"]),
  S("oracle", "Oracle", "datos", ["oracle"]),
  S("bigquery", "BigQuery", "datos", ["bigquery", "snowflake", "redshift"]),
  S("ml", "Machine learning", "datos", ["machine learning", "aprendizaje automatico", "pytorch", "tensorflow", "scikit-learn", "pandas", "ciencia de datos"]),
  // Nube y DevOps
  S("aws", "AWS", "nube", ["aws", "amazon web services", "ecs", "eks", "lambda", "dynamodb", "s3"], true),
  S("gcp", "Google Cloud", "nube", ["google cloud", "gcp", "bigquery"]),
  S("azure", "Azure", "nube", ["azure"]),
  S("firebase", "Firebase", "nube", ["firebase", "firestore"]),
  S("docker", "Docker", "devops", ["docker", "dockerfile", "contenedores", "contenerice"]),
  S("kubernetes", "Kubernetes", "devops", ["kubernetes", "k8s"]),
  S("terraform", "Terraform", "devops", ["terraform", "infraestructura como codigo"]),
  S("cicd", "CI/CD", "devops", ["ci/cd", "cicd", "github actions", "jenkins", "gitlab ci", "pipelines"]),
  S("observabilidad", "Observabilidad", "devops", ["prometheus", "grafana", "observabilidad", "slo", "datadog"]),
  S("linux", "Linux", "devops", ["linux"]),
  // Arquitectura y calidad
  S("microservicios", "Microservicios", "arquitectura", ["microservicios", "microservicio", "microservices"]),
  S("eventos", "Arquitectura orientada a eventos", "arquitectura", ["orientada a eventos", "event-driven", "event driven", "eventos"], true),
  S("seguridad", "Seguridad (OAuth, PCI)", "arquitectura", ["oauth", "oauth2", "jwt", "pci", "pci dss", "ciberseguridad"]),
  S("altadisp", "Alta disponibilidad", "arquitectura", ["alta disponibilidad", "99.99", "escalabilidad", "alto volumen", "alto rendimiento"]),
  S("testing", "Pruebas automatizadas", "calidad", ["jest", "cypress", "playwright", "junit", "tdd", "pruebas unitarias", "api testing", "testing", "e2e"]),
  S("agil", "Metodologías ágiles", "calidad", ["scrum", "agile", "agil", "kanban"]),
  // Dominios
  S("pagos", "Pagos", "dominio", ["pagos", "payments", "payment", "pasarela", "pasarelas de pago", "payment-gateway", "checkout", "stripe", "adyen", "conekta", "spei"]),
  S("fintech", "Fintech / banca", "dominio", ["fintech", "banca", "bancario", "financiera", "finance", "financiero"]),
  S("ecommerce", "E-commerce", "dominio", ["e-commerce", "ecommerce", "commerce", "comercio electronico", "marketplace", "tienda online", "dtc", "b2b"]),
  S("retail", "Retail", "dominio", ["retail", "tienda departamental"]),
  S("movil", "Desarrollo móvil", "dominio", ["desarrollo movil", "aplicaciones moviles", "apps moviles", "app movil", "mobile", "mobile app", "flutter", "android", "ios"]),
  // Colaboración
  S("opensource", "Open source", "blanda", ["open source", "open-source", "codigo abierto", "opensource"]),
];

// Habilidades emparentadas: si el candidato no tiene la exacta, aporta crédito parcial (0–1).
const REL: [string, string, number][] = [
  ["javascript", "typescript", 0.85], ["nodejs", "javascript", 0.7], ["nodejs", "typescript", 0.75], ["express", "nodejs", 0.8], ["nestjs", "nodejs", 0.8],
  ["react", "nextjs", 0.85], ["react", "javascript", 0.4], ["react", "typescript", 0.4],
  ["postgresql", "mysql", 0.65], ["postgresql", "oracle", 0.55], ["postgresql", "sql", 0.6], ["mysql", "sql", 0.6], ["mongodb", "postgresql", 0.4],
  ["aws", "gcp", 0.6], ["aws", "azure", 0.6], ["gcp", "azure", 0.6],
  ["docker", "kubernetes", 0.6], ["cicd", "docker", 0.3],
  ["java", "kotlin", 0.7], ["java", "csharp", 0.5], ["spring", "java", 0.5], ["go", "rust", 0.45], ["rust", "go", 0.45], ["python", "go", 0.3],
  ["kafka", "eventos", 0.6], ["microservicios", "eventos", 0.4], ["microservicios", "kubernetes", 0.3], ["rest", "graphql", 0.6], ["rest", "grpc", 0.6],
  ["graphql", "rest", 0.6], ["testing", "cicd", 0.2],
  ["flutter", "dart", 0.8], ["dart", "kotlin", 0.4], ["dart", "swift", 0.3], ["dart", "typescript", 0.35], ["flutter", "react", 0.35], ["flutter", "android", 0.5], ["flutter", "ios", 0.5],
  ["android", "kotlin", 0.7], ["ios", "swift", 0.7], ["cpp", "rust", 0.4], ["cpp", "java", 0.3], ["firebase", "gcp", 0.5],
  ["pagos", "fintech", 0.7], ["fintech", "pagos", 0.8], ["ecommerce", "pagos", 0.5], ["ecommerce", "retail", 0.7], ["retail", "ecommerce", 0.7],
];
export const RELATED: Record<string, Record<string, number>> = {};
for (const [a, b, w] of REL) {
  (RELATED[a] ??= {})[b] = Math.max(RELATED[a]?.[b] ?? 0, w);
  (RELATED[b] ??= {})[a] = Math.max(RELATED[b]?.[a] ?? 0, w * 0.9);
}

export const byId = Object.fromEntries(LEXICON.map((s) => [s.id, s]));
