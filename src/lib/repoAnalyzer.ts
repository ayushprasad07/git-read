type RepoFile = {
    path : string,
    type : "blob" | "tree",
}

export async function analyseRepo(files : RepoFile[]){
    const filePaths = files.map(file => file.path.toLowerCase());

    const analysis = {
        language: "Unknown",
        framework: "Unknown",
        packageManager: "Unknown",
        projectType: "Unknown",
        hasDocker: false,
        hasTests: false,
    };

    if (filePaths.includes("package.json")) {
        analysis.language = "JavaScript / TypeScript";
        analysis.packageManager = "npm / yarn / pnpm";

        if (filePaths.includes("next.config.js")) {
        analysis.framework = "Next.js";
        analysis.projectType = "Web Application";
        } else if (filePaths.includes("vite.config.js")) {
        analysis.framework = "Vite";
        detectFrontendFramework(filePaths, analysis);
        } else {
        analysis.framework = "Node.js";
        analysis.projectType = "Backend / Script";
        }
    }

    if (
        filePaths.includes("requirements.txt") ||
        filePaths.includes("pyproject.toml")
    ) {
        analysis.language = "Python";
        analysis.packageManager = "pip / poetry";

        if (filePaths.includes("manage.py")) {
        analysis.framework = "Django";
        analysis.projectType = "Web Application";
        } else if (filePaths.includes("app.py")) {
        analysis.framework = "Flask";
        analysis.projectType = "Web Application";
        } else {
        analysis.framework = "Python Script";
        analysis.projectType = "Utility / Script";
        }
    }

    if (filePaths.includes("pom.xml")) {
        analysis.language = "Java";
        analysis.packageManager = "Maven";
        analysis.framework = "Spring / Java Application";
        analysis.projectType = "Backend Application";
    }

    if (filePaths.includes("build.gradle")) {
        analysis.language = "Java";
        analysis.packageManager = "Gradle";
        analysis.framework = "Java Application";
        analysis.projectType = "Backend Application";
    }

    if (filePaths.includes("dockerfile")) {
        analysis.hasDocker = true;
    }

    if (
        filePaths.some((p) =>
        p.includes("test") || p.includes("__tests__")
        )
    ) {
        analysis.hasTests = true;
    }

    return analysis;
}

function detectFrontendFramework(
  filePaths: string[],
  analysis: any
) {
  if (filePaths.includes("src/app.tsx") || filePaths.includes("src/index.tsx")) {
    analysis.framework = "React";
    analysis.projectType = "Frontend Application";
  } else if (filePaths.includes("angular.json")) {
    analysis.framework = "Angular";
    analysis.projectType = "Frontend Application";
  } else if (filePaths.includes("vue.config.js")) {
    analysis.framework = "Vue.js";
    analysis.projectType = "Frontend Application";
  }
}
