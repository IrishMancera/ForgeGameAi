BUILD A COMPLETE, HIGH-FIDELITY, RESPONSIVE FRONTEND WEB APPLICATION

Product name: GameForge Systems AI
Tagline: Architect. Balance. Simulate. Ship.
Product type: AI-powered mobile game system design, economy balancing, player psychology, simulation, auditing, analytics, documentation, and automatic Excel workbook generator.

Do not create only a landing page or static mockup. Build the complete clickable application described below. Every navigation item, button, modal, filter, form, table, chart, dropdown, toggle, tab, empty state, loading state, success state, and error state must be represented and interactive. Use realistic demo data for a sample game called “Haunted Hotel.” The application should look suitable for a real professional mobile-game studio.

==================================================
1. BUILD AND TECHNICAL REQUIREMENTS
==================================================

Build the project as a clean React + TypeScript application using reusable components.

Use:
- React and TypeScript
- Tailwind CSS or equivalent utility-first styling
- Accessible component primitives
- Recharts or equivalent for charts
- Lucide icons or an equivalent consistent outline icon library
- A table system supporting sorting, search, filters, sticky headers, row selection, inline editing, and pagination
- Local mock data and local state so the prototype works without a backend
- A clear service/data layer so mock services can later be replaced with real APIs
- SheetJS/XLSX if package use is supported; otherwise implement the full Workbook Studio UI and a realistic “Generate XLSX” simulated export flow

Application requirements:
- Responsive desktop, tablet, and mobile layouts
- Desktop-first because the app contains large tables and analytics
- Semantic HTML and WCAG 2.2 AA color contrast
- Full keyboard focus states
- Tooltips on unfamiliar controls
- Reduced-motion support
- Light theme only for this version
- No broken buttons or dead navigation
- Persist editable demo state in local storage when possible
- Add helpful toast notifications for save, export, audit, simulation, approval, and validation actions
- Include loading skeletons and realistic empty states

Do not use lorem ipsum. Write realistic product text and realistic game-system data everywhere.

==================================================
2. VISUAL DIRECTION
==================================================

Create a premium light, technical, and gamified interface. The visual style should combine:
- A professional systems-design IDE
- A modern analytics dashboard
- A game progression interface
- A spreadsheet modeling tool

Use a warm pearl-white page background, crisp white cards, subtle deep-navy borders, soft violet shadows, compact HUD-like labels, achievement feedback, progress rings, chart cards, and small pixel-grid accents. Keep it sophisticated and professional rather than childish.

Use exactly these five primary brand colors:
1. Royal Violet — #6C3BFF — primary actions, selected tabs, AI state, progress
2. Electric Red — #FF3B4F — critical risks, destructive actions, imbalance
3. Quest Yellow — #FFC928 — achievements, highlights, rewards, milestones
4. Data Cyan — #19C6D1 — charts, healthy economy sources, informational states
5. Deep Navy — #17152B — primary text, technical borders, high contrast

Supporting neutrals:
- Background — #FFF9F2
- Card — #FFFFFF
- Muted surface — #F4F1FA
- Secondary text — #6C6880
- Border — #DED9EA
- Success — #19A974

Use this five-font system:
1. Orbitron — logo, major level/achievement moments, special headings
2. Space Grotesk — main UI, navigation, forms, body content
3. IBM Plex Mono — formulas, IDs, tables, JSON, numeric values
4. Rajdhani — chart titles, badges, compact HUD labels
5. Cormorant Garamond — rare AI insight quotations only

Load the fonts from Google Fonts when available and provide safe fallbacks. Use no more than three fonts on a single screen. Space Grotesk and IBM Plex Mono should carry most of the interface.

Component styling:
- Card radius: 14px
- Button radius: 10px
- Base spacing grid: 8px
- Thin deep-navy or muted-violet borders
- Subtle violet shadow at low opacity
- Smooth 160–240ms transitions
- Avoid excessive gradients
- Avoid glassmorphism that reduces readability
- Avoid casino styling, slot-machine motifs, flashing effects, or coercive reward visuals
- Never rely only on color to communicate status; include icon and text

==================================================
3. GLOBAL APPLICATION SHELL
==================================================

Build a persistent application shell.

LEFT SIDEBAR
- Expanded width about 236px; collapsible to icon-only mode about 72px
- Logo: stylized geometric G mark plus “GAMEFORGE SYSTEMS AI”
- Project navigation items:
  1. Command Center
  2. Game Blueprint
  3. Systems
  4. Economy Lab
  5. Progression
  6. Player Psychology
  7. Simulation
  8. Analytics
  9. Workbook Studio
  10. Knowledge Base
  11. Audit Center
- Bottom area: Project Settings, Help, current user profile
- Selected item uses a violet rail, pale-violet background, icon, and label
- Show small status badges when a section has critical risks or incomplete tasks

TOP HEADER
- Current project name: Haunted Hotel
- Current game version selector: v0.9.3
- Platform badge: Mobile
- Genre badge: Hybrid-Casual Tycoon
- Environment/status: All Systems Online
- Global search button
- Command palette button with Ctrl/Cmd + K shortcut
- Notifications bell with unread badge
- Share button
- Primary Export dropdown
- User avatar menu

RIGHT AI COPILOT PANEL
- Collapsible right panel, 360–400px wide on desktop
- Title: System Architect AI
- Online status and model badge
- Agent-role chips: Architect, Balancer, Auditor, Psychologist, Documenter
- Conversation area with realistic recommendations
- Prompt box with attachment button, send button, and suggested prompts
- Prominent actions: Run Full Audit and Build Missing Tables
- Each AI recommendation must show confidence, affected systems, assumptions, and Apply/Edit/Reject buttons
- When Apply is clicked, show a confirmation modal listing affected tables and create a change-log entry
- Panel becomes a slide-over drawer on tablet/mobile

GLOBAL STATES
- Unsaved-changes indicator
- Autosave status
- Undo/redo
- Toast center
- Confirmation dialogs for risky changes
- Project-wide “Blueprint completion” XP toast, for example: Blueprint 86% Complete, +250 XP

==================================================
4. PUBLIC WEBSITE
==================================================

Also build a public marketing website accessible before entering the app.

PUBLIC NAVIGATION
- Product
- Solutions
- Templates
- Workbook Gallery
- Methodology
- Pricing
- Documentation
- Sign In
- Primary CTA: Start Your Blueprint

HOME PAGE
- Hero headline: “Build a game system that survives contact with real players.”
- Supporting line: “Turn ideas and incomplete documents into connected mechanics, balanced economies, ethical player experiences, simulations, audits, and developer-ready workbooks.”
- Primary CTA: Start Your Blueprint
- Secondary CTA: Explore Sample Project
- Hero visual showing the real application dashboard
- Five-agent team section
- From Idea to Workbook workflow section
- Interactive mini economy calculator
- Output gallery with system blueprint, audit, psychology map, charts, and spreadsheet previews
- Genre template cards: Idle, Tycoon, Merge, Puzzle, RPG, Hotel, Farming, Survival
- Responsible player psychology statement
- Pricing preview
- Final CTA and complete footer

PRODUCT PAGE
- Anchored sections for Blueprint, Systems, Economy, Psychology, Simulation, Audit, Analytics, and Workbook Studio
- Each section includes one realistic product preview and its inputs and outputs

TEMPLATES PAGE
- Search and filters for genre, core loop, monetization, session length, complexity, multiplayer, and live operations
- Cards show included systems, workbook-tab count, estimated setup time, and Use Template button

WORKBOOK GALLERY
- Preview different generated workbooks
- Allow a user to inspect the sheet list, sample formulas, charts, and a sample table

METHODOLOGY
- Explain the process: extract, structure, model, simulate, audit, approve, export
- Clearly distinguish facts, assumptions, AI recommendations, simulated results, and observed analytics

PRICING
- Three polished pricing cards: Solo Designer, Studio, Enterprise
- Monthly/annual toggle
- Feature comparison table
- FAQ accordion

DOCUMENTATION
- Searchable docs sidebar
- Onboarding, project schema, agent roles, formula reference, workbook schema, integrations, security, and troubleshooting

AUTH PAGES
- Sign in
- Register
- Forgot password
- Organization invitation
- Polished split layout with small application preview

==================================================
5. COMMAND CENTER
==================================================

Build a dense but readable dashboard titled “Haunted Hotel — System Health.”

Top metrics:
- System Health: 84/100
- Blueprint Complete: 86%
- Critical Risks: 2
- Open Decisions: 7
- Last Simulation: 12 minutes ago

Dashboard cards:

1. RETENTION FORECAST
- Smooth D1/D7/D30 line chart
- D1 42%, D7 18%, D30 8%
- Toggle: Forecast / Observed
- Info tooltip explaining modeled data

2. ECONOMY BALANCE
- Sources versus Sinks horizontal bars
- Currency, Items, Energy, Premium
- Overall status: Stable
- Net Flow: +2.21%

3. EXCITEMENT CURVE
- Curved line with labeled stages: Onboarding Hook, Mastery Ramp, Challenge Spike, Relief Reward, Boss Peak
- Summary values: Excitement Score 78/100, Curve Stability Good, Volatility Medium

4. PROGRESSION TIMELINE
- Levels 1–50
- Markers for main unlocks, feature unlocks, and power spikes
- Hover details for each marker

5. RISK RADAR
- Radar chart and risk list
- Paywall Spike — High
- Content Gap — Medium
- Reward Fatigue — Medium

6. WORKBOOK GENERATOR
- Checklist of selected sheet groups
- Readiness indicator
- Generate XLSX button

7. ECONOMY OVERVIEW TABLE
- Sources, Sinks, Net Flow, Balance

8. LEVEL PROGRESSION SAMPLE
- Level, XP Required, Time to Next, Unlock, Power Spike

9. TOP FIVE SINKS
- Sink, Type, Impact percentage, seven-day trend

10. KPI FORECAST
- D1, D7, D30, ARPDAU, LTV with current, forecast, and change

Add a top-right dashboard control to customize widgets and save layout.

==================================================
6. GAME BLUEPRINT
==================================================

Create a multi-section blueprint editor with a left section index and autosaved forms.

Sections:
- Game Identity
- Design Pillars
- Player Fantasy
- Target Audience
- Core Gameplay Loop
- Meta Loop
- Session Loop
- Long-Term Loop
- Win/Loss/Recovery
- Content Cadence
- Monetization Model
- Social and Live Operations
- Production Constraints
- Assumptions
- Open Questions

Include a visual loop builder where users can add nodes, connect them, reorder steps, and switch between diagram and table views.

Show completion per section, missing required fields, AI suggestions, decision status, and last editor. Add a “Generate from Game Idea” modal with a large description box and adaptive questions.

==================================================
7. SYSTEMS
==================================================

Create view toggles for Graph, Matrix, Table, Timeline, and Missing Systems.

SYSTEM GRAPH
- Interactive node graph
- Node colors by category: Core, Meta, Economy, Progression, Content, Social, LiveOps
- Zoom, pan, fit, filter, mini-map
- Click a node to open a details drawer
- Highlight upstream and downstream dependencies

SYSTEM TABLE COLUMNS
- System ID
- Name
- Category
- Player Purpose
- Trigger
- Inputs
- Outputs
- Unlock Condition
- Dependencies
- Owner
- Status
- Confidence
- Version
- Actions

SYSTEM DETAILS DRAWER
- Description
- Inputs and outputs
- States and transitions
- Rewards and sinks
- Failure/recovery rules
- Dependencies and dependents
- UI surfaces
- Analytics events
- Edge cases
- Comments
- Version history

Include Add System, Duplicate, Archive, Compare Version, and Ask AI actions.

==================================================
8. ECONOMY LAB
==================================================

Sub-tabs:
- Overview
- Currencies
- Sources and Sinks
- Income Formulas
- Upgrade Costs
- Idle Earnings
- Rewards
- Drop Tables
- Store and Monetization
- Sensitivity Test

OVERVIEW
- Economy health score
- Source/sink ratio
- Inflation forecast
- Hoarding risk
- Bottleneck timeline
- Currency-flow Sankey-style visualization or clear flow chart

CURRENCIES TABLE
- Currency ID
- Name
- Type: soft, hard, energy, event, prestige
- Starting balance
- Cap
- Visibility
- Earn methods
- Spend methods
- Exchange rules
- Status

FORMULA EDITOR
- Split layout with editable variables on the left and formula/code editor on the right
- Live formula validation
- Preview chart
- Plain-language formula explanation
- Dependencies list
- Save as scenario

Use realistic formulas:
- Income(level) = BaseIncome × IncomeMultiplier^(level - 1)
- UpgradeCost(level) = BaseCost × CostMultiplier^(level - 1)
- TimeToUpgrade = UpgradeCost / EffectiveIncomePerSecond
- OfflineReward = min(OfflineSeconds, OfflineCap) × EffectiveIncomePerSecond × OfflineRate
- ExpectedDropValue = sum(Probability × Value)
- NetCurrencyFlow = TotalSources - TotalSinks

DROP-TABLE EDITOR
- Reward ID, item, rarity, weight, normalized probability, value, eligibility, pity contribution
- Show total probability and validation state
- Block export if the configured probability pool is invalid

SENSITIVITY TEST
- Sliders for income multiplier, cost multiplier, session length, reward value, and offline rate
- Before/after charts
- Show which KPIs and systems are most affected

==================================================
9. PROGRESSION
==================================================

Sub-tabs:
- Player XP
- Account/Hotel Level
- Feature Unlocks
- Upgrade Ladders
- Milestones
- Prestige
- Difficulty vs Power
- Content Burn

Build editable progression tables and visual curves.

LEVEL TABLE COLUMNS
- Level
- XP Required
- Cumulative XP
- Estimated Sessions
- Estimated Real Time
- Main Unlock
- Reward
- Required Power
- Expected Player Power
- Difficulty Gap
- Notes

Add controls to choose linear, exponential, logarithmic, piecewise, or custom curves. Display a warning when a new formula creates an excessive wall. Include early game, midgame, late game, and elder game range overlays.

==================================================
10. PLAYER PSYCHOLOGY
==================================================

Create this as a serious player-experience and ethical-design analysis center, not an addiction or manipulation tool.

Sub-tabs:
1. Motivation
2. Cognitive Load
3. Learning and Mastery
4. Excitement Curve
5. Difficulty and Friction
6. Reward Quality
7. Session Design
8. Fairness and Trust
9. Ethical Risk
10. Player Profiles

PSYCHOLOGY OVERVIEW
- Motivation Coverage score
- Cognitive Load risk
- Learning Clarity score
- Excitement Stability
- Fairness and Trust score
- Reward Fatigue risk
- Frustration risk
- Player Autonomy score
- Ethical Risk severity

MOTIVATION MAP
- Competence
- Autonomy
- Relatedness
- Collection
- Creativity
- Mastery
- Status
- Narrative
- Discovery
- Show which systems support each motivation and identify over-reliance

EXCITEMENT CURVE EDITOR
- Timeline with draggable experience beats
- Beat type, intensity, duration, purpose, reward, preceding tension, following relief
- Compare intended and simulated curves

COGNITIVE-LOAD AUDIT
- Concurrent goals
- Visible currencies
- New mechanics per session
- Tutorial prompts
- Decision complexity
- UI density
- Recommended safe ranges and evidence notes

ETHICAL RISK
- Flag deceptive timers, unclear odds, coercive scarcity, pay-to-progress walls, excessive interruptions, loss concealment, child-directed spending pressure, and removal of meaningful choice
- Severity, evidence, affected screen/system, remediation, status
- Use calm professional warning design, not sensational messaging
- If a harmful optimization is entered into the AI panel, show a refusal plus fair alternatives such as transparent value, meaningful choices, content variety, mastery, and respectful reminders

==================================================
11. SIMULATION
==================================================

Create a simulation builder and results workspace.

Simulation types:
- Deterministic Projection
- Cohort Simulation
- Monte Carlo Economy
- Player Archetype
- First Session
- Free vs Payer
- Idle/Offline
- Content Burn
- Live Event
- Exploit/Worst Case

INPUT PANEL
- Scenario name
- Simulation type
- Horizon in hours/days
- Number of virtual players
- Player profile
- Sessions per day
- Session length
- Skill level
- Spend profile
- Reward strategy
- Random seed
- Advanced variables

RUN EXPERIENCE
- Run button with progress state
- Cancel and retry
- Realistic progress steps: Validating Inputs, Building Cohorts, Running Model, Aggregating Results, Generating Findings

RESULTS
- Time to milestone
- Currency balance percentiles
- Content consumed
- Expected spend
- Feature adoption
- Difficulty exposure
- Churn-risk proxy
- Confidence ranges
- Comparison against baseline
- Key AI findings

Label all sample output clearly as simulated data, not observed player behavior.

==================================================
12. ANALYTICS
==================================================

Create a segmented analytics dashboard with a permanent toggle between Forecast and Observed.

Sub-tabs:
- Acquisition and Onboarding
- Retention
- Sessions
- Feature Adoption
- Economy
- Progression
- Difficulty and Failure
- Monetization
- Content
- Live Operations

Include date range, platform, country, app version, player segment, payer type, and experiment filters.

Create charts for:
- D1/D7/D30 retention
- Onboarding funnel
- Sessions per player
- Session duration distribution
- Feature adoption
- Currency earned/spent
- Balance distribution
- Level progression
- Failure rate by level
- Conversion and payer segments
- Content completion
- Event participation

Use realistic data, annotations, comparison periods, download CSV, and “Ask AI About This” actions.

==================================================
13. WORKBOOK STUDIO
==================================================

This is a core feature. Build a professional Excel-generation interface.

LEFT PANEL
- Workbook name
- Game version
- Scenario
- Export format: XLSX, CSV Bundle, Google Sheets Ready, JSON Data Pack
- Locale
- Currency format
- Include formulas toggle
- Include sample data toggle
- Protect formula cells toggle
- Include charts toggle
- Freeze headers toggle
- Add validation lists toggle

CENTER WORKBOOK PREVIEW
- Sheet tab list
- Spreadsheet-like preview grid
- Formula bar
- Named-range panel
- Cell style legend
- Validation errors

RIGHT VALIDATION PANEL
- Readiness score
- Missing required tables
- Formula errors
- Invalid references
- Probability totals
- Missing units
- Unapproved assumptions
- Warnings and blockers

Required selectable sheets:
01_README
02_Assumptions
03_Game_Overview
04_Glossary_IDs
05_Core_Loops
06_System_Registry
07_Feature_Unlocks
08_Currencies
09_Sources_Sinks
10_Income_Formulas
11_Upgrade_Costs
12_Player_XP
13_World_Progression
14_Time_To_Progress
15_Idle_Projections
16_Content_Registry
17_Staff_Characters
18_Customer_Enemies
19_Rewards
20_Loot_Drop_Tables
21_Daily_LiveOps
22_Store_Monetization
23_Psychology_Map
24_Excitement_Curve
25_Difficulty_Curve
26_Simulation_Inputs
27_Simulation_Output
28_KPI_Forecast
29_Analytics_Events
30_Risk_Register
31_Audit_Findings
32_Decision_Log
33_Change_Log
34_Developer_Handoff

Each sheet row must display:
- Checkbox
- Sheet number/name
- Description
- Row count
- Formula count
- Validation status
- Last updated
- Preview action

GENERATION FLOW
1. Click Generate Workbook
2. Validate all selected sheets
3. If blockers exist, show Fix Automatically, Review, or Export Draft
4. Show generation progress
5. Display success modal with filename, size, sheet count, formula count, and Download button
6. Add export record to history

Include Export History with version, author, scenario, date, format, status, and actions to download, duplicate, compare, or delete.

==================================================
14. KNOWLEDGE BASE
==================================================

Create upload and knowledge-management views.

Supported source cards:
- Game Design Documents
- Excel/CSV economy sheets
- PDFs
- Images
- Analytics schemas
- Mechanics notes
- Past game templates
- Team decisions

Upload flow:
- Drag/drop area
- File list and processing progress
- States: Uploading, Extracting, Mapping, Needs Review, Approved, Failed
- Review extracted facts, assumptions, formulas, tables, and contradictions
- Each extracted claim shows source filename, page/sheet/cell reference, confidence, project scope, and approval state

Add source search, tag filters, version history, and a “Use in AI Answers” toggle.

==================================================
15. AUDIT CENTER
==================================================

Create a full audit workspace.

Top controls:
- Run Full Audit
- Audit scope selector
- Current version/scenario
- Severity filters
- Category filters
- Assigned owner
- Status

Audit categories:
- Missing Tables and Fields
- Contradictions
- Broken Dependencies
- Orphan Features
- Circular Unlocks
- Formula Errors
- Currency Overflow/Underflow
- Unreachable Milestones
- Reward and Content Gaps
- Difficulty Spikes
- Monetization Fairness
- Psychology and Ethical Risk
- Analytics Coverage
- Developer Handoff Completeness

FINDING TABLE COLUMNS
- Finding ID
- Severity
- Category
- Finding
- Evidence
- Affected Systems
- Expected Impact
- Confidence
- Owner
- Status
- Proposed Fix
- Actions

Clicking a finding opens a drawer with evidence, affected tables, proposed correction, before/after impact, comments, owner, due date, and Resolve/Accept Risk/Dismiss controls.

==================================================
16. PROJECT SETTINGS AND TEAM
==================================================

Settings sections:
- Project Details
- Game Versions
- Team and Permissions
- Environments
- Default Assumptions
- AI Preferences
- Export Settings
- Integrations
- Notification Rules
- Audit Log
- Danger Zone

Roles:
- Organization Owner
- Project Admin
- Lead Designer
- Economy Designer
- Analyst
- Developer
- Reviewer
- Viewer

Create a permissions matrix and invitation flow. Add realistic change history and version comparison.

==================================================
17. CORE MODALS AND INTERACTIONS
==================================================

Build these reusable modals/drawers:
- Create Project
- Generate from Game Idea
- Import Existing Design
- Add/Edit System
- Add/Edit Currency
- Add/Edit Formula
- Add/Edit Progression Level
- Create Scenario
- Run Simulation
- Run Audit
- Review AI Recommendation
- Approve Change
- Compare Versions
- Generate Workbook
- Export Success
- Invite Team Member
- Delete Confirmation

Use inline validation and never discard a form without warning.

==================================================
18. REALISTIC DEMO DATA
==================================================

Seed the application with Haunted Hotel demo data.

Game concept:
- A hybrid-casual idle tycoon where the player restores and operates a haunted hotel
- Players unlock rooms, hire staff, serve supernatural guests, upgrade facilities, collect coins, and discover story content

Example systems:
- Reception
- Guest Rooms
- Restroom
- Utility Room
- Vending Machine
- Swimming Pool
- Ghost Hunter
- Staff Unlocks
- Daily Tasks
- Daily Completion Chest
- Offline Earnings
- Hotel Level
- Character Level
- Prestige/Rebirth
- Limited-Time Events

Example currencies/resources:
- Coins — soft currency
- Diamonds — hard currency
- Energy — session resource
- Prestige Essence — reset currency
- Event Tokens — temporary currency

Example progression:
- 50 levels
- Main unlocks at levels 2, 5, 10, 15, 20, 30, 40, and 50
- Create realistic upgrade costs, XP requirements, time-to-next values, and progression warnings

Example risk findings:
- Paywall Spike at level 27 bundle — High
- Midgame Content Gap around levels 18–22 — Medium
- Repeating daily reward pattern — Reward Fatigue, Medium
- Premium currency sink concentration in gacha spins — High fairness review

Use believable IDs such as SYS_RECEPTION_001, CUR_COIN, UPG_ROOM_001, REW_DAILY_007, and AUD_2026_014.

==================================================
19. EMPTY, LOADING, ERROR, AND SUCCESS STATES
==================================================

For every major module, create:
- Empty state with specific next action
- Loading skeleton
- Permission-denied state
- Offline/retry state
- Validation error state
- Successful action toast

Examples:
- No systems yet: “Build your first connected system.”
- No simulation: “Create a scenario to test progression and economy assumptions.”
- Workbook blocked: “Three probability pools do not total 100%.”
- Audit complete: “Audit finished: 2 critical, 4 high, 11 medium findings.”

==================================================
20. RESPONSIVE BEHAVIOR
==================================================

Desktop 1440px and above:
- Expanded sidebar
- Main dashboard grid
- Persistent AI panel

Laptop 1024–1439px:
- Collapsible sidebar
- Two-column card grids
- AI panel collapses into drawer

Tablet 768–1023px:
- Icon sidebar or top navigation drawer
- One/two-column cards
- Tables scroll horizontally
- Filters use slide-over panel

Mobile below 768px:
- Bottom or hamburger navigation
- Single-column cards
- AI as full-screen sheet
- Tables switch to card rows where practical
- Formula and graph editors show simplified views
- Preserve full function; do not hide critical actions

==================================================
21. COMPONENT LIBRARY PAGE
==================================================

Create an internal Design System route demonstrating:
- Color tokens
- Typography hierarchy
- Buttons
- Inputs
- Selects
- Toggles
- Sliders
- Tabs
- Chips
- Badges
- Tooltips
- Cards
- Tables
- Charts
- Modals
- Drawers
- Toasts
- Empty states
- Loading skeletons
- Risk severity states
- Approval states

This page ensures visual consistency throughout the product.

==================================================
22. FINAL QUALITY CHECKLIST
==================================================

Before considering the build complete, verify:
- The public website and authenticated application are both present
- All 11 main application navigation modules work
- The AI panel is interactive
- All charts use realistic data and labels
- All tables contain realistic rows and controls
- Every key action has feedback
- The Psychology section includes ethical safeguards
- Workbook Studio contains all 34 required sheets
- Generate Workbook has validation, progress, success, and history states
- Forecast and observed analytics are clearly separated
- The UI uses the specified five primary colors and five-font system
- Responsive layouts work at desktop, laptop, tablet, and mobile widths
- There is no lorem ipsum
- There are no dead buttons
- The result is polished enough to demonstrate to a game studio or development team

The final result should feel like a real premium SaaS product, not a concept board. Prioritize coherent navigation, believable data, reusable components, responsive behavior, and fully demonstrated user workflows.

Recommended Figma Make follow-up commands

After Figma Make completes the initial build, give these commands one at a time:

Functional audit: “Audit every route and interactive control. Fix dead buttons, missing states, overflow, inaccessible contrast, and inconsistent components without changing the approved visual system.”

Data-density audit: “Review all dashboards and tables at 1440px, 1024px, 768px, and 390px. Fix clipping and horizontal overflow while preserving all critical data.”

Workbook audit: “Verify that Workbook Studio includes all 34 sheets, sheet preview, formula bar, validations, readiness score, generation progress, success modal, and export history.”

Psychology audit: “Verify that Player Psychology contains all ten sub-tabs, uses ethical player-experience language, and flags manipulative monetization instead of recommending it.”

Polish pass: “Apply a final visual polish pass: consistent spacing, typography, borders, icon size, hover/focus/disabled states, chart legends, loading skeletons, and empty states. Do not remove features.”

