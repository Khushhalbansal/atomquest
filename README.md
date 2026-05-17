# 🌟 AtomQuest — Enterprise Goal-Setting and Appraisal Portal

AtomQuest is a next-generation corporate appraisal and goal-tracking application. Designed with modern **glassmorphism aesthetics**, smooth animations, and role-based workflows, the platform empowers employees, managers, and HR administrators to align corporate key performance indicators (KPIs), track achievements in real-time, and manage compliance alerts.

---

## 🏗️ Technical Architecture & Design Choices

The platform is designed with a **low-cost, zero-infrastructure-dependency framework**, ensuring immediate scalability and zero runtime database costs.

```mermaid
graph TD
    %% User Roles & Entry
    A1[Employee Persona] -->|Goal Creation & Check-ins| B[Vite Web App Frontend]
    A2[L1 Manager Persona] -->|Approval, Inline Edits & Comments| B
    A3[Admin/HR Persona] -->|Unlock, SSO Sync, Webhook Config, Escalations| B

    %% Frontend Stack & Styling
    B -->|UI Layers| C1[React 19 Components]
    B -->|Aesthetics| C2[Vanilla CSS Glassmorphism]
    B -->|Analytics| C3[Recharts Dynamic Visualizations]
    B -->|Icons| C4[Lucide React Engine]

    %% Local Core Engine
    C1 -->|Action Triggers| D[Zustand Client State Engine]
    D -->|Strict Rules Check| E[Validation & Constraints Module]
    D -->|Real-time Cache Sync| F[localStorage Persistent Cache]

    %% Constraint Rules
    E -->|Validation Rule 1| E1[Count Cap: Max 8 Goals]
    E -->|Validation Rule 2| E2[Lower Bound: Min 10% weight]
    E -->|Validation Rule 3| E3[Submission: Total weight = 100%]
    E -->|Validation Rule 4| E4[Boundary Protection: Div-by-Zero Safety]

    %% Integrations & Webhooks
    D -->|SSO Sync Toggle| G1[Microsoft Entra ID reporting Tree]
    D -->|Escalation Grace Days| G2[Rule-Based Escalation flowchart Map]
    D -->|Adaptive Cards| G3[MS Teams Incoming Webhook Sandbox]
```

### 💎 Technology Stack Justification
1. **Frontend Foundation**: React 19 + Vite. Vite enables instantaneous Hot Module Replacement (HMR) and compresses production assets in milliseconds.
2. **State Management**: **Zustand**. A lightweight, hook-based state container that prevents unnecessary virtual DOM re-renders by compiling isolated selector nodes.
3. **Styling**: Vanilla CSS custom variables. Avoids standard layout engines like TailwindCSS to deliver bespoke, ultra-premium visual aesthetics (glassmorphism backdrops, high-contrast text, vibrant system highlights).
4. **Resiliency & Offline Support**: Custom synchronization wrappers linking Zustand stores directly with `localStorage`, providing immediate loading and offline persistence.
5. **Cost Optimization**: All validations, compliance processing, formatting, and organizational tree synchronization run entirely on client-side client resources, meaning **hosting and server computing overhead is exactly $0**.

---

## 🛠️ Role-Based Workflows & User Journeys

The portal is designed around three distinct, secure corporate roles:

### 👤 1. Employee Journey
*   **Goal Sheet Creation**: Access a visual thrust area editor. Create goals by category, select a target UoM (Numeric, %, Timeline, or Zero-Based), and set targets.
*   **Enforced Constraints**:
    *   *Goal Cap*: Blocked from creating more than **8 goals**.
    *   *Min weightage*: Alerts trigger if any goal weightage falls below **10%**.
    *   *Submit rule*: The goal sheet submission remains locked until the total sum of weights equals **exactly 100%**.
*   **Progress Log & Check-in**: Quarterly interfaces enable logging actual values. The computation engine updates progress scores dynamically using UoM-compliant mathematical formulas.
*   **Approval Locks**: Approved goal cards instantly lock down as read-only.

