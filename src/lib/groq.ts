import axios from "axios"
import dotenv from "dotenv"
dotenv.config()

const GROQ_API_KEY = process.env.GROQ_API_KEY || ""

export interface ScoringResult {
  score: number
  grade: string
  summary: string
  strengths: string[]
  improvements: string[]
  recommendation: string
}

function ruleBasedScore(data: {
  courseCount: number
  totalEarned: string
  courseDetails: Array<{ title: string; description: string; chapterCount: number }>
}): ScoringResult {
  let score = 0
  score += Math.min(data.courseCount * 10, 30)
  const totalChapters = data.courseDetails.reduce((s, c) => s + c.chapterCount, 0)
  score += Math.min(totalChapters * 5, 30)
  const earned = parseFloat(data.totalEarned) || 0
  if (earned > 10) score += 25
  else if (earned > 5) score += 20
  else if (earned > 1) score += 15
  else if (earned > 0) score += 10
  const avgLen = data.courseDetails.length > 0
    ? data.courseDetails.reduce((s, c) => s + c.description.length, 0) / data.courseDetails.length
    : 0
  if (avgLen > 100) score += 15
  else if (avgLen > 50) score += 10
  else if (avgLen > 20) score += 5
  score = Math.min(score, 100)
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F"
  return {
    score, grade,
    summary: `Educator has ${data.courseCount} course(s) with ${totalChapters} chapters and ${data.totalEarned} cUSD earned.`,
    strengths: [
      data.courseCount > 0 ? `Published ${data.courseCount} course(s)` : "Registered educator",
      totalChapters > 0 ? `${totalChapters} lesson(s) available` : "Ready to create",
    ],
    improvements: ["Add more courses", "Grow student base"],
    recommendation: score >= 70 ? "Solid educator with good content." : "Emerging educator — growing their catalog.",
  }
}

export async function scoreEducator(data: {
  tutorAddress: string
  courseCount: number
  totalEarned: string
  courseDetails: Array<{ title: string; description: string; chapterCount: number }>
}): Promise<ScoringResult> {
  if (!GROQ_API_KEY) return ruleBasedScore(data)

  const prompt = `You are TeachAgent. Score this educator 0-100 based on their Celo blockchain profile.

Tutor: ${data.tutorAddress}
Courses: ${data.courseCount}
Earned: ${data.totalEarned} cUSD
Content: ${JSON.stringify(data.courseDetails)}

Respond ONLY with valid JSON, no markdown:
{"score":75,"grade":"B","summary":"Two sentences.","strengths":["s1","s2"],"improvements":["i1","i2"],"recommendation":"One sentence."}`

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 400,
        temperature: 0.2,
        messages: [
          { role: "system", content: "Respond only with valid JSON. No markdown, no explanation." },
          { role: "user", content: prompt },
        ],
      },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
    )
    const text = res.data.choices[0].message.content.replace(/```json|```/g, "").trim()
    return JSON.parse(text) as ScoringResult
  } catch (err: any) {
    console.warn("Groq fallback:", err?.message)
    return ruleBasedScore(data)
  }
}

export async function runTutoringSession(data: {
  question: string
  courseTitle: string
  studentAddress: string
}): Promise<string> {
  if (!GROQ_API_KEY) {
    return "TeachAgent AI is currently offline. Please try again shortly."
  }
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are TeachAgent, an AI tutor on Celo blockchain. Course: "${data.courseTitle}". Student: ${data.studentAddress}. Be clear and practical.`,
          },
          { role: "user", content: data.question },
        ],
      },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
    )
    return res.data.choices[0].message.content
  } catch (err: any) {
    throw new Error(`AI error: ${err?.message}`)
  }
}