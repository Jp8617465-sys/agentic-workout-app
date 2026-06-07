import Anthropic from "@anthropic-ai/sdk";
import { Command } from "commander";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScriptOptions {
  readonly category: string;
  readonly location: string;
  readonly criteria: readonly string[];
  readonly maxCompanies: number;
  readonly output: string | undefined;
  readonly verbose: boolean;
}

interface RawOptions {
  category: string;
  location: string;
  criteria: string;
  maxCompanies: string;
  output: string | undefined;
  verbose: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_LOCATION = "Brisbane, Australia";
const DEFAULT_CRITERIA = "macro tracking,clean ingredients,taste quality";
const MODEL = "claude-opus-4-8";
const DEFAULT_MAX_COMPANIES = 8;
const MAX_CONTINUATIONS = 5;

const SYSTEM_PROMPT =
  "You are a thorough market research analyst. Your job is to research real, " +
  "currently-operating companies using web search, evaluate them against specific " +
  "quality criteria, and produce a structured markdown comparison report.\n\n" +
  "Rules:\n" +
  "- Use web_search to find real companies that are currently operating\n" +
  "- Search for each company's pricing, menu/products, ingredient policies, and " +
  "customer reviews individually\n" +
  "- Only include information you can verify from web search results — do not " +
  "invent or hallucinate details\n" +
  "- Complete all research before writing the final report\n" +
  "- Write the final report in the exact markdown format specified in the user's message";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(verbose: boolean, message: string): void {
  if (verbose) process.stderr.write(`${message}\n`);
}

function toTitleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => (w[0] !== undefined ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function buildSlug(category: string, location: string): string {
  return `${category}-${location}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildOutputPath(options: ScriptOptions): string {
  if (options.output !== undefined) return options.output;
  const date = new Date().toISOString().slice(0, 10);
  const slug = buildSlug(options.category, options.location);
  return path.join("docs", "research", `${slug}-${date}.md`);
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildUserPrompt(options: ScriptOptions): string {
  const today = new Date().toISOString().slice(0, 10);
  const criteriaList = options.criteria
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");
  const criteriaStr = options.criteria.join(", ");
  const criteriaHeaders = options.criteria.map(toTitleCase).join(" | ");
  const criteriaDividers = options.criteria.map(() => "---").join("|");
  const profileTemplate = options.criteria
    .map((c) => `**${toTitleCase(c)} — X/5**\n> Evidence: [specific details found from web search]`)
    .join("\n\n");

  return (
    `Research the top ${options.maxCompanies} ${options.category} companies ` +
    `that operate in or deliver to ${options.location}.\n\n` +
    `## Evaluation Criteria\nScore each company 1–5 on:\n${criteriaList}\n\n` +
    `## Research Process\n` +
    `1. Search broadly for "${options.category} ${options.location}" to identify candidates\n` +
    `2. For each company, search specifically for their menu/products, pricing, and ingredient policies\n` +
    `3. Search for customer reviews mentioning the evaluation criteria\n` +
    `4. Score each company on each criterion based on evidence found\n\n` +
    `## Required Output Format\n` +
    `Produce the full markdown report below — fill every section. ` +
    `Write only the markdown content (no code fences) as your final response.\n\n` +
    `# ${toTitleCase(options.category)} Companies — ${options.location}\n` +
    `*Research generated: ${today} | Criteria: ${criteriaStr}*\n\n` +
    `---\n\n` +
    `## Comparison Table\n\n` +
    `| Company | ${criteriaHeaders} | Overall | Price Range |\n` +
    `|---------|${criteriaDividers}|---------|-------------|\n` +
    `[One row per company — scores like ⭐⭐⭐⭐ (4), Overall as X.X/5, Price as $ / $$ / $$$]\n\n` +
    `---\n\n` +
    `## Company Profiles\n\n` +
    `[For each company use this exact structure:]\n\n` +
    `### N. Company Name\n\n` +
    `**Website:** https://...\n` +
    `**Price Range:** $ / $$ / $$$ / $$$$\n` +
    `**Location/Delivery:** [delivery areas]\n\n` +
    `${profileTemplate}\n\n` +
    `**Summary:** [2–3 sentences on who this is best for]\n\n` +
    `---\n\n` +
    `[Repeat the profile block for all ${options.maxCompanies} companies]\n\n` +
    `## Key Takeaways\n\n` +
    `### Best Overall\n**[Company]** — [one sentence reason]\n\n` +
    `### Best for ${toTitleCase(options.criteria[0] ?? "Top Criterion")}\n` +
    `**[Company]** — [one sentence reason]\n\n` +
    `### Best Value\n**[Company]** — [one sentence reason]\n\n` +
    `### Avoid If...\n- [criterion]: [Company] scores poorly because [reason]\n\n` +
    `---\n\n` +
    `## Research Notes\n` +
    `*Sources consulted via web search. Scores based on publicly available information ` +
    `as of ${today}. Pricing is approximate and subject to change.*`
  );
}

// ─── API loop ─────────────────────────────────────────────────────────────────

async function runResearch(options: ScriptOptions): Promise<string> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (apiKey === undefined || apiKey === "") {
    process.stderr.write(
      "Error: ANTHROPIC_API_KEY is not set.\n" +
        "Create a .env.local file in the project root:\n" +
        "  ANTHROPIC_API_KEY=sk-ant-...\n" +
        "Get a key at https://console.anthropic.com/\n"
    );
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const userPrompt = buildUserPrompt(options);

  log(options.verbose, `[research] Category: ${options.category}`);
  log(options.verbose, `[research] Location: ${options.location}`);
  log(options.verbose, `[research] Criteria: ${options.criteria.join(", ")}`);
  log(options.verbose, `[research] Model: ${MODEL} | Max companies: ${options.maxCompanies}`);
  log(options.verbose, "[api] Sending initial request...");

  const allContent: Anthropic.ContentBlock[] = [];
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];
  let continuations = 0;

  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: "web_search_20250305" as any, name: "web_search" }],
      system: SYSTEM_PROMPT,
      messages,
    });

    allContent.push(...response.content);
    log(
      options.verbose,
      `[api] stop_reason=${response.stop_reason} | ` +
        `input=${response.usage.input_tokens} output=${response.usage.output_tokens}`
    );

    if (response.stop_reason === "end_turn") break;

    if (response.stop_reason === "pause_turn") {
      if (++continuations > MAX_CONTINUATIONS) {
        throw new Error(
          `Research exceeded ${MAX_CONTINUATIONS} continuation rounds — ` +
            "try reducing --max-companies or the number of criteria"
        );
      }
      log(
        options.verbose,
        `[api] Server-side loop paused — continuing (${continuations}/${MAX_CONTINUATIONS})...`
      );
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    // max_tokens or stop_sequence — treat as done
    break;
  }

  const report = allContent
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();

  if (report === "") {
    throw new Error(
      "No text content in Claude's response — the API may have returned only " +
        "tool-use blocks. Check your ANTHROPIC_API_KEY and try again."
    );
  }

  return report;
}