### 👔 2. Manager (L1) Journey
*   **Approvals Panel**: View team members' pending goal sheets. Managers can **edit target values and weightages inline** to match resource constraints.
*   **Approve/Rework Feedbacks**: Click single-button approvals or reject goal sheets back to draft with custom explanatory feedback messages.
*   **Structured Reviews**: Expand team member profiles inside the **Team View** dashboard, review planned-versus-actual achievements, and log structured comments.
*   **KPI Push**: Push corporate KPIs (e.g. `Optimize SQL Query Latency`) with custom default weights. The title and target become read-only for recipient employees, and achievement updates sync back to the manager’s ledger automatically.

### 🛡️ 3. Admin / HR Partner Journey
*   **Goal Reversion & Unlock**: Search approved/completed goals and revert their state back to editable drafts, enabling exception-based edits.
*   **Completion Grid Matrix**: Real-time checklists showing HR exactly who completed goal submissions, manager reviews, and check-ins.
*   **Microsoft Entra ID (SSO) Sync**: Switch SSO enforcement state, view security group role Object GUID maps, and display organization reporting tree structures derived from AD.
*   **MS Teams Webhook Bot**: Customize payload endpoints and test active Teams chat dialog containers. Use inline Adaptive Cards to approve or request goal rework inside the console.
*   **Rule-Based Escalation Panel**: Set grace days thresholds for employees/managers. Recalculate escalations dynamically, trace pathway diagrams, and trigger manual warning chains.
*   **Reports Exporting**: Trigger full corporate CSV spreadsheet reports downloading target vs achievement metrics.

---

## 📸 High-Fidelity Portal Visual Evidence

The following actual high-resolution screenshots were captured from the running application during end-to-end automated browser validation tests:

### 🌐 1. Secure Access & Authentication Portal
A premium glassmorphic access panel with live role-based quick-access seeds for evaluators.
![Login Page](file:///C:/Users/khush/.gemini/antigravity/brain/4ca5d095-19c9-4977-9730-9ff9a9f6f494/artifacts/login_page_1778998532134.png)

---

### 👤 2. Employee Goal & Check-in Dashboard
Interactive sliders, thrust area categorizations, exact 100% weight validations, and dynamic formula progress cards.
![Employee Dashboard](file:///C:/Users/khush/.gemini/antigravity/brain/4ca5d095-19c9-4977-9730-9ff9a9f6f494/artifacts/employee_dashboard_1779003836826.png)

---

### 👔 3. Manager Performance Review & KPI Console
Visual team completion progress curves, inline review adjustment sliders, and structured check-in comment interfaces.
![Manager Dashboard](file:///C:/Users/khush/.gemini/antigravity/brain/4ca5d095-19c9-4977-9730-9ff9a9f6f494/artifacts/manager_dashboard_1779004063762.png)

---

### 🛡️ 4. Admin Governance, Entra ID Sync & Teams Webhook Console
Advanced configurations: Active Org Trees, MS Teams Bot sandboxes, rule-based escalation pathway chains, and goal-unlock panels.
![Admin Dashboard](file:///C:/Users/khush/.gemini/antigravity/brain/4ca5d095-19c9-4977-9730-9ff9a9f6f494/artifacts/admin_dashboard_1779004473632.png)

---

### 🔄 5. Interactive End-to-End User Journeys Demo (Video/Animation)
Experience the fluid glassmorphism animations and instant responsive validation engines in this actual recorded browser walkthrough.
![Dynamic User Journey WebP Demo](file:///C:/Users/khush/.gemini/antigravity/brain/4ca5d095-19c9-4977-9730-9ff9a9f6f494/artifacts/appraisal_system_demo_1779003540765.webp)

---

## ⚡ Setup & Local Execution Instructions

### Prerequisites
*   Node.js (v18.x or above)
*   npm

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd atomquest
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
*   Start the development server:
    ```bash
    npm run dev
    ```
    *(The portal will launch locally, typically at `http://localhost:5173/` or `http://localhost:5174/`)*
*   Compile a production-ready, highly compressed build bundle:
    ```bash
    npm run build
    ```
*   Preview the production build:
    ```bash
    npm run preview
    ```
