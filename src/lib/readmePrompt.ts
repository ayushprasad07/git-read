type RepoAalysics = {
    language : string;
    framework : string;
    packageManager ?: string;
    projectType : string;
}

type ExtractedFile = Record<string, string>;

export const  buildReadmePrompt = async (
    repoName : string,
    analysis : RepoAalysics,
    extractedFiles : ExtractedFile
)=>{
    return `You are a senior software engineer.

Generate a professional GitHub README.md for the following repository.

Repository Name:
${repoName}

Project Analysis:
- Language: ${analysis.language}
- Framework: ${analysis.framework}
- Project Type: ${analysis.projectType}
- Package Manager: ${analysis.packageManager || "Unknown"}

Existing Documentation (if any):
${extractedFiles["readme.md"] || "No README provided"}

Configuration / Metadata:
${extractedFiles["package.json"] || extractedFiles["pyproject.toml"] || "N/A"}

Main Source Code (high-level):
${Object.entries(extractedFiles)
  .filter(([key]) =>
    key.includes("src/") ||
    key.endsWith(".py") ||
    key.endsWith(".js") ||
    key.endsWith(".ts")
  )
  .slice(0, 3)
  .map(([key, value]) => `File: ${key}\n${value.slice(0, 1000)}`)
  .join("\n\n")}

Instructions:
- Do NOT guess features that are not present
- Be concise but complete
- Use Markdown formatting
- Include sections:
  - Project Overview
  - Features
  - Tech Stack
  - Installation
  - Usage
  - Project Structure
  - License (generic)

Return ONLY valid Markdown.
`;
}