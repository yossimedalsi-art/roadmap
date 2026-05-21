# 🧭 Heart Compass - Interactive Therapeutic Engine

**Heart Compass** is an advanced, real-time therapeutic web application designed specifically for adolescents and young adults. It bypasses classic clinical resistance by translating complex psychological protocols (CBT, Somatic Experiencing, and Shadow Work) into an engaging, gamified "journey" using archetypes and visual worlds.

---

## ✨ Key Features

*   **Dual-Interface Synchronization:** 
    *   **Trainee View:** An immersive, distraction-free environment where the user embanks on a journey, encountering "blocking" archetypes and answering deep introspective questions.
    *   **Coach Dashboard:** A real-time clinical mirror that reveals the "Shadow Pattern" behind every trainee choice, providing the coach with dynamic deepening questions and clinical framing.
*   **Live Resource Injection:** The coach can actively intervene during the session by opening a resource deck and sending a "Wise Archetype" directly to the trainee's screen with beautiful animations, pivoting the therapeutic conversation.
*   **10-Step Clinical Peeling Flow:** A structured dialogue flow that moves the trainee from the external trigger ➔ emotional response ➔ somatic anchor ➔ survival urge ➔ cognitive distortion ➔ and finally, integration and discovering the core need.
*   **Automated Homework Engine:** At the end of the journey, the system automatically generates an environment-specific action plan (72 hours, 1 week, 30 days) and a summary PDF based on the trainee's answers.
*   **Print & PDF Ready:** Built-in PDF generation for clinical record keeping and trainee takeaways.

---

## 🛠️ Tech Stack

*   **Frontend Framework:** React 18 (with Vite for rapid development)
*   **Language:** TypeScript (Strict typing for clinical data structures)
*   **Styling:** Tailwind CSS (Custom glassmorphism and modern UI tokens)
*   **Animations:** Framer Motion (Smooth page transitions and real-time interactive feedback)
*   **Icons:** Lucide React
*   **State Management:** LocalStorage / Browser Storage Events (Currently optimized for local peer-to-peer syncing, architected to scale easily to WebSockets/Firebase).

---

## 🧠 Clinical Methodology (M.S.A)

Heart Compass operates on a core therapeutic methodology designed to unmask defense mechanisms:
1.  **Identification:** Externalizing the internal conflict using visual archetype cards.
2.  **Somatic & Urge Processing:** Grounding the adolescent in the body rather than intellectualizing the problem.
3.  **The Shadow Reveal:** Uncovering the hidden protective mechanism behind destructive behaviors.
4.  **Resource Integration:** Supplying the adolescent with a new internal character to rely on.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v16+) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/heart-compass.git
   ```

2. Navigate to the project directory:
   ```bash
   cd heart-compass
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`.

---

## 🏗️ Future Roadmap (SaaS Transition)

*   [ ] **Real-time Database Integration:** Migrate from `localStorage` sync to Supabase/Firebase for remote tele-health sessions.
*   [ ] **Authentication:** Implement multi-tenancy auth for independent coach accounts.
*   [ ] **PWA (Progressive Web App):** Add service workers for a native mobile experience without App Store dependencies.
*   [ ] **Stripe Integration:** Subscription management for clinical organizations.

---

*Designed and developed for deep, transformative work.*
