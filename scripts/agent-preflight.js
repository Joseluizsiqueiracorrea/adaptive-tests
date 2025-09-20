#!/usr/bin/env node

/**
 * Agent Preflight Check
 * 
 * Enforces the multi-agent safety contract before broad edits.
 * Catches untracked directories and risky deletes early.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', cwd: process.cwd() });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function checkGitStatus() {
  console.log('🔍 Checking git status...');
  
  const status = runCommand('git status --porcelain');
  const lines = status.trim().split('\n').filter(line => line.trim());
  
  const untracked = lines.filter(line => line.startsWith('??'));
  const deleted = lines.filter(line => line.startsWith(' D') || line.startsWith('D '));
  
  if (untracked.length > 0) {
    console.log('\n⚠️  UNTRACKED FILES DETECTED:');
    untracked.forEach(line => {
      const file = line.substring(3);
      console.log(`   ${file}`);
    });
    console.log('\n❌ SAFETY VIOLATION: Do not touch untracked files without approval.');
    console.log('   These may be work-in-progress from other agents or contributors.');
    console.log('   Escalate to a human maintainer before proceeding.');
    process.exit(1);
  }
  
  if (deleted.length > 0) {
    console.log('\n⚠️  DELETED FILES DETECTED:');
    deleted.forEach(line => {
      const file = line.substring(3);
      console.log(`   ${file}`);
    });
    console.log('\n⚠️  WARNING: Files have been deleted. Ensure this is intentional.');
    console.log('   Review the multi-agent collaboration contract in AGENTS.md');
  }
  
  console.log('✅ Git status check passed');
}

function checkCriticalFiles() {
  console.log('🔍 Checking critical files...');
  
  const criticalFiles = [
    'package.json',
    'AGENTS.md',
    'README.md',
    'languages/javascript/src/discovery-engine.js',
    'languages/javascript/src/scoring-engine.js'
  ];
  
  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      console.log(`❌ CRITICAL FILE MISSING: ${file}`);
      process.exit(1);
    }
  }
  
  console.log('✅ Critical files check passed');
}

function checkValidationResults() {
  console.log('🔍 Checking validation results...');
  
  if (fs.existsSync('validation-results.json')) {
    const results = JSON.parse(fs.readFileSync('validation-results.json', 'utf8'));
    const successRate = results.successRate || 0;
    
    console.log(`📊 Current validation success rate: ${successRate}%`);
    
    if (successRate < 75) {
      console.log('⚠️  WARNING: Validation success rate is below 75%');
      console.log('   Consider running npm run validate before making changes');
    }
  } else {
    console.log('ℹ️  No validation results found (validation-results.json missing)');
  }
  
  console.log('✅ Validation check completed');
}

function checkTemplateStructure() {
  console.log('🔍 Checking template structure...');
  
  const languageDirs = ['javascript', 'python', 'java', 'typescript'];
  let templatesFound = 0;
  
  for (const lang of languageDirs) {
    const templateDir = path.join('languages', lang, 'templates');
    if (fs.existsSync(templateDir)) {
      const templates = fs.readdirSync(templateDir);
      templatesFound += templates.length;
      console.log(`   ${lang}: ${templates.length} templates`);
    } else {
      console.log(`   ${lang}: no templates directory`);
    }
  }
  
  console.log(`📁 Total templates found: ${templatesFound}`);
  console.log('✅ Template structure check completed');
}

function main() {
  console.log('🚀 Running Agent Preflight Check...\n');
  
  try {
    checkGitStatus();
    checkCriticalFiles();
    checkValidationResults();
    checkTemplateStructure();
    
    console.log('\n✅ ALL PREFLIGHT CHECKS PASSED');
    console.log('🟢 Safe to proceed with edits');
    
  } catch (error) {
    console.error('\n❌ PREFLIGHT CHECK FAILED');
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };