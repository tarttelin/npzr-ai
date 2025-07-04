# Refactor Command

Guides the refactoring of a specific area of the codebase with proper branching, issue creation, and validation workflow.

## Usage

```
/refactor [area description]
```

**Example:**
```
/refactor game state management in core package
/refactor canvas entity system architecture  
/refactor AI decision-making algorithms
```

## Workflow

### 1. Prerequisites Check
- ✅ Verify we're in a git repository
- ✅ Check GitHub CLI (gh) is installed and authenticated
- ✅ Confirm we're in the NPZR project root

### 2. Pre-Refactor Validation
- Review the [area description]. Is it clear what the refactoring request is? If there is ambiguity, ask one question at a time of the user until the request is properly understood. Use the responses to create an updated [area description] and ask the user if it is correct or if the user wants to stop.
- 🔄 Check all changes are committed in git (`git status`)
- Check the current branch is `main`
- 🧪 **Run all tests** (`npm test`)
- 🔍 **Run linting** (`npm run lint`)
- ❓ **If tests/linting fail:** Ask user if they want to continue anyway

### 3. Branch Management
- 🔄 Switch to `main` branch
- 📥 Pull latest changes (`git pull origin main`)
- 🌿 Create new branch: `refactor/[sanitized-area-description]`
- 🔀 Switch to new refactor branch

### 4. GitHub Issue Creation
Create a GitHub issue with:
- **Title:** `Refactor: [area description]`
- **Labels:** `refactor`
- **Body Template:**
  ```markdown
  ## Refactor Scope
  [area description]
  
  ## Refactoring Guidelines
  
  ### Approach
  - **No backward compatibility** - The application is not live, so breaking changes are acceptable for cleaner architecture
  - **Test-driven** - Maintain or improve test coverage throughout refactoring
  - **Documentation** - Update relevant documentation and comments
  - **Incremental commits** - Make logical, atomic commits for easier review
  
  ### Checklist
  - [ ] Analyze current implementation and identify improvement opportunities
  - [ ] Design new architecture/structure if needed
  - [ ] Implement refactoring in logical steps
  - [ ] Update or add tests to cover refactored code
  - [ ] Update documentation and comments
  - [ ] Run full test suite and linting
  - [ ] Update any affected integration points
  - [ ] Performance test if applicable
  
  ### Definition of Done
  - [ ] All tests passing
  - [ ] Linting clean
  - [ ] Code review completed
  - [ ] Documentation updated
  - [ ] No backward compatibility concerns addressed
  
  ---
  
  **Branch:** `refactor/[branch-name]`
  **Created by:** Refactor automation
  
  > This refactor does not maintain backward compatibility. Breaking changes are expected and acceptable.
  ```

### 5. Refactoring Guidelines Display
Show the user:

#### 📋 Key Principles
- **No backward compatibility required** - make breaking changes for better design
- **Test-driven refactoring** - maintain or improve test coverage
- **Incremental commits** - make logical, reviewable changes
- **Update documentation** as you go
- **Performance considerations** for user-facing changes

#### 🔄 Recommended Workflow
1. **Analyze** current implementation
2. **Design** improved architecture
3. **Implement** in small, logical steps
4. **Test** after each significant change
5. **Update** documentation
6. **Final validation** (tests + linting)

#### 🚀 Completion Steps
- Run: `npm test` (ensure all tests pass)
- Run: `npm run lint` (ensure code quality)
- Run: `npm run typecheck` (ensure TypeScript compliance)
- Commit final changes
- Push branch: `git push -u origin refactor/[branch-name]`
- Create pull request referencing the GitHub issue
- Use `/pr` command to create PR if available

## Branch Naming Convention

Branches are automatically named as: `refactor/[sanitized-description]`

**Sanitization rules:**
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters
- Remove leading/trailing hyphens

**Examples:**
- "game state management" → `refactor/game-state-management`
- "Canvas Entity System Architecture!" → `refactor/canvas-entity-system-architecture`
- "AI Decision-Making (Core Logic)" → `refactor/ai-decision-making-core-logic`

## Breaking Changes Policy

**This command explicitly supports breaking changes:**
- ❌ No backward compatibility maintained
- ✅ Breaking changes are encouraged for cleaner architecture
- ✅ Focus on improving code quality and maintainability
- ✅ Update dependent code as needed

## Error Handling

### Test Failures
If tests fail during pre-validation:
- Display failing test output
- Ask: "Tests are failing. Do you want to continue with the refactor anyway? (y/N)"
- If user chooses 'N': Exit with message to fix tests first
- If user chooses 'Y': Continue with warning

### Linting Failures
If linting fails during pre-validation:
- Display linting errors
- Ask: "Linting is failing. Do you want to continue with the refactor anyway? (y/N)"
- If user chooses 'N': Exit with message to fix linting first
- If user chooses 'Y': Continue with warning

### Missing Prerequisites
- **No git repo:** Exit with error message
- **No GitHub CLI:** Exit with installation instructions
- **Not authenticated:** Exit with `gh auth login` instruction

## Example Session

```
/refactor canvas entity system architecture

🔧 NPZR Refactor Tool
Refactoring: canvas entity system architecture

=== Checking Prerequisites ===
✅ Git repository detected
✅ GitHub CLI available
✅ GitHub CLI authenticated

=== Running Tests and Linting ===
ℹ️  Running all tests...
✅ All tests passed
ℹ️  Running linting...
✅ Linting passed

=== Creating Branch and GitHub Issue ===
ℹ️  Current branch: main
ℹ️  Switching to main branch and pulling latest changes...
ℹ️  Creating branch: refactor/canvas-entity-system-architecture
✅ Created and switched to branch: refactor/canvas-entity-system-architecture
ℹ️  Creating GitHub issue...
✅ GitHub issue created: https://github.com/user/npzr-ai/issues/123

=== Refactoring Guidelines ===
📋 Key Principles:
  • No backward compatibility required - make breaking changes for better design
  • Test-driven refactoring - maintain or improve test coverage
  [...]

=== Ready to Start Refactoring ===
✅ Branch: refactor/canvas-entity-system-architecture
✅ Issue: https://github.com/user/npzr-ai/issues/123
✅ You can now start implementing your refactoring!

Happy refactoring! 🎯
```