# MODAUI Agent Engineering Rules & Directive Matrix (Project Onboarding For Subsequent AI Agents)

Hello successor Agent! You have been deployed to build, refine, or debug **MODAUI** (AI-Powered Corp Operations System). 
This project has already departed from traditional static web shops and has been transformed into a comprehensive **AI Corporation Operations Suite**. To guarantee consecutive project integrity, prevent redundant component creations, and adhere to strict USER DESIGN INTENSE, you **MUST** read and memorize these architectural rules before changing any line of code.

---

## 🎯 Project Scope & User Design Philosophy
**MODAUI does NOT just generate web stores. It lets user build a complete automated company.**
The user flow is: Select Industry -> Register -> Select Operations Mode -> Spawn 6-agent AI Taskforce -> Gain automated Merchant Admin -> Gain active Customer Storefront -> AI runs the business hands-free.

---

## 📂 Active Modular File Structure (DO NOT duplicate components!)
The codebase is separated into cleanly decoupled, highly functional components inside `/src/components/` and the main `/src/` entry. Review this map before creating anything new:

1. **`src/App.tsx` (Home Portal & Creation Wizard)**
   - Includes the core website homepage, dynamic particle banners, industry cards, user login triggers, and the **5-step Creation Wizard UI** (Choice -> Credentials -> Operating Plan -> Provisioning Ritual -> Redirection).
   - *Modification Guideline*: Only edit this file to alter onboarding screens or connect authorization models.

2. **`src/components/CustomerStorefrontPreview.tsx` (Active E-Commerce Storefront)**
   - Houses the beautiful interactive public shop screen contextually themed for each of the **6 core industries** (Jewelry = Gold luxury; Fashion = Slate modern; Catering = Clean vibrant; Beauty = Elegance rose; Fitness = Athletic indigo; Home = Soft wood aesthetic).
   - Includes real-time catalog switching, SPU quick search, product specification card, cart adding/removing drawer calculations, and the **24-hour AI support chat popover** connected to simulated knowledge systems.
   - *Modification Guideline*: Look here to expand buyer functionalities (e.g., membership points, real-time checkout payloads).

3. **`src/components/MerchantDashboard.tsx` (Merchant Operation Control Room)**
   - A robust, multi-panel administration dashboard for the business owner.
   - Includes business telemetry (daily tokens consumption, simulated revenue curves), the **AI Team Commander panel** (where owners fine-tune the prompts of their 6 custom digital employees), SPU database, Order dispatch tracking with **SF Express air cargo contracts and claim handlers**, CRM VIP loyalty metrics, automate promotional Campaign launchers, and complex multivariant ROI billing accounting.
   - *Modification Guideline*: Look here to tune actual store-owner metrics and API proxy calls.

4. **`src/components/AITeamsView.tsx` (36-Specialist AI Division Database)**
   - Holds the structural database and rosters of the digital employees of MODAUI across the **6 target industries**: Clothing (时尚服装), Catering (餐饮外卖), Goods (跨境百货), Beauty (美业沙龙), Fitness (运动健身), Jewelry (高定珠宝), and Furniture (家居生活).
   - Each team features exactly **6 specialized employees** (Designer/Consultant, Scurry/Purchase Manager, Operations Manager, Marketing Manager, Comptroller/Financial Lead, Customer Success Lead).
   - *Modification Guideline*: To adjust digital employee characteristics, prompts, token weights, or skills configurations, edit this file exclusively.

5. **`src/components/UnifiedArchitectureBridge.tsx` (AI Runlayer & Knowledge Base Visualizer)**
   - Renders the digital twin dashboard illustrating the automatic DAG workflow execution path, real-time prompt templating stacks, vector knowledge bases, simulated Tool call hooks (SF API, Stripe billing), and active short-term/long-term memory matrices.
   - *Modification Guideline*: Edit this when implementing high-fidelity AI execution path visualization.

6. **`src/components/PlatformAdminView.tsx` (SaaS Global Central Administration)**
   - Represents the platform provider console (the super-SaaS administrator) responsible for checking host metrics, locking accounts, adjusting subscription plans, and displaying the **💻 Completeness Matrix & Developer Board**.
   - *Modification Guideline*: Check the interactive matrix in this tab for current integration targets.

---

## 🛑 Strict Engineering Directives
1. **Never Revert to Single-File Giant Layouts**: Keep code strictly modularized within these specific file bounds.
2. **Icons Consistency**: Import all vector icons directly from `lucide-react`. DO NOT write manual raw SVGs.
3. **Animations**: Use pure `motion` transitions (imported from `motion/react`) for cards and layouts to maintain the premium fluid technological texture.
4. **No Arbitrary CSS Files**: Rely exclusively on Tailwind CSS utility classes. Custom themes are configured via theme grids.
5. **No Key Leakage**: If introducing cloud services (such as Supabase, Firestore, or Gemini model connections), keep secret identifiers server-side. Never expose raw API keys directly to the client browser.
6. **Double Check with Compiler**: Absolutely compile and lint the workspace (`compile_applet` & `lint_applet` tools) before resolving your task.
