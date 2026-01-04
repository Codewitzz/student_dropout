/**
 * Gemini AI Service for generating brief counseling suggestions
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface StudentRiskData {
  risk_level: 'High' | 'Medium' | 'Low';
  risk_score: number;
  factors: string[];
  weak_subjects: string[];
  marks: number;
  attendance: number;
  assignment_completion?: number;
  class_participation?: 'Low' | 'Medium' | 'High';
  motivation_level?: 'Low' | 'Medium' | 'High';
  stress_level?: 'Low' | 'Medium' | 'High';
  backlogs: number;
  past_failures: number;
  subject?: string;
}

/**
 * Generate brief counseling suggestions using Gemini AI
 * @param riskData Student risk assessment data
 * @returns Array of brief counseling suggestions (max 5 suggestions, each max 100 characters)
 */
export async function generateCounselingSuggestions(
  riskData: StudentRiskData
): Promise<string[]> {
  // If no API key, return empty array (will fallback to rule-based)
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ Gemini API key not found. Using rule-based suggestions.');
    return [];
  }

  try {
    // Create a concise prompt for brief suggestions
    const prompt = `You are an academic counselor. Generate 3-5 VERY BRIEF counseling suggestions (each MUST be under 100 characters) for a student.

Student Risk Profile:
- Risk Level: ${riskData.risk_level}
- Risk Score: ${riskData.risk_score}/100
- Key Issues: ${riskData.factors.join(', ')}
${riskData.weak_subjects.length > 0 ? `- Weak Subjects: ${riskData.weak_subjects.join(', ')}` : ''}
- Marks: ${riskData.marks}%
- Attendance: ${riskData.attendance}%
${riskData.assignment_completion !== undefined ? `- Assignment Completion: ${riskData.assignment_completion}%` : ''}
${riskData.class_participation ? `- Class Participation: ${riskData.class_participation}` : ''}
${riskData.motivation_level ? `- Motivation: ${riskData.motivation_level}` : ''}
${riskData.stress_level ? `- Stress Level: ${riskData.stress_level}` : ''}
${riskData.backlogs > 0 ? `- Backlogs: ${riskData.backlogs}` : ''}
${riskData.past_failures > 0 ? `- Past Failures: ${riskData.past_failures}` : ''}

IMPORTANT: 
- Each suggestion MUST be under 100 characters
- Be specific and actionable
- Focus on the most critical issues
- Return ONLY a JSON array, no other text

Example format: ["Improve attendance to 75%+", "Get help for weak subjects", "Manage stress with counseling"]

Return JSON array only:`;

    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini API response:', data);
      return [];
    }

    const generatedText = data.candidates[0].content.parts[0].text.trim();
    
    // Try to parse JSON array from response
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const suggestions = JSON.parse(cleanedText);
      
      if (Array.isArray(suggestions)) {
        // Ensure each suggestion is brief (max 100 chars) and return max 5
        return suggestions
          .slice(0, 5)
          .map((s: string) => {
            const suggestion = String(s).trim();
            // Truncate if too long
            return suggestion.length > 100 ? suggestion.substring(0, 97) + '...' : suggestion;
          })
          .filter((s: string) => s.length > 0);
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract suggestions from text
      console.warn('Failed to parse Gemini response as JSON, extracting from text:', parseError);
      
      // Extract suggestions from numbered list or bullet points
      const lines = generatedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          // Remove numbering (1., 2., - , *, etc.)
          return line.replace(/^[\d\-*•]\s*/, '').trim();
        })
        .filter(line => line.length > 0 && line.length <= 100);
      
      return lines.slice(0, 5);
    }

    return [];
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return [];
  }
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}

