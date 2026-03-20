Assessment context
This is a submission for the Nutrabay AI Automation Intern Assessment — Option 4 (Advanced): SOP → AI Training System.
The goal was to build a practical, usable system that automates employee training from SOP documents — not just a static output, but an interactive tool a company could realistically deploy.

SOP Training Generator — Nutrabay AI Intern Assessment (Option 4 · Advanced)
An AI-powered web app that converts any Standard Operating Procedure (SOP) document into a structured, interactive training module — automatically.
What it does
Paste any SOP document and the app generates:

Structured summary — title, overview, and key takeaways
Training modules — step-by-step content broken into logical learning units, each with a clear objective
Interactive quiz — 5 evaluation questions with instant feedback and explanations
Learning path — a visual node-based sequence showing the recommended training flow

Demo SOP
The app comes preloaded with a Nutrabay-specific SOP: Customer Complaint & Return Handling v1.2, covering complaint intake, order verification, resolution categorization, refund processing, and documentation.
Tech stack

React (Vite) — frontend
Gemini 1.5 Flash (Google AI) — SOP parsing, module generation, quiz creation
No backend — the Gemini API is called directly from the browser

How to run locally
1. Clone the repo
  git clone https://github.com/anived19/SOP-Learning-Module.git
  cd SOP-Learning-Module

2. Install dependencies
   npm install

3. Add your Gemini API key
Create a .env file in the root:
  VITE_GEMINI_API_KEY=your_api_key_here

4. Run the app
   npm run dev
Open http://localhost:5173 in your browser.


How it works

User pastes an SOP document into the input panel
The full SOP text is sent to the Gemini API with a structured prompt
Gemini returns a JSON object containing the summary, modules, quiz, and learning path

PROJECT STRUCTURE
SOP-Learning-Module/
├── src/
│   ├── App.jsx        # Main application component
│   ├── main.jsx       # React entry point
│   └── index.css      # Base styles
├── index.html
├── vite.config.js
├── package.json
└── .env               # Not committed — add your own API key
The React frontend renders the JSON across four interactive tabs
   
