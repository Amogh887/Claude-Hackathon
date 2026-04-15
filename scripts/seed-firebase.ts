import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.substring(0, eq);
    let value = trimmed.substring(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

if (getApps().length === 0) {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    console.error("FIREBASE_SERVICE_ACCOUNT_JSON not set in .env.local");
    process.exit(1);
  }
  initializeApp({ credential: cert(JSON.parse(json)) });
}

const db = getFirestore();

type Year = "Freshman" | "Sophomore" | "Junior" | "Senior" | "Grad";
type MeetPreference = "active" | "coffee_chat" | "moderate";

interface SeedProfile {
  displayName: string;
  major: string;
  year: Year;
  currentClasses: string[];
  hobbies: string[];
  meetPreferences: MeetPreference[];
  resume: {
    skills: string[];
    experiences: string[];
    projects: string[];
    clubs: string[];
    summary: string;
  };
}

const SEEDS: SeedProfile[] = [
  {
    displayName: "Priya Nair",
    major: "Computer Science",
    year: "Junior",
    currentClasses: ["CS 540", "CS 577", "MATH 340"],
    hobbies: ["climbing", "film photography", "chess"],
    meetPreferences: ["coffee_chat", "moderate"],
    resume: {
      skills: ["Python", "PyTorch", "React", "TypeScript", "AWS"],
      experiences: ["ML intern at Epic", "TA for CS 400"],
      projects: ["Badger Transit delay predictor", "Study group matcher"],
      clubs: ["WACM", "Hoofer Outing Club"],
      summary: "ML-leaning CS junior building student-focused tools.",
    },
  },
  {
    displayName: "Jake Sullivan",
    major: "Industrial Engineering",
    year: "Senior",
    currentClasses: ["ISYE 425", "ISYE 410", "MATH 340"],
    hobbies: ["hockey", "woodworking", "craft beer"],
    meetPreferences: ["active", "coffee_chat"],
    resume: {
      skills: ["Lean Six Sigma", "CAD", "Python", "Tableau"],
      experiences: ["Operations intern at John Deere"],
      projects: ["Factory line optimizer", "Badger maker-space scheduler"],
      clubs: ["Hockey Club", "IISE"],
      summary: "ISyE senior focused on process optimization and manufacturing.",
    },
  },
  {
    displayName: "Aisha Johnson",
    major: "Biomedical Engineering",
    year: "Junior",
    currentClasses: ["BME 430", "BME 300", "CHEM 343"],
    hobbies: ["salsa dancing", "volunteering", "cooking"],
    meetPreferences: ["coffee_chat", "moderate"],
    resume: {
      skills: ["SolidWorks", "MATLAB", "Python", "Biomaterials"],
      experiences: ["Research in tissue engineering lab"],
      projects: ["3D-printed prosthetic hand", "Low-cost EEG"],
      clubs: ["BMES", "Salsa Club"],
      summary: "BME junior passionate about accessible medical devices.",
    },
  },
  {
    displayName: "Marcus Chen",
    major: "Data Science",
    year: "Sophomore",
    currentClasses: ["STAT 340", "CS 320", "MATH 222"],
    hobbies: ["chess", "basketball", "board games"],
    meetPreferences: ["active", "coffee_chat"],
    resume: {
      skills: ["R", "Python", "pandas", "SQL"],
      experiences: ["Data analytics intern at Kohl's"],
      projects: ["NBA shot predictor", "Madison rent scraper"],
      clubs: ["WI Data Science Club"],
      summary: "DS sophomore into sports analytics and scraping.",
    },
  },
  {
    displayName: "Sofia Reyes",
    major: "Marketing",
    year: "Junior",
    currentClasses: ["MKTG 300", "MKTG 365", "ENGL 201"],
    hobbies: ["film photography", "cafe-hopping", "journaling"],
    meetPreferences: ["coffee_chat"],
    resume: {
      skills: ["Figma", "Brand strategy", "Copywriting", "Canva"],
      experiences: ["Marketing intern at Kohl's", "Social lead for student org"],
      projects: ["Wisconsin Union rebrand concept", "Small biz IG audit"],
      clubs: ["AMA", "Photography Club"],
      summary: "Brand-focused marketing junior into visual storytelling.",
    },
  },
  {
    displayName: "Tyler Brooks",
    major: "Mechanical Engineering",
    year: "Senior",
    currentClasses: ["ME 349", "ME 440", "MATH 319"],
    hobbies: ["climbing", "cycling", "camping"],
    meetPreferences: ["active"],
    resume: {
      skills: ["SolidWorks", "MATLAB", "Fusion 360", "ANSYS"],
      experiences: ["Intern at Harley-Davidson"],
      projects: ["Electric skateboard", "FSAE suspension"],
      clubs: ["FSAE", "Hoofer Outing Club"],
      summary: "ME senior who builds things that move.",
    },
  },
  {
    displayName: "Neha Sharma",
    major: "Computer Science",
    year: "Sophomore",
    currentClasses: ["CS 300", "CS 240", "MATH 234"],
    hobbies: ["chess", "Bollywood dance", "baking"],
    meetPreferences: ["coffee_chat", "moderate"],
    resume: {
      skills: ["Java", "Python", "HTML/CSS", "Git"],
      experiences: ["Peer mentor at CS Learning Center"],
      projects: ["Recipe finder app", "Study group matcher"],
      clubs: ["WACM", "Bollywood Dance Team"],
      summary: "CS sophomore building student productivity tools.",
    },
  },
  {
    displayName: "Ethan Park",
    major: "Economics",
    year: "Junior",
    currentClasses: ["ECON 310", "ECON 410", "MATH 221"],
    hobbies: ["running", "jazz piano", "investing"],
    meetPreferences: ["active", "coffee_chat"],
    resume: {
      skills: ["Stata", "Python", "Excel", "R"],
      experiences: ["Research assistant in applied econ"],
      projects: ["Madison rent market study", "Fed minutes sentiment analysis"],
      clubs: ["Econ Club", "Badger Investment Society"],
      summary: "Econ junior interested in applied micro and markets.",
    },
  },
  {
    displayName: "Lily Walsh",
    major: "English",
    year: "Senior",
    currentClasses: ["ENGL 467", "ENGL 200", "HIST 106"],
    hobbies: ["creative writing", "film photography", "vintage shopping"],
    meetPreferences: ["coffee_chat", "moderate"],
    resume: {
      skills: ["Copyediting", "Creative writing", "Adobe InDesign"],
      experiences: ["Editor at student literary magazine"],
      projects: ["Short story collection", "UW zine"],
      clubs: ["Souvenir Literary Mag", "Film Club"],
      summary: "English senior writing short fiction and editing zines.",
    },
  },
  {
    displayName: "Raj Patel",
    major: "Computer Engineering",
    year: "Junior",
    currentClasses: ["ECE 352", "CS 400", "ECE 330"],
    hobbies: ["drone building", "climbing", "chess"],
    meetPreferences: ["active", "moderate"],
    resume: {
      skills: ["C++", "Embedded systems", "PCB design", "Verilog"],
      experiences: ["Hardware intern at Generac"],
      projects: ["Autonomous drone", "FPGA audio processor"],
      clubs: ["IEEE", "Hoofer Outing Club"],
      summary: "CmpE junior building embedded systems and robots.",
    },
  },
  {
    displayName: "Maya Okonkwo",
    major: "Psychology",
    year: "Sophomore",
    currentClasses: ["PSYCH 202", "PSYCH 225", "SOC 181"],
    hobbies: ["volunteering", "yoga", "podcasts"],
    meetPreferences: ["coffee_chat"],
    resume: {
      skills: ["SPSS", "Research design", "Interviewing"],
      experiences: ["Research assistant in social psych lab"],
      projects: ["First-gen student survey", "Mental health zine"],
      clubs: ["Psi Chi", "Mental Health Alliance"],
      summary: "Psych sophomore interested in student wellbeing research.",
    },
  },
  {
    displayName: "Connor Walsh",
    major: "Finance",
    year: "Junior",
    currentClasses: ["FIN 325", "FIN 330", "ACCT 100"],
    hobbies: ["poker", "golf", "running"],
    meetPreferences: ["active", "coffee_chat"],
    resume: {
      skills: ["Excel", "DCF modeling", "Bloomberg Terminal"],
      experiences: ["Wealth management intern"],
      projects: ["Sector rotation strategy", "Options backtester"],
      clubs: ["Badger Investment Society"],
      summary: "Finance junior interested in equity research.",
    },
  },
  {
    displayName: "Rin Tanaka",
    major: "Art",
    year: "Senior",
    currentClasses: ["ART 448", "ART 326", "ART HIST 202"],
    hobbies: ["film photography", "ceramics", "cafe-hopping"],
    meetPreferences: ["coffee_chat", "moderate"],
    resume: {
      skills: ["Film photography", "Ceramics", "Adobe Suite"],
      experiences: ["Gallery assistant at Chazen"],
      projects: ["Solo ceramics show", "Madison cafes photo series"],
      clubs: ["Photography Club", "Ceramics Guild"],
      summary: "Studio art senior working in clay and analog photo.",
    },
  },
  {
    displayName: "Dominique Leblanc",
    major: "Political Science",
    year: "Junior",
    currentClasses: ["POLI SCI 347", "POLI SCI 106", "HIST 201"],
    hobbies: ["debate", "journalism", "volunteering"],
    meetPreferences: ["coffee_chat"],
    resume: {
      skills: ["Research", "Writing", "Public speaking"],
      experiences: ["Intern at WI state assembly"],
      projects: ["Voter registration drive", "Op-ed column"],
      clubs: ["Debate Society", "Badger Herald"],
      summary: "PoliSci junior focused on state-level policy.",
    },
  },
  {
    displayName: "Sam Eriksson",
    major: "Computer Science",
    year: "Grad",
    currentClasses: ["CS 760", "CS 766", "STAT 710"],
    hobbies: ["cycling", "chess", "homebrewing"],
    meetPreferences: ["active", "coffee_chat"],
    resume: {
      skills: ["PyTorch", "JAX", "Transformers", "CUDA"],
      experiences: ["Research intern at Microsoft Research"],
      projects: ["Efficient inference techniques", "LLM distillation"],
      clubs: ["ML Reading Group"],
      summary: "Grad student researching efficient inference for LLMs.",
    },
  },
  {
    displayName: "Jasmine Osei",
    major: "Biochemistry",
    year: "Junior",
    currentClasses: ["BIOCHEM 501", "CHEM 343", "BIOL 101"],
    hobbies: ["running", "cooking", "volunteering"],
    meetPreferences: ["active", "coffee_chat"],
    resume: {
      skills: ["PCR", "Western blotting", "Mammalian cell culture"],
      experiences: ["Research assistant in cancer biology lab"],
      projects: ["Breast cancer gene expression study"],
      clubs: ["Pre-Med Society"],
      summary: "Biochem junior on a pre-med track doing wet lab work.",
    },
  },
  {
    displayName: "Wei Zhang",
    major: "Statistics",
    year: "Senior",
    currentClasses: ["STAT 431", "STAT 451", "CS 540"],
    hobbies: ["table tennis", "chess", "investing"],
    meetPreferences: ["active", "coffee_chat"],
    resume: {
      skills: ["R", "Python", "Bayesian stats", "SQL"],
      experiences: ["Quant intern at Jump Trading"],
      projects: ["Sports betting model", "MCMC sampler"],
      clubs: ["Stats Club"],
      summary: "Stats senior interested in quant and Bayesian methods.",
    },
  },
  {
    displayName: "Brianna Scott",
    major: "Journalism",
    year: "Sophomore",
    currentClasses: ["JOURN 202", "JOURN 345", "POLI SCI 106"],
    hobbies: ["journalism", "running", "podcasts"],
    meetPreferences: ["coffee_chat"],
    resume: {
      skills: ["Reporting", "Audio editing", "Interviewing"],
      experiences: ["Reporter at Badger Herald"],
      projects: ["Student housing podcast"],
      clubs: ["Badger Herald", "WSUM Radio"],
      summary: "Journalism sophomore making audio stories.",
    },
  },
  {
    displayName: "Alex Kim",
    major: "Computer Science",
    year: "Senior",
    currentClasses: ["CS 640", "CS 710", "MATH 340"],
    hobbies: ["climbing", "film photography", "homebrewing"],
    meetPreferences: ["active", "moderate"],
    resume: {
      skills: ["Go", "Rust", "Kubernetes", "Systems"],
      experiences: ["SWE intern at Cloudflare"],
      projects: ["Distributed kv store", "Rust HTTP server"],
      clubs: ["Cyber Defense Club"],
      summary: "CS senior into distributed systems and low-level code.",
    },
  },
  {
    displayName: "Mateo Vega",
    major: "Architecture",
    year: "Junior",
    currentClasses: ["ARCH 210", "ARCH 320", "HIST 202"],
    hobbies: ["sketching", "cycling", "cafe-hopping"],
    meetPreferences: ["coffee_chat", "moderate"],
    resume: {
      skills: ["Rhino", "AutoCAD", "Model making", "Sketching"],
      experiences: ["Intern at local design firm"],
      projects: ["Lakeshore Path pavilion concept"],
      clubs: ["AIAS"],
      summary: "Architecture junior interested in public space design.",
    },
  },
  {
    displayName: "Isabelle Fontaine",
    major: "Pharmacy",
    year: "Grad",
    currentClasses: ["PHMSCI 620", "PHMSCI 510"],
    hobbies: ["yoga", "cooking", "volunteering"],
    meetPreferences: ["coffee_chat"],
    resume: {
      skills: ["Pharmacology", "Clinical research", "Pharmacokinetics"],
      experiences: ["Clinical rotation at UW Hospital"],
      projects: ["Med adherence intervention"],
      clubs: ["Pharmacy Student Association"],
      summary: "PharmD grad student interested in community health.",
    },
  },
  {
    displayName: "Jordan Hayes",
    major: "Economics",
    year: "Sophomore",
    currentClasses: ["ECON 301", "ECON 302", "MATH 222"],
    hobbies: ["investing", "running", "board games"],
    meetPreferences: ["active", "coffee_chat"],
    resume: {
      skills: ["Python", "Excel", "Stata"],
      experiences: ["Intern at a local VC"],
      projects: ["Midwest startup map"],
      clubs: ["Badger Venture Capital Club"],
      summary: "Econ sophomore into startups and venture.",
    },
  },
];

async function main() {
  console.log(`Seeding ${SEEDS.length} profiles…`);
  const now = Date.now();
  for (let i = 0; i < SEEDS.length; i++) {
    const seed = SEEDS[i];
    const uid = `seed-user-${i + 1}`;
    await db.collection("users").doc(uid).set({
      uid,
      email: `${seed.displayName.toLowerCase().replace(/\s+/g, ".")}@wisc.edu`,
      displayName: seed.displayName,
      photoURL: "",
      major: seed.major,
      year: seed.year,
      currentClasses: seed.currentClasses,
      hobbies: seed.hobbies,
      meetPreferences: seed.meetPreferences,
      resumeUrl: null,
      extractedResume: seed.resume,
      profileComplete: true,
      currentMatchId: null,
      calendarLinked: false,
      calendarTokens: null,
      punishment: { badged: false, badgeExpiresAt: null },
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✓ ${seed.displayName}`);
  }
  console.log("Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
