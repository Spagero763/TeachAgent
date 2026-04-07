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
  tutorAddress: string
  courseCount: number
  totalEarned: string
  courseDetails: Array<{ title: string; description: string; chapterCount: number }>
}): ScoringResult {
  let score = 0
  score += Math.min(data.courseCount * 10, 30)
  const totalChapters = data.courseDetails.reduce((sum, c) => sum + c.chapterCount, 0)
  score += Math.min(totalChapters * 5, 30)
  const earned = parseFloat(data.totalEarned) || 0
  if (earned > 10) score += 25
  else if (earned > 5) score += 20
  else if (earned > 1) score += 15
  else if (earned > 0) score += 10
  const avgDescLen = data.courseDetails.length > 0
    ? data.courseDetails.reduce((sum, c) => sum + c.description.length, 0) / data.courseDetails.length
    : 0
  if (avgDescLen > 100) score += 15
  else if (avgDescLen > 50) score += 10
  else if (avgDescLen > 20) score += 5
  score = Math.min(score, 100)
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F"
  const totalChaptersAll = data.courseDetails.reduce((sum, c) => sum + c.chapterCount, 0)
  return {
    score,
    grade,
    summary: `Educator has ${data.courseCount} course(s) with ${totalChaptersAll} total chapters and ${data.totalEarned} cUSD earned.`,
    strengths: [
      data.courseCount > 0 ? `Published ${data.courseCount} course(s) on EduPay` : "Registered educator",
      totalChaptersAll > 0 ? `${totalChaptersAll} lesson(s) available for students` : "Ready to create content",
    ],
    improvements: [
      "Add more courses to increase visibility",
      "Grow student base to increase earnings",
    ],
    recommendation: score >= 70
      ? "Recommended educator with solid content."
      : "Emerging educator — check back as they publish more.",
  }
}

export async function scoreEducator(data: {
  tutorAddress: string
  courseCount: number
  totalEarned: string
  courseDetails: Array<{ title: string; description: string; chapterCount: number }>
}): Promise<ScoringResult> {
  if (!GROQ_API_KEY) return ruleBasedScore(data)

  const prompt = `You are TeachAgent, an AI agent on the Celo blockchain that evaluates educator quality.

Analyze this educator's onchain profile and score them:

Tutor Address: ${data.tutorAddress}
Courses Created: ${data.courseCount}
Total Earned: ${data.totalEarned} cUSD
Courses:
${data.courseDetails.length === 0 ? "No courses yet" : data.courseDetails.map((c, i) =>
  `${i + 1}. "${c.title}" — ${c.description} (${c.chapterCount} chapters)`
).join("\n")}

Score this educator from 0-100 based on course quality, depth, and earnings.
Respond ONLY with valid JSON, no markdown, no explanation:
{"score":85,"grade":"B","summary":"Two sentence summary.","strengths":["strength1","strength2"],"improvements":["improvement1","improvement2"],"recommendation":"One sentence."}`

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "You are TeachAgent. Always respond with valid JSON only. No markdown, no explanation.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )

    const text = response.data.choices[0].message.content
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean) as ScoringResult
  } catch (err: any) {
    console.warn("Groq unavailable, using rule-based scoring:", err?.message)
    return ruleBasedScore(data)
  }
}

export async function runTutoringSession(data: {
  question: string
  courseTitle: string
  tutorAddress: string
  studentAddress: string
}): Promise<string> {
  if (!GROQ_API_KEY) {
    return `TeachAgent is currently offline. Please try again later. Question received: "${data.question}"`
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are TeachAgent, an AI tutor on the Celo blockchain. You are helping a student with the course: "${data.courseTitle}". Be clear, practical, and educational.`,
          },
          { role: "user", content: data.question },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )
    return response.data.choices[0].message.content
  } catch (err: any) {
    throw new Error(`Groq API error: ${err?.message}`)
  }
}