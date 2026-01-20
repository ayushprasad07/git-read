# git-read

`git-read` is a full-stack web application designed to enhance the way developers interact with GitHub repositories. It leverages Google's Generative AI to provide intelligent insights, summaries, and analysis of repository content, making it easier to understand projects quickly. Users can browse repositories, view code with syntax highlighting, and utilize AI-powered features within an intuitive interface.

## Features

*   **GitHub Repository Integration:** Seamlessly connect and browse public GitHub repositories, fetching their content and metadata.
*   **AI-Powered Insights:** Utilize Google's Generative AI to analyze, summarize, or extract key information from repository files, code, and documentation.
*   **Interactive Code Viewer:** View code files with syntax highlighting and an integrated code editor component for an enhanced reading experience.
*   **Markdown Rendering:** Display READMEs and other Markdown files with full formatting, including support for GitHub Flavored Markdown (GFM).
*   **User Authentication:** Secure user accounts with login and registration capabilities, powered by NextAuth.js.
*   **Responsive User Interface:** Built with modern UI components (Radix UI) and styled with Tailwind CSS for a consistent and accessible experience across devices.
*   **API Rate Limiting:** Protects backend services and external API calls (e.g., GitHub, Google GenAI) using Upstash Redis for robust performance.

## Tech Stack

`git-read` is built using a modern and robust technology stack:

*   **Framework:** [Next.js](https://nextjs.org/) (React)
*   **Backend:** Node.js, Next.js API Routes
*   **Database:** MongoDB (via [Mongoose](https://mongoosejs.com/))
*   **Authentication:** [NextAuth.js](https://next-auth.js.org/), JWT, bcryptjs
*   **AI Integration:** [@google/genai](https://www.npmjs.com/package/@google/genai)
*   **GitHub Integration:** [@octokit/rest](https://github.com/octokit/rest.js/)
*   **UI Components:** [Radix UI](https://www.radix-ui.com/), [lucide-react](https://lucide.dev/icons/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Code Editor:** [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
*   **Rate Limiting:** [@upstash/ratelimit](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview) with [@upstash/redis](https://upstash.com/docs/oss/sdks/ts/redis/overview)
*   **Package Manager:** npm / yarn / pnpm
*   **Language:** TypeScript

## Installation

To get `git-read` up and running on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/git-read.git
    cd git-read
    ```

2.  **Install dependencies:**
    ```bash
    npm install # or yarn install or pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project based on `.env.local.example`. You will need to provide the following:

    *   `NEXTAUTH_SECRET`: A long, random string for NextAuth.js.
    *   `MONGODB_URI`: Your MongoDB connection string.
    *   `GITHUB_CLIENT_ID`: Your GitHub OAuth App Client ID.
    *   `GITHUB_CLIENT_SECRET`: Your GitHub OAuth App Client Secret.
    *   `GOOGLE_GENAI_API_KEY`: Your Google Generative AI API Key.
    *   `UPSTASH_REDIS_REST_URL`: Your Upstash Redis REST URL.
    *   `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis REST Token.

    Example `.env.local`:
    ```
    NEXTAUTH_SECRET="your_nextauth_secret_here"
    MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/gitread?retryWrites=true&w=majority"
    GITHUB_CLIENT_ID="your_github_client_id"
    GITHUB_CLIENT_SECRET="your_github_client_secret"
    GOOGLE_GENAI_API_KEY="your_google_genai_api_key"
    UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
    UPSTASH_REDIS_REST_TOKEN="your_redis_token"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev # or yarn dev or pnpm dev
    ```

    The application will be accessible at `http://localhost:3000`.

## Usage

Once the application is running:

1.  Navigate to `http://localhost:3000` in your web browser.
2.  Register a new account or log in if you already have one.
3.  Explore GitHub repositories by entering their URL or searching.
4.  Utilize the AI features to get summaries, explanations, or other insights into the repository's content.
5.  Browse files, view code with syntax highlighting, and read Markdown documentation.

## Project Structure

The project follows a standard Next.js App Router structure, organized for scalability and maintainability:

```
.
├── public/                  # Static assets (images, fonts, etc.)
├── src/
│   ├── app/                 # Next.js App Router (pages, layouts, API routes)
│   │   ├── api/             # Backend API routes (e.g., /api/auth, /api/github, /api/ai)
│   │   ├── (auth)/          # Grouped routes for authentication (login, register)
│   │   ├── (main)/          # Grouped routes for the main application features
│   │   ├── globals.css      # Global CSS styles
│   │   └── layout.tsx       # Root layout component
│   ├── components/          # Reusable React components (UI elements, feature-specific)
│   ├── lib/                 # Utility functions, helpers, and external service clients (e.g., GitHub client, AI client, DB connection)
│   ├── models/              # Mongoose schemas and models for MongoDB
│   ├── styles/              # Additional global styles or Tailwind CSS configurations
│   └── types/               # TypeScript type definitions and interfaces
├── .env.local.example       # Example environment variables file
├── next.config.mjs          # Next.js configuration
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── tailwind.config.ts       # Tailwind CSS configuration
```