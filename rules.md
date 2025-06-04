# Development Rules & Guidelines

## Critical Workflow Rules

### 1. Implementation Protocol
- **NEVER implement without explicit user confirmation**
- When user points out issues, acknowledge and ask for permission before proceeding
- User may give feedback/corrections without wanting immediate implementation
- Always wait for clear "proceed" or "implement" instruction

### 2. Data Integrity (ABSOLUTE RULE)
- **ONLY use authentic CSV data** - never synthetic, mock, or placeholder data
- All calculations must reference actual CSV columns
- When metrics don't exist in CSV, remove them entirely instead of estimating

### 3. Regression Prevention
- Read existing code carefully before making changes
- Don't revert user-approved features unless explicitly requested
- Complete ALL requested changes, not partial implementations
- Test that changes work before presenting to user

### 4. Communication Standards
- No basketball analogies in UI text unless specifically requested
- Show exact weightings for each metric (e.g., "Entry Success: 40%, Trade Generation: 30%")
- Include CSV column references for transparency
- Be concise and professional

### 5. Code Quality
- Fix TypeScript errors completely
- Ensure UI renders without errors
- Match data structures between calculations and UI components
- Don't leave broken functionality

## Current Project Context
- Building CS2 PIV analytics using IEM Katowice 2025 CSV data
- Three frameworks: Current (flawed), Realistic (improved), Ideal (original user system)
- Role-specific weightings for Spacetaker/Rotator performance
- 20% baseline metrics (K/D, ADR, KAST) + 80% role performance

## Self-Check Before Any Action
1. Did user explicitly ask me to implement?
2. Am I using only authentic CSV data?
3. Are my weightings clearly documented?
4. Will this break existing functionality?
5. Have I completed ALL requested changes?