import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey : process.env.GEMINI_API_KEY
});

export default  async function generateReadme(prompt : string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
          role : "user",
          parts : [{text : prompt}]
      }],
      config: {
          temperature : 0.3,
      }
    });
  
    const text = response.text?.trim();
  
    if(!text){
        throw new Error("Failed to generate text");
    }

    return text;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate README")
  }
}
