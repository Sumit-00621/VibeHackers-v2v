import { db, pool } from "./index.js";
import { scholarshipsTable, learningModulesTable, mentorsTable } from "./schema/index.js";

async function main() {
  console.log("Seeding database...");
  
  // Seed Mentors
  await db.insert(mentorsTable).values([
    {
      name: "Dr. Ananya Rao",
      title: "Senior Research Scientist",
      organization: "Google Research",
      specializations: ["Machine Learning", "AI Ethics", "Computer Vision"],
      bio: "Ananya has 10+ years of experience in artificial intelligence and computer vision. She is passionate about mentoring women transition from academia to industry roles in tech.",
      yearsExperience: 12,
      rating: 4.9,
      totalSessions: 140,
      availability: "available",
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
    },
    {
      name: "Priya Sharma",
      title: "VP of Engineering",
      organization: "FinTech Innovations",
      specializations: ["Software Architecture", "Engineering Management", "Backend Systems"],
      bio: "Priya leads a team of 50+ engineers. She specializes in scaling distributed database systems and helps early-to-mid career engineers navigate leadership paths.",
      yearsExperience: 15,
      rating: 4.8,
      totalSessions: 210,
      availability: "available",
      photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200"
    },
    {
      name: "Dr. Sunita Krishnan",
      title: "Professor of Biotechnology",
      organization: "Indian Institute of Science",
      specializations: ["Bioinformatics", "Genetic Engineering", "Academic Research"],
      bio: "Sunita has published over 40 research papers in bioinformatics and gene editing. She guides students seeking research internships and PhD applications abroad.",
      yearsExperience: 18,
      rating: 5.0,
      totalSessions: 85,
      availability: "available",
      photoUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200"
    },
    {
      name: "Meera Patel",
      title: "Lead Data Scientist",
      organization: "HealthAI Diagnostics",
      specializations: ["Data Analytics", "Python", "Medical Imaging"],
      bio: "Meera transitioned from a physics background to data science. She has helped multiple career switchers build strong portfolios and crack data science interviews.",
      yearsExperience: 8,
      rating: 4.7,
      totalSessions: 95,
      availability: "available",
      photoUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200"
    }
  ]);

  // Seed Scholarships
  await db.insert(scholarshipsTable).values([
    {
      title: "Google Generation Scholarship (APAC)",
      provider: "Google",
      amount: "$2,500 USD",
      deadline: "2026-10-15",
      eligibility: "Women pursuing Computer Science or related STEM degrees in Asia-Pacific",
      category: "STEM",
      applicationUrl: "https://buildyourfuture.withgoogle.com/scholarships",
      description: "Established to help aspiring computer scientists excel in technology and become leaders in the field."
    },
    {
      title: "Adobe Research Women-in-Technology Scholarship",
      provider: "Adobe",
      amount: "$10,000 USD + Mentorship",
      deadline: "2026-11-01",
      eligibility: "Female undergraduate or master's students studying Computer Science/Engineering",
      category: "Technology",
      applicationUrl: "https://research.adobe.com/scholarship/",
      description: "Recognizing outstanding female students in tech globally and providing financial support and internship opportunities."
    },
    {
      title: "Kiran Mazumdar-Shaw Biotech Fellowship",
      provider: "Biocon Foundation",
      amount: "₹2,00,000 INR",
      deadline: "2026-09-30",
      eligibility: "Indian women students pursuing postgraduate degrees in Biotechnology or Life Sciences",
      category: "Biotechnology",
      applicationUrl: "https://www.bioconfoundation.org",
      description: "Supporting women in life sciences who demonstrate strong academic record and intent to pursue research."
    }
  ]);

  // Seed Learning Modules
  await db.insert(learningModulesTable).values([
    {
      title: "Introduction to STEM Careers",
      description: "Learn about the diverse landscape of STEM careers, find your niche, and map out your career path.",
      category: "Career Guidance",
      durationMinutes: 30,
      difficulty: "beginner",
      tags: ["STEM", "Career Planning", "Growth"],
      content: "# STEM Careers Overview\n\nWelcome to your STEM career path! Discover the vast domains of Science, Technology, Engineering, and Math. Empower yourself with skills and find role models to guide your transition.",
      quizQuestions: [
        {
          question: "What is a core benefit of having a mentor in STEM?",
          options: [
            "Mentors do your work for you",
            "Mentors provide guidance, share experiences, and help navigate career challenges",
            "Mentors guarantee a salary promotion within 3 months",
            "Mentors make decisions on your behalf"
          ],
          correctIndex: 1,
          explanation: "Mentorship is about guidance, skill-building, and expanding your professional network."
        }
      ]
    },
    {
      title: "Financial Literacy & Planning",
      description: "Understand the basics of budgeting, personal savings, taxes, and investment instruments in India.",
      category: "Finance",
      durationMinutes: 45,
      difficulty: "intermediate",
      tags: ["Finance", "SIP", "Taxes"],
      content: "# Personal Finance 101\n\nTaking charge of your financial future is key to empowerment. Learn about Systematic Investment Plans (SIPs), tax saving under Section 80C, and building an emergency fund.",
      quizQuestions: [
        {
          question: "What does SIP stand for in personal finance?",
          options: [
            "Systematic Investment Plan",
            "Savings Interest Program",
            "Secured Income Portfolio",
            "State Investment Policy"
          ],
          correctIndex: 0,
          explanation: "SIP stands for Systematic Investment Plan, which allows you to invest a fixed amount regularly in mutual funds."
        }
      ]
    }
  ]);

  console.log("Seeding complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
