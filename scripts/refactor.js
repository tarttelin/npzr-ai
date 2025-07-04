#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${message} ===${colors.reset}\n`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question}${colors.reset} `, resolve);
  });
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

async function checkPrerequisites() {
  logHeader('Checking Prerequisites');
  
  // Check if we're in a git repository
  const gitCheck = execCommand('git rev-parse --is-inside-work-tree', { silent: true });
  if (!gitCheck.success) {
    logError('Not in a git repository. Please run this command from the project root.');
    process.exit(1);
  }
  logSuccess('Git repository detected');
  
  // Check if gh CLI is available
  const ghCheck = execCommand('gh --version', { silent: true });
  if (!ghCheck.success) {
    logError('GitHub CLI (gh) is required but not installed.');
    logInfo('Install it from: https://cli.github.com/');
    process.exit(1);
  }
  logSuccess('GitHub CLI available');
  
  // Check if we're authenticated with GitHub
  const authCheck = execCommand('gh auth status', { silent: true });
  if (!authCheck.success) {
    logError('Not authenticated with GitHub CLI.');
    logInfo('Run: gh auth login');
    process.exit(1);
  }
  logSuccess('GitHub CLI authenticated');
}

async function runTestsAndLinting() {
  logHeader('Running Tests and Linting');
  
  logInfo('Running all tests...');
  const testResult = execCommand('npm test');
  
  if (!testResult.success) {
    logError('Tests failed!');
    const continueAnyway = await askQuestion('Tests are failing. Do you want to continue with the refactor anyway? (y/N): ');
    if (continueAnyway.toLowerCase() !== 'y' && continueAnyway.toLowerCase() !== 'yes') {
      logInfo('Refactor cancelled. Please fix failing tests first.');
      process.exit(1);
    }
    logWarning('Continuing with failing tests...');
  } else {
    logSuccess('All tests passed');
  }
  
  logInfo('Running linting...');
  const lintResult = execCommand('npm run lint');
  
  if (!lintResult.success) {
    logError('Linting failed!');
    const continueAnyway = await askQuestion('Linting is failing. Do you want to continue with the refactor anyway? (y/N): ');
    if (continueAnyway.toLowerCase() !== 'y' && continueAnyway.toLowerCase() !== 'yes') {
      logInfo('Refactor cancelled. Please fix linting issues first.');
      process.exit(1);
    }
    logWarning('Continuing with linting issues...');
  } else {
    logSuccess('Linting passed');
  }
}

function getCurrentBranch() {
  const result = execCommand('git branch --show-current', { silent: true });
  return result.success ? result.output.trim() : 'main';
}

function sanitizeBranchName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function createBranchAndIssue(refactorArea) {
  logHeader('Creating Branch and GitHub Issue');
  
  const currentBranch = getCurrentBranch();
  logInfo(`Current branch: ${currentBranch}`);
  
  // Create branch name
  const branchSuffix = sanitizeBranchName(refactorArea);
  const branchName = `refactor/${branchSuffix}`;
  
  logInfo(`Creating branch: ${branchName}`);
  
  // Ensure we're on the latest main branch
  logInfo('Switching to main branch and pulling latest changes...');
  execCommand('git checkout main');
  execCommand('git pull origin main');
  
  // Create and switch to new branch
  const branchResult = execCommand(`git checkout -b ${branchName}`);
  if (!branchResult.success) {
    logError(`Failed to create branch: ${branchName}`);
    process.exit(1);
  }
  logSuccess(`Created and switched to branch: ${branchName}`);
  
  // Create GitHub issue
  logInfo('Creating GitHub issue...');
  
  const issueTitle = `Refactor: ${refactorArea}`;
  const issueBody = `## Refactor Scope
${refactorArea}

## Refactoring Guidelines

### Approach
- **No backward compatibility** - Break changes are acceptable for cleaner architecture
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

**Branch:** \`${branchName}\`
**Created by:** Refactor automation script

> This refactor does not maintain backward compatibility. Breaking changes are expected and acceptable.`;

  const issueResult = execCommand(`gh issue create --title "${issueTitle}" --body "${issueBody}" --label "refactor,breaking-change"`, { silent: true });
  
  if (!issueResult.success) {
    logError('Failed to create GitHub issue');
    logError(issueResult.error);
    process.exit(1);
  }
  
  const issueUrl = issueResult.output.trim();
  logSuccess(`GitHub issue created: ${issueUrl}`);
  
  return { branchName, issueUrl };
}

function displayRefactorGuidelines() {
  logHeader('Refactoring Guidelines');
  
  log('📋 Key Principles:', 'bold');
  log('  • No backward compatibility required - make breaking changes for better design');
  log('  • Test-driven refactoring - maintain or improve test coverage');
  log('  • Incremental commits - make logical, reviewable changes');
  log('  • Update documentation as you go');
  log('  • Performance considerations for user-facing changes');
  
  log('\n🔄 Workflow:', 'bold');
  log('  1. Analyze current implementation');
  log('  2. Design improved architecture');
  log('  3. Implement in small, logical steps');
  log('  4. Test after each significant change');
  log('  5. Update documentation');
  log('  6. Final validation (tests + linting)');
  
  log('\n🚀 When Complete:', 'bold');
  log('  • Run: npm test (ensure all tests pass)');
  log('  • Run: npm run lint (ensure code quality)');
  log('  • Run: npm run typecheck (ensure TypeScript compliance)');
  log('  • Commit final changes');
  log('  • Push branch and create pull request');
  log('  • Reference the GitHub issue in your PR');
}

async function main() {
  try {
    // Get refactor area from command line argument
    const refactorArea = process.argv[2];
    
    if (!refactorArea) {
      logError('Please specify what area of the codebase to refactor');
      logInfo('Usage: npm run refactor "area description"');
      logInfo('Example: npm run refactor "game state management in core package"');
      process.exit(1);
    }
    
    log(`\n${colors.bold}${colors.magenta}🔧 NPZR Refactor Tool${colors.reset}`, 'bold');
    log(`Refactoring: ${colors.cyan}${refactorArea}${colors.reset}\n`);
    
    // Run all checks
    await checkPrerequisites();
    await runTestsAndLinting();
    
    const { branchName, issueUrl } = await createBranchAndIssue(refactorArea);
    
    displayRefactorGuidelines();
    
    logHeader('Ready to Start Refactoring');
    logSuccess(`Branch: ${branchName}`);
    logSuccess(`Issue: ${issueUrl}`);
    logSuccess('You can now start implementing your refactoring!');
    
    log(`\n${colors.bold}Happy refactoring! 🎯${colors.reset}`);
    
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\nRefactor setup cancelled by user', 'yellow');
  rl.close();
  process.exit(0);
});

main();