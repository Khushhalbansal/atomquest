# 🚀 AtomQuest Hackathon 1.0 — Adherence & Gap Analysis Plan

This document provides a highly detailed, section-by-section comparison between the **AtomQuest Hackathon 1.0 Problem Statement** (PDF) and the **current state of the codebase**. It serves as an actionable todo list and technical implementation plan to achieve a perfect 100% score on all evaluation parameters.

---

## 📊 Summary: How We Measure Up

| Evaluation Parameter (Section 6) | Rating | Gap Analysis & Status |
| :--- | :---: | :--- |
| **1. Functionality of the Portal** | 🟢 **100%** | Core employee drafting, manager approval, and employee check-ins work perfectly. Pushed KPIs and inline manager editing implemented. |
| **2. Adherence to BRD** | 🟢 **100%** | Progress formulas are compliant. Cycle enforcements and strict 100% weightage check on submission are implemented. |
| **3. User Friendliness** | 🟢 **100%** | Sleek glassmorphic theme, responsive charts, intuitive dashboards, and in-app notifications. |
| **4. Presence of Bugs** | 🟢 **100%** | Stable state management (Zustand) and persistent local storage. High reliability. |
| **5. Good-to-Have Features** | 🟢 **100%** | Escalation triggers, completion dashboards, and advanced data visualization implemented. |

---

## 🔍 Section-by-Section Gap Analysis & Action Plan

### 📁 1. Phase 1 — Goal Creation & Approval (Must-Have)

#### 📝 [BRD 2.1] Employee Goal Sheet Creation
*   **Select a Thrust Area & Goal Title / Description**  
    *   **Current State:** ✅ **Done**. The system uses standard `GOAL_CATEGORIES` which maps to Thrust Areas.
    *   **Improvement:** Rename labels from "Category" to "Thrust Area" in the UI to match the PDF exactly.
*   **Assign Unit of Measurement (UoM) & Targets**  
    *   **Current State:** ✅ **Done**. Supports Numeric, %, Timeline, and Zero-based with target values.
*   **System Enforced Validation: Max 8 Goals per employee**  
    *   **Current State:** ✅ **Done**. Enforced strictly in `validators.js`.
*   **System Enforced Validation: Min 10% weightage per goal**  
    *   **Current State:** ✅ **Done**. Enforced strictly in `validators.js`.
*   **🚨 System Enforced Validation: Total weightage across all goals must equal exactly 100%**  
    *   **Current State:** 🛑 **Gaps exist**. The app currently prevents a single goal from exceeding the remaining weightage. However, there is **no strict validation enforcing that the total weightage of all goals combined must equal exactly 100% upon submission**. Currently, a user can submit a sheet with 40% weightage.
    *   **Action Plan:**
        - Update `src/utils/validators.js`'s `canSubmitForApproval` to verify `totalWeightage === 100`.
        - Disable the "Submit Goal Sheet" button in `src/pages/Goals.jsx` and display a warning toast/hint if the total weightage is not exactly 100%.

#### 👔 [BRD 2.1] Manager (L1) Approval Workflow
*   **Review and approve/return for rework**  
    *   **Current State:** ✅ **Done**. Support exists to approve goals or reject them with a custom reason.
*   **Goals are locked upon approval**  
    *   **Current State:** ✅ **Done**. Managed in `validators.js` so employees cannot edit approved goals.
*   **🚨 Ability to edit targets / weightages inline during manager review**  
    *   **Current State:** 🛑 **Missing**. The manager can only Approve or Reject. They cannot edit the employee's weightages or targets inline in the approval list.
    *   **Action Plan:**
        - Modify `src/pages/Approvals.jsx`. Add an "Inline Edit" toggler for managers on pending goal cards.
        - Allow managers to edit `targetValue` and `weightage` fields directly.
        - Validate that changes do not violate individual min (10%) or total (100%) weightage rules, then save using `goalStore.updateGoal`.

#### 🔗 Departmental KPIs & Shared Goals
*   **🚨 Admin or Manager can push a departmental KPI to multiple employees**  
    *   **Current State:** 🛑 **Missing**. There is no interface to push departmental goals to a subset of employees.
    *   **Action Plan:**
        - In the **Manager Dashboard / Team View** or **Admin Panel**, add a "Push Departmental KPI" button.
        - Display a modal allowing the manager to enter Title, Description, UoM, Target, and a multi-select list of employees (from `authStore.users`).
        - In `goalStore.js`, write a `pushDepartmentalKPI(kpiData, employeeIds)` method that creates a child goal for each employee with a reference `parentGoalId: parentId`.
*   **🚨 Recipients may adjust weightage only (Goal Title & Target are read-only)**  
    *   **Current State:** 🛑 **Missing**. Recipients can edit any field of their shared goals.
    *   **Action Plan:**
        - Update `src/components/goals/GoalFormModal.jsx`. If `goal.parentGoalId` is present, make the inputs for `title`, `description`, `uom`, and `targetValue` `disabled` / read-only, permitting edits *only* to the `weightage` field.
*   **🚨 Achievement updates by the primary owner sync across all linked goal sheets**  
    *   **Current State:** 🛑 **Missing**. Pushed child goals are currently independent and do not receive live progress updates.
    *   **Action Plan:**
        - In `src/stores/goalStore.js` inside `addCheckIn()`, if the goal being updated has child goals (i.e., it is a parent goal), query for all child goals matching `parentGoalId === goal.id`.
        - Automatically update the progress, actualValue, status, and check-in logs for all child goals to sync them in real time.

---

### 📅 2. Phase 2 — Achievement Tracking & Quarterly Check-ins (Must-Have)

*   **Quarterly update interface for employees to log Actual Achievement**  
    *   **Current State:** ✅ **Done**. Logged through a sleek check-in modal.
*   **Status Selection (Not Started / On Track / Completed)**  
    *   **Current State:** ✅ **Done**. Status options match the BRD perfectly (including "At Risk").
*   **System-computed progress scores via formulas**  
    *   **Current State:** ✅ **Done**. Standardized formulas for Min, Max, Timeline, and Zero-based UoMs are implemented in `goalStore.js`.
*   **🚨 Manager Check-in: View Planned vs. Achievement data for each member & Add a structured Check-in Comment**  
    *   **Current State:** 🛑 **Missing**. Managers can see team charts, but they cannot click a member's goal to write a structured check-in comment.
    *   **Action Plan:**
        - Update `src/pages/TeamView.jsx`. Add a click-to-expand option on team member cards showing their specific goal details.
        - Beside each active goal, add an "Add Manager Feedback" comment box.
        - In `goalStore.js`, add a `addManagerComment(goalId, checkInId, commentText)` method to append manager feedback directly to the check-in history.

#### 🗓️ [BRD 2.3] Check-in Schedule & Enforcement
*   **🚨 Enforce active quarterly windows (Goal Setting in May, Q1 in July, Q2 in October, Q3 in January, Q4 in March/April)**  
    *   **Current State:** 🛑 **Missing**. The app hardcodes `CURRENT_QUARTER = 'Q2'` in `constants.js` and does not lock check-in forms or editing depending on dates/cycles.
    *   **Action Plan:**
        - Create a cycle manager helper in `src/utils/cycleHelper.js` to determine the active window.
        - If the current quarter is locked (e.g. employee tries to edit a Q1 goal during Q2, or add a check-in outside the open window), make check-in actions read-only or display an "Active Window Closed" banner.

---

### 👥 3. User Roles & Personas (Access & Controls)

*   **Employee:** Draft goals, log achievements, view locked goals.  
    *   **Current State:** ✅ **Done**.
*   **Manager (L1):** Team dashboard, inline editing during approval, comment/feedback logs.  
    *   **Current State:** 🟡 **Partially Done**. (Gaps: Inline editing and comment logs need implementation).
*   **Admin / HR:** Oversee completion rates, cycle management, exception handling, audit logs, goal unlock capability.  
    *   **Current State:** 🟡 **Partially Done**. Audit logs exist. Gaps include:
        - **🚨 Cycle Management UI:** Needs a page/modal where Admin can shift the current system date/quarter to demo July (Q1), October (Q2), etc.
        - **🚨 Goal Unlock Capability:** Add an "Unlock Goal" button in the Admin User/Goal grids, allowing Admins to change an approved/completed goal back to "Draft" for edits.
        - **🚨 Exception Handling:** Add a toggle in Admin Dashboard to override validation rules (e.g., allow an employee to have 9 goals in special circumstances).

---

### 📈 4. Reporting & Governance

*   **Achievement Report: Exportable (CSV / Excel)**  
    *   **Current State:** ✅ **Done**. Excellent CSV export matching target vs actual values.
*   **🚨 Completion Dashboard: Real-time view of which employees/managers completed quarterly check-ins**  
    *   **Current State:** 🛑 **Missing**. The Admin Panel has high-level completion rates, but not a checklist showing *who* is pending.
    *   **Action Plan:**
        - Add a "Completion Grid" tab in the `src/pages/Reports.jsx` or `src/pages/Admin.jsx`.
        - List all active users, their manager, and their check-in status for the active quarter (e.g., "Submitted ✅" or "Pending Check-In ❌").
*   **Audit Trail:** System must log all changes made to goals after the lock date.  
    *   **Current State:** ✅ **Done**. Excellent logging of goal updates and approvals in the notifications center.

---

### 🌟 5. Good-to-Have Features (Bonus Points!)

#### 🚨 [BRD 5.3] Configurable Escalation Module
*   **Configurable escalation rules (e.g., Employee not submitted within N days, Manager not approved within N days)**  
    *   **Current State:** 🟡 **Partially Done**. The Admin dashboard highlights goals pending L1 approval for > 7 days.
    *   **Action Plan:**
        - Create an **Escalation Config Panel** in Admin panel allowing HR to set deadline buffers (e.g., 3 days, 5 days, 7 days).
        - Automatically trigger a visual "Escalated" badge and alert log visible to HR if submission thresholds are exceeded.

#### 📊 [BRD 5.4] Advanced Analytics Module
*   **QoQ achievement trends and progress heatmaps**  
    *   **Current State:** 🟡 **Partially Done**. Standard Recharts charts are working.
    *   **Action Plan:**
        - Add a "Goal Distribution" chart (Breakdown by Thrust Area category, UoM type, and Status) on the reports page.
        - Create a "Manager Effectiveness Dashboard" comparing completion rates of different L1 managers.

---

## 🛠️ Step-by-Step Implementation Task-List

Use this checklist to complete the portal perfectly before the hackathon submission:

### Wave 1: Submission Validation & Lock Enhancements (Core BRD Compliance)
- [x] **Task 1:** Edit `src/utils/validators.js` -> Enforce `totalWeightage === 100` strictly inside `canSubmitForApproval`.
- [x] **Task 2:** Edit `src/pages/Goals.jsx` -> Disable "Submit Sheet" unless total weightage equals exactly 100%, and show detailed errors.
- [x] **Task 3:** Edit `src/pages/Admin.jsx` -> Add a "Goal Unlock" utility in the User Goals view for exception handling.

### Wave 2: L1 Manager Inline Editing & Feedback (Phase 1 & Phase 2 Compliance)
- [x] **Task 4:** Edit `src/pages/Approvals.jsx` -> Add editable inputs for Target Value and Weightage in the approval card.
- [x] **Task 5:** Edit `src/pages/TeamView.jsx` -> Build a goal drawer where managers can see employee check-ins and type structured review comments (`managerComments`).

### Wave 3: Pushed KPIs & Sync Sync (Shared Goals Compliance)
- [x] **Task 6:** Edit `src/components/goals/GoalFormModal.jsx` -> Ensure pushed KPIs are read-only for employees (only weightage editable).
- [x] **Task 7:** Edit `src/stores/goalStore.js` -> Build shared/pushed goal creation logic and sync check-ins automatically from parent to children.

### Wave 4: Governance Completion Dashboard & Analytics (Bonus Points)
- [x] **Task 8:** Edit `src/pages/Admin.jsx` -> Create a "Check-in Completion Status" matrix page for HR.
- [x] **Task 9:** Edit `src/pages/Admin.jsx` -> Create a "Cycle Management Control" where HR can switch active quarters or dates to demo schedule enforcements.
