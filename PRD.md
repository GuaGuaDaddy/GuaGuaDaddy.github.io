# Product Requirements Document (PRD)
## Interactive English Grammar Learning Application Based on Mind Map

### 1. Core Positioning of the Application
The application takes the mind map as the global navigation and learning framework, realizing a closed-loop learning process of **knowledge point visualization - node interactive learning - instant practice consolidation - associated expansion - weak point positioning**. It addresses the pain points of fragmented learning and logical disconnect in traditional grammar learning, and is suitable for English learners at all stages from zero foundation to advanced level.

### 2. Core Function Design (Fully Matched with Mind Map Structure)
#### 2.1 Mind Map Core Navigation Module (Application Main Interface)
| Function | Development Key Points |
|----------|------------------------|
| Basic Rendering | Support zooming, dragging, folding/unfolding of mind map nodes. By default, display core themes + first-level branches, with progressive expansion in line with learning paths. |
| Node Marking | Mark learned nodes, highlight key/difficult nodes, mark error-prone nodes in red. Support user-defined collection/marking of nodes. |
| Quick Positioning | Global search function: input grammar keywords to directly jump to corresponding mind map nodes; support learning progress backtracking. |
| Multi-terminal Adaptation | PC terminal: support split-screen display (mind map + detail panel); Mobile terminal: support vertical screen sliding up and down, with detail panel popping up from the bottom. |

#### 2.2 Node Interactive Learning Module (Core Function, Triggered by Clicking Any Node)
Each mind map node corresponds to a set of standardized learning content. Clicking a node will pop up a sidebar/detail page with the following fixed modules (directly compatible with programming tools for structured rendering):
- **Core Definition**: Concise bilingual (Chinese/English) explanations, adapted for learners with different foundations.
- **Rule Details**: Structured sorting of core rules with formulaic expressions (e.g., Present Perfect Tense structure: Subject + have/has + Past Participle).
- **Example Demonstration**: Includes basic examples, advanced examples, and error-correction comparison examples. Support click-to-play pronunciation and highlight corresponding grammar points in sentences.
- **Error Warning**: Summarize high-frequency mistakes with wrong examples + correction plans + error reasons.
- **Associated Jump**: One-click jump to related knowledge point nodes (e.g., Attributive Clause → Relative Pronoun → Pronoun Morphology Module) to connect the entire grammar system.

#### 2.3 Practice and Assessment Closed-loop Module
- **Node-specific Practice**: Each knowledge point node is matched with 3-5 targeted exercises (multiple choice, fill-in-the-blank, sentence rewriting, error correction) with instant grading. Wrong answers are automatically associated with corresponding knowledge point nodes.
- **Stage-specific Assessment**: Unit tests are set up according to the first-level branches of the mind map (e.g., Morphology Basics Test, Tense Special Test). Generate assessment reports to locate weak knowledge points, with one-click jump to corresponding mind map nodes for review.
- **Wrong Answer Book System**: Classify wrong answers by mind map knowledge points, support redoing exercises, viewing answer explanations, and batch review.

#### 2.4 Auxiliary Learning Functions
- **Custom Notes**: Add learning notes to any node with synchronous saving.
- **Learning Plan**: Generate daily learning plans and check-in functions based on the hierarchical path of the mind map.
- **Custom Mind Map**: Allow users to clip and generate exclusive grammar review mind maps based on their own weak points.

### 3. Technology Stack Selection
| Solution Type | Technology Stack | Advantages |
|---------------|------------------|------------|
| Lightweight Solution | Pure HTML + CSS + JS | No complex frameworks required; use LocalStorage to store user local data; MVP launch without backend support. |