// ─── Output ───────────────────────────────────────────────────────────────────

function writeReport(
  report: string,
  outputPath: string,
  verbose: boolean
): void {
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, report, "utf-8");
  log(verbose, `[output] Written to ${outputPath}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("research-companies")
    .description(
      "Research companies in a category using Claude with live web search"
    )
    .requiredOption(
      "-c, --category <string>",
      "Business category to research (e.g. \"meal prep services\")"
    )
    .option("-l, --location <string>", "Location or delivery area", DEFAULT_LOCATION)
    .option(
      "--criteria <string>",
      "Comma-separated evaluation criteria",
      DEFAULT_CRITERIA
    )
    .option(
      "-n, --max-companies <number>",
      "Maximum number of companies to research",
      String(DEFAULT_MAX_COMPANIES)
    )
    .option(
      "-o, --output <string>",
      "Output file path (default: docs/research/<slug>-<date>.md)"
    )
    .option("-v, --verbose", "Log progress to stderr", false)
    .parse(process.argv);

  const raw = program.opts<RawOptions>();

  const options: ScriptOptions = {
    category: raw.category,
    location: raw.location,
    criteria: raw.criteria
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
    maxCompanies: parseInt(raw.maxCompanies, 10),
    output: raw.output,
    verbose: raw.verbose,
  };

  if (options.criteria.length === 0) {
    process.stderr.write("Error: --criteria must include at least one criterion\n");
    process.exit(1);
  }

  if (Number.isNaN(options.maxCompanies) || options.maxCompanies < 1) {
    process.stderr.write("Error: --max-companies must be a positive integer\n");
    process.exit(1);
  }

  const outputPath = buildOutputPath(options);

  log(
    options.verbose,
    `[research] Starting: ${options.category} in ${options.location} → ${outputPath}`
  );

  const report = await runResearch(options);
  writeReport(report, outputPath, options.verbose);

  process.stdout.write(`Report saved to: ${outputPath}\n`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Fatal error: ${message}\n`);
  process.exit(1);
});
