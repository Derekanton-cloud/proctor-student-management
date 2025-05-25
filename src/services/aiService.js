const axios = require('axios');

class AIService {
  constructor() {
    // NVIDIA API key and base URL
    this.apiKey = process.env.NVIDIA_API_KEY;
    this.apiUrl = 'https://integrate.api.nvidia.com/v1'; // Replace with the correct NVIDIA API base URL if available
  }

  /**
   * Analyze student performance data and generate insights
   * @param {Object} studentData - Student performance and attendance data
   * @returns {Promise<Object>} AI analysis results
   */
  async analyzeStudentPerformance(studentData) {
    try {
      // Ensure all fields are present in the prompt
      const prompt = `Analyze the following student data and provide performance insights, pattern detection, and recommendations:

` +
        `Student Name: ${studentData.name || 'Not provided'}
` +
        `Batch: ${studentData.batch || 'Not specified'}
` +
        `Section: ${studentData.section || 'Not specified'}
` +
        `Current CGPA: ${studentData.cgpa || 'Not available'}
` +
        `Attendance Rate: ${studentData.attendance || 'Not available'}%

` +
        `Please provide:
` +
        `1. A brief analysis of the student's overall performance
` +
        `2. Identification of strengths and areas needing improvement
` +
        `3. Specific recommendations for improving academic performance
` +
        `4. Any concerning patterns that the proctor should address

` +
        `Format your response with clear section headings for Overall Performance, Strengths, Areas for Improvement, and Recommendations.`;

      console.log('Calling NVIDIA API with prompt:', prompt);

      let completeResponse = '';

      // Call NVIDIA API
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`, // Adjust endpoint path if needed
        {
          model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', // Replace with the correct model name
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          top_p: 1,
          max_tokens: 2048,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        }
      );

      // Process the streaming response
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter((line) => line.trim() !== '');
        for (const line of lines) {
          const trimmedLine = line.trim(); // Trim any extra spaces
          if (trimmedLine === '[DONE]') {
            // Skip processing if the line is the [DONE] message
            continue;
          }
          try {
            // Ensure the line starts with "data:" before parsing
            if (trimmedLine.startsWith('data:')) {
              const jsonString = trimmedLine.replace(/^data: /, '');
              const parsed = JSON.parse(jsonString);
              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                completeResponse += content;
              }
            } else {
              console.warn('Unexpected line format:', trimmedLine);
            }
          } catch (err) {
            console.error('Error parsing chunk:', err, 'Chunk:', trimmedLine);
          }
        }
      });

      // Wait for the stream to finish
      await new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', (err) => {
          console.error('Stream error:', err.message);
          reject(err);
        });
      });

      if (!completeResponse) {
        throw new Error('No response received from NVIDIA API');
      }

      console.log('NVIDIA API response complete:', completeResponse);

      // Parse and process the response
      return this.processAIResponse(completeResponse, studentData);
    } catch (error) {
      console.error('Error in analyzeStudentPerformance:', error);
      throw new Error('Failed to analyze student performance');
    }
  }

  /**
   * Format the prompt for the AI based on student data
   */
  formatAnalysisPrompt(studentData) {
    const { name, batch, section, cgpa, attendance, semesters, subjects } = studentData;

    let prompt = `Analyze the following student data and provide performance insights, pattern detection, and recommendations:\n\n`;
    prompt += `Student Name: ${name}\n`;
    prompt += `Batch: ${batch || 'Not specified'}\n`;
    prompt += `Section: ${section || 'Not specified'}\n`;
    prompt += `Current CGPA: ${cgpa || 'Not available'}\n`;
    prompt += `Attendance Rate: ${attendance || 'Not available'}%\n\n`;

    // Add recent semester performance
    if (semesters && semesters.length > 0) {
      const recentSemester = semesters[semesters.length - 1];
      prompt += `Recent Semester: ${recentSemester.name}\n`;
      prompt += `Semester CGPA: ${recentSemester.cgpa}\n\n`;

      if (recentSemester.subjects && recentSemester.subjects.length > 0) {
        prompt += 'Subject Performance:\n';
        recentSemester.subjects.forEach((subject) => {
          prompt += `- ${subject.name}: ${subject.marks}/${subject.maxMarks} (${(
            (subject.marks / subject.maxMarks) *
            100
          ).toFixed(1)}%)\n`;
        });
      }
    }

    prompt += `\nPlease provide:\n`;
    prompt += `1. A brief analysis of the student's overall performance\n`;
    prompt += `2. Identification of strengths and areas needing improvement\n`;
    prompt += `3. Specific recommendations for improving academic performance\n`;
    prompt += `4. Any concerning patterns that the proctor should address\n`;
    prompt += `\nFormat your response with clear section headings for Overall Performance, Strengths, Areas for Improvement, and Recommendations.`;

    return prompt;
  }

  /**
   * Process the NVIDIA API response and format it for the frontend
   */
  processAIResponse(responseData, studentData) {
    try {
      // Extract the AI-generated text from NVIDIA's response format
      const analysisText = responseData.generated_text || responseData.text || 'No analysis available.';

      // Parse the analysis into sections (if the AI formatted it properly)
      const sections = this.parseAnalysisSections(analysisText);

      return {
        success: true,
        studentName: studentData.name,
        analysis: analysisText,
        sections: sections,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error processing AI response:', error);
      return {
        success: false,
        error: 'Failed to process AI response',
        analysis: 'Analysis unavailable. Please try again.',
      };
    }
  }

  /**
   * Parse AI response into structured sections if possible
   */
  parseAnalysisSections(analysisText) {
    try {
      const sections = {};

      // Try to extract overall analysis
      const overallMatch = analysisText.match(/overall performance:?([^#]+)/i) || analysisText.match(/overall:?([^#]+)/i);
      if (overallMatch) sections.overall = overallMatch[1].trim();

      // Try to extract strengths
      const strengthsMatch = analysisText.match(/strengths:?([^#]+)/i);
      if (strengthsMatch) sections.strengths = strengthsMatch[1].trim();

      // Try to extract areas for improvement
      const improvementMatch =
        analysisText.match(/areas for improvement:?([^#]+)/i) ||
        analysisText.match(/needs improvement:?([^#]+)/i) ||
        analysisText.match(/areas of improvement:?([^#]+)/i);
      if (improvementMatch) sections.improvement = improvementMatch[1].trim();

      // Try to extract recommendations
      const recommendationsMatch = analysisText.match(/recommendations:?([^#]+)/i);
      if (recommendationsMatch) sections.recommendations = recommendationsMatch[1].trim();

      return sections;
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
      return {};
    }
  }
}

module.exports = new AIService();