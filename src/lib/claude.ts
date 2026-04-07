import axios from "axios"
import dotenv from "dotenv"
dotenv.config()

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ""

export interface ScoringResult {
  score: number          // 0-100
  grade: string          // A, B, C, D, F
  summary: string
  strengths: string[]
  improvements: string[]
  recommendation: string
}

export async function scoreEducator(data: {
  tutorAddress: string
  courseCount: number
  totalEarned: string
  courseDetails: Array<{
    title: string
    description: string
    chapterCount: number
  }>
}): Promise<ScoringResult> {
  const prompt = `
You are TeachAgent, an AI agent on the Celo blockchain that evaluates educator quality.

Analyze this educator's onchain profile and score them:

Tutor Address: ${data.tutorAddress}
Courses Created: ${data.courseCount}
Total Earned: ${data.totalEarned} cUSD
Courses:
${data.courseDetails.length === 0 ? "No courses yet" : data.courseDetails.map((c, i) => `
  ${i + 1}. "${c.title}"
     Description: ${c.description}
     Chapters: ${c.chapterCount}
`).join("")}

Score this educator from 0-100 based on:
- Course quality and depth
- Number of courses and chapters
- Earnings (indicates real student demand)
- Course diversity

Respond ONLY with valid JSON:
{
  "score": <number 0-100>,
  "grade": "<A/B/C/D/F>",
  "summary": "<2 sentence summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "recommendation": "<1 sentence recommendation>"
}
`

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    )

    const text = response.data.content[0].text
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean) as ScoringResult
  } catch (err: any) {
    const detail = err?.response?.data || err?.message
    throw new Error(`Claude API error: ${JSON.stringify(detail)}`)
  }
}

export async function runTutoringSession(data: {
  question: string
  courseTitle: string
  tutorAddress: string
  studentAddress: string
}): Promise<string> {
  const prompt = `
You are TeachAgent, an AI tutor on the Celo blockchain.
You are assisting a student with the course: "${data.courseTitle}"
Created by tutor: ${data.tutorAddress}
Student: ${data.studentAddress}

Student question: ${data.question}

Provide a clear, educational answer. Be concise but thorough.
Focus on practical knowledge the student can apply immediately.
`

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    }
  )

  return response.data.content[0].text
}