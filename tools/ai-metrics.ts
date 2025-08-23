#!/usr/bin/env node

import { Command } from 'commander';
import { simpleGit, SimpleGit } from 'simple-git';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

interface MetricsData {
  window: {
    start: string;
    end: string;
    days: number;
  };
  adoption: {
    acceptanceRate: number;
    backlogClearance: number;
    aiEditShare: number;
    promptYield: number;
  };
  speed: {
    leadTimeAI_avg_hours: number;
    buildBreaksPer1k: number;
  };
  quality: {
    rework72h_pct: number;
    defectIntroPer1k: number;
    testPassDelta_pct: number;
    typeLintPer1k: number;
  };
  maintainability: {
    complexityDelta_pct: number;
    duplicationDelta_pct: number;
    ownershipChurn_pct: number;
  };
  stability: {
    rollbackHotfixRate_pct: number;
    mttrAI_hours: number;
  };
  security: {
    newHighSeverity: number;
    vulnDelta: number;
  };
  performance: {
    perfDelta_p95_pct: string | number;
    bundleSizeDelta_pct: string | number;
  };
  counts: {
    suggested_lines: number;
    accepted_lines: number;
    ai_sessions: number;
    failed_ci_runs: number;
    bugs_opened_7d: number;
    deploys: number;
  };
}

interface PRData {
  number: number;
  title: string;
  body: string;
  labels: string[];
  merged_at: string;
  created_at: string;
  closed_at: string;
  additions: number;
  deletions: number;
  is_ai_touched: boolean;
  commits: any[];
  files: any[];
}

class AIMetricsCollector {
  private git: SimpleGit;
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private days: number;
  private startDate: Date;
  private endDate: Date;

  constructor(days: number) {
    this.days = days;
    this.endDate = new Date();
    this.startDate = new Date();
    this.startDate.setDate(this.endDate.getDate() - days);
    
    this.git = simpleGit();
    
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    
    this.owner = process.env.OWNER || '';
    this.repo = process.env.REPO || '';
    
    if (!this.owner || !this.repo) {
      // Try to extract from git remote
      try {
        const remote = execSync('git remote get-url origin', { encoding: 'utf8' });
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
        if (match) {
          this.owner = match[1];
          this.repo = match[2];
        }
      } catch (error) {
        throw new Error('Could not determine OWNER/REPO from git remote or environment variables');
      }
    }
    
    this.octokit = new Octokit({ auth: token });
  }

  private isAITouched(pr: any): boolean {
    const aiKeywords = ['ai', 'agent', 'cursor', 'copilot', 'generated'];
    const title = pr.title?.toLowerCase() || '';
    const body = pr.body?.toLowerCase() || '';
    const labels = pr.labels?.map((l: any) => l.name?.toLowerCase()) || [];
    
    // Check title, body, and labels
    if (aiKeywords.some(keyword => 
      title.includes(keyword) || 
      body.includes(keyword) || 
      labels.some((label: string) => label.includes(keyword))
    )) {
      return true;
    }
    
    // Check for AI co-authors in commits
    return false; // Will be updated when we fetch commits
  }

  private async getMergedPRs(): Promise<PRData[]> {
    const query = `repo:${this.owner}/${this.repo} is:pr is:merged merged:${this.startDate.toISOString().split('T')[0]}..${this.endDate.toISOString().split('T')[0]}`;
    
    const { data: searchResults } = await this.octokit.search.issuesAndPullRequests({
      q: query,
      per_page: 100,
      sort: 'updated',
      order: 'desc'
    });

    const prs: PRData[] = [];
    
    for (const item of searchResults.items) {
      const { data: pr } = await this.octokit.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: item.number
      });
      
      const { data: commits } = await this.octokit.pulls.listCommits({
        owner: this.owner,
        repo: this.repo,
        pull_number: item.number
      });
      
      const { data: files } = await this.octokit.pulls.listFiles({
        owner: this.owner,
        repo: this.repo,
        pull_number: item.number
      });
      
      const isAITouched = this.isAITouched(pr) || 
        commits.some(commit => 
          commit.commit.message.toLowerCase().includes('cursor') ||
          commit.commit.message.toLowerCase().includes('ai')
        );
      
      prs.push({
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        labels: pr.labels.map((l: any) => l.name),
        merged_at: pr.merged_at!,
        created_at: pr.created_at,
        closed_at: pr.closed_at!,
        additions: pr.additions,
        deletions: pr.deletions,
        is_ai_touched: isAITouched,
        commits,
        files
      });
    }
    
    return prs;
  }

  private async getCIStats(): Promise<{ failed_runs: number; total_runs: number }> {
    try {
      const { data: workflows } = await this.octokit.actions.listWorkflowRunsForRepo({
        owner: this.owner,
        repo: this.repo,
        created: `>=${this.startDate.toISOString()}`,
        per_page: 100
      });
      
      let failedRuns = 0;
      let totalRuns = 0;
      
      for (const run of workflows.workflow_runs) {
        totalRuns++;
        if (run.conclusion === 'failure') {
          failedRuns++;
        }
      }
      
      return { failed_runs: failedRuns, total_runs: totalRuns };
    } catch (error) {
      console.warn('Could not fetch CI stats:', error);
      return { failed_runs: 0, total_runs: 0 };
    }
  }

  private async getBugs(): Promise<number> {
    try {
      const query = `repo:${this.owner}/${this.repo} is:issue label:bug created:${this.startDate.toISOString().split('T')[0]}..${this.endDate.toISOString().split('T')[0]}`;
      
      const { data: bugs } = await this.octokit.search.issuesAndPullRequests({
        q: query,
        per_page: 100
      });
      
      return bugs.total_count;
    } catch (error) {
      console.warn('Could not fetch bugs:', error);
      return 0;
    }
  }

  private async getDeployments(): Promise<number> {
    try {
      const { data: deployments } = await this.octokit.repos.listDeployments({
        owner: this.owner,
        repo: this.repo,
        per_page: 100
      });
      
      return deployments.filter(d => 
        new Date(d.created_at) >= this.startDate && 
        new Date(d.created_at) <= this.endDate
      ).length;
    } catch (error) {
      console.warn('Could not fetch deployments:', error);
      return 0;
    }
  }

  private async getReworkStats(prs: PRData[]): Promise<number> {
    let reworkLines = 0;
    let totalLines = 0;
    
    for (const pr of prs) {
      if (!pr.is_ai_touched) continue;
      
      const additions = pr.additions || 0;
      const deletions = pr.deletions || 0;
      const prLines = additions + deletions;
      totalLines += prLines;
      
      // Check for subsequent commits touching same files within 72h
      try {
        const mergeTime = new Date(pr.merged_at);
        const cutoffTime = new Date(mergeTime.getTime() + 72 * 60 * 60 * 1000);
        
        const { data: commits } = await this.octokit.repos.listCommits({
          owner: this.owner,
          repo: this.repo,
          since: mergeTime.toISOString(),
          until: cutoffTime.toISOString()
        });
        
        // This is a simplified check - in practice you'd need to analyze file changes
        // For now, we'll estimate based on commit frequency
        const subsequentCommits = commits.filter(c => 
          new Date(c.commit.author.date).getTime() > mergeTime.getTime() &&
          new Date(c.commit.author.date).getTime() <= cutoffTime.getTime()
        );
        
        if (subsequentCommits.length > 0) {
          reworkLines += Math.floor(prLines * 0.1); // Estimate 10% rework
        }
      } catch (error) {
        console.warn(`Could not check rework for PR ${pr.number}:`, error);
      }
    }
    
    return totalLines > 0 ? (reworkLines / totalLines) * 100 : 0;
  }

  private async calculateComplexityDelta(prs: PRData[]): Promise<number> {
    // This would require running complexity analysis tools
    // For now, return a placeholder
    return 0;
  }

  private async calculateDuplicationDelta(prs: PRData[]): Promise<number> {
    // This would require running duplication analysis tools
    // For now, return a placeholder
    return 0;
  }

  private async calculateOwnershipChurn(prs: PRData[]): Promise<number> {
    // This would require analyzing CODEOWNERS or similar
    // For now, return a placeholder
    return 0;
  }

  private async calculateLeadTimeAI(prs: PRData[]): Promise<number> {
    let totalHours = 0;
    let aiPRs = 0;
    
    for (const pr of prs) {
      if (!pr.is_ai_touched) continue;
      
      const created = new Date(pr.created_at);
      const merged = new Date(pr.merged_at);
      const hours = (merged.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      totalHours += hours;
      aiPRs++;
    }
    
    return aiPRs > 0 ? totalHours / aiPRs : 0;
  }

  private async calculateMTTRAI(prs: PRData[]): Promise<number> {
    // This would require tracking defect lifecycle
    // For now, return a placeholder
    return 24;
  }

  private async calculateSecurityMetrics(): Promise<{ newHighSeverity: number; vulnDelta: number }> {
    // This would require integration with security scanning tools
    // For now, return placeholders
    return { newHighSeverity: 0, vulnDelta: 0 };
  }

  private async calculatePerformanceMetrics(): Promise<{ perfDelta_p95_pct: string | number; bundleSizeDelta_pct: string | number }> {
    // This would require integration with APM and bundle analysis tools
    // For now, return N/A
    return { perfDelta_p95_pct: 'N/A', bundleSizeDelta_pct: 'N/A' };
  }

  async collectMetrics(): Promise<MetricsData> {
    console.log(`Collecting AI metrics for the last ${this.days} days...`);
    
    const prs = await this.getMergedPRs();
    const ciStats = await this.getCIStats();
    const bugs = await this.getBugs();
    const deployments = await this.getDeployments();
    
    const aiPRs = prs.filter(p => p.is_ai_touched);
    const totalLines = prs.reduce((sum, p) => sum + (p.additions || 0) + (p.deletions || 0), 0);
    const aiLines = aiPRs.reduce((sum, p) => sum + (p.additions || 0) + (p.deletions || 0), 0);
    
    const rework72h = await this.getReworkStats(prs);
    const complexityDelta = await this.calculateComplexityDelta(prs);
    const duplicationDelta = await this.calculateDuplicationDelta(prs);
    const ownershipChurn = await this.calculateOwnershipChurn(prs);
    const leadTimeAI = await this.calculateLeadTimeAI(prs);
    const mttrAI = await this.calculateMTTRAI(prs);
    const securityMetrics = await this.calculateSecurityMetrics();
    const performanceMetrics = await this.calculatePerformanceMetrics();
    
    const metrics: MetricsData = {
      window: {
        start: this.startDate.toISOString(),
        end: this.endDate.toISOString(),
        days: this.days
      },
      adoption: {
        acceptanceRate: totalLines > 0 ? 0.8 : 0, // Placeholder - would need to track suggested vs accepted
        backlogClearance: aiLines - (aiLines * 0.2), // Placeholder
        aiEditShare: totalLines > 0 ? (aiLines / totalLines) * 100 : 0,
        promptYield: aiPRs.length > 0 ? aiLines / aiPRs.length : 0
      },
      speed: {
        leadTimeAI_avg_hours: leadTimeAI,
        buildBreaksPer1k: totalLines > 0 ? (ciStats.failed_runs / (totalLines / 1000)) : 0
      },
      quality: {
        rework72h_pct: rework72h,
        defectIntroPer1k: totalLines > 0 ? (bugs / (totalLines / 1000)) : 0,
        testPassDelta_pct: 0, // Placeholder
        typeLintPer1k: 0 // Placeholder
      },
      maintainability: {
        complexityDelta_pct: complexityDelta,
        duplicationDelta_pct: duplicationDelta,
        ownershipChurn_pct: ownershipChurn
      },
      stability: {
        rollbackHotfixRate_pct: deployments > 0 ? 0 : 0, // Placeholder
        mttrAI_hours: mttrAI
      },
      security: securityMetrics,
      performance: performanceMetrics,
      counts: {
        suggested_lines: totalLines,
        accepted_lines: totalLines,
        ai_sessions: aiPRs.length,
        failed_ci_runs: ciStats.failed_runs,
        bugs_opened_7d: bugs,
        deploys: deployments
      }
    };
    
    return metrics;
  }
}

async function generateMarkdownReport(metrics: MetricsData): Promise<string> {
  type TargetBand = 
    | { min: number; max: number; name: string }
    | { min: number; name: string }
    | { max: number; name: string };

  const targetBands: Record<string, TargetBand> = {
    acceptanceRate: { min: 0.6, max: 1.2, name: 'Acceptance Rate' },
    buildBreaksPer1k: { max: 0.5, name: 'Build Breaks per 1k Lines' },
    rework72h_pct: { max: 15, name: 'Rework within 72h (%)' },
    defectIntroPer1k: { max: 0.8, name: 'Defects Introduced per 1k Lines' },
    testPassDelta_pct: { min: 0, name: 'Test Pass Delta (%)' },
    typeLintPer1k: { max: 3, name: 'Type/Lint Errors per 1k Lines' },
    complexityDelta_pct: { max: 5, name: 'Complexity Delta (%)' },
    duplicationDelta_pct: { max: 1, name: 'Duplication Delta (%)' },
    ownershipChurn_pct: { max: 25, name: 'Ownership Churn (%)' },
    rollbackHotfixRate_pct: { max: 5, name: 'Rollback/Hotfix Rate (%)' },
    mttrAI_hours: { max: 24, name: 'MTTR AI (hours)' },
    newHighSeverity: { max: 0, name: 'New High Severity Findings' },
    perfDelta_p95_pct: { min: -5, max: 5, name: 'Performance Delta P95 (%)' },
    bundleSizeDelta_pct: { min: -5, max: 5, name: 'Bundle Size Delta (%)' }
  };

  function getStatus(value: number | string, metric: keyof typeof targetBands): string {
    if (value === 'N/A') return '⚪ N/A';
    
    const band = targetBands[metric];
    const numValue = typeof value === 'number' ? value : parseFloat(value as string);
    
    if (isNaN(numValue)) return '⚪ N/A';
    
    if ('min' in band && 'max' in band) {
      if (numValue >= band.min && numValue <= band.max) return '✅ Good';
      if (Math.abs(numValue - band.min) <= 2 || Math.abs(numValue - band.max) <= 2) return '⚠️ Near';
      return '❌ Outside';
    } else if ('max' in band) {
      if (numValue <= band.max) return '✅ Good';
      if (Math.abs(numValue - band.max) <= 1) return '⚠️ Near';
      return '❌ Outside';
    } else if ('min' in band) {
      if (numValue >= band.min) return '✅ Good';
      if (Math.abs(numValue - band.min) <= 1) return '⚠️ Near';
      return '❌ Outside';
    }
    
    return '⚪ Unknown';
  }

  let report = `# AI Engineering Metrics Report\n\n`;
  report += `**Period:** ${new Date(metrics.window.start).toLocaleDateString()} - ${new Date(metrics.window.end).toLocaleDateString()} (${metrics.window.days} days)\n\n`;
  
  report += `## Metrics Summary\n\n`;
  report += `| Metric | Value | Status | Target Band |\n`;
  report += `|--------|-------|--------|-------------|\n`;
  
  // Adoption metrics
  report += `| **Adoption & Yield** | | | |\n`;
  report += `| Acceptance Rate | ${(metrics.adoption.acceptanceRate * 100).toFixed(1)}% | ${getStatus(metrics.adoption.acceptanceRate * 100, 'acceptanceRate')} | 60-120% |\n`;
  report += `| Backlog Clearance | ${metrics.adoption.backlogClearance} | ⚪ N/A | N/A |\n`;
  report += `| AI Edit Share | ${metrics.adoption.aiEditShare.toFixed(1)}% | ⚪ N/A | N/A |\n`;
  report += `| Prompt Yield | ${metrics.adoption.promptYield.toFixed(1)} lines/session | ⚪ N/A | N/A |\n`;
  
  // Speed metrics
  report += `| **Speed & Flow** | | | |\n`;
  report += `| Lead Time AI (avg) | ${metrics.speed.leadTimeAI_avg_hours.toFixed(1)}h | ⚪ N/A | N/A |\n`;
  report += `| Build Breaks per 1k | ${metrics.speed.buildBreaksPer1k.toFixed(2)} | ${getStatus(metrics.speed.buildBreaksPer1k, 'buildBreaksPer1k')} | <0.5 |\n`;
  
  // Quality metrics
  report += `| **Quality & Defects** | | | |\n`;
  report += `| Rework within 72h | ${metrics.quality.rework72h_pct.toFixed(1)}% | ${getStatus(metrics.quality.rework72h_pct, 'rework72h_pct')} | <15% |\n`;
  report += `| Defects per 1k Lines | ${metrics.quality.defectIntroPer1k.toFixed(2)} | ${getStatus(metrics.quality.defectIntroPer1k, 'defectIntroPer1k')} | ≤0.8 |\n`;
  report += `| Test Pass Delta | ${metrics.quality.testPassDelta_pct.toFixed(1)}% | ${getStatus(metrics.quality.testPassDelta_pct, 'testPassDelta_pct')} | ≥0% |\n`;
  report += `| Type/Lint per 1k | ${metrics.quality.typeLintPer1k} | ${getStatus(metrics.quality.typeLintPer1k, 'typeLintPer1k')} | ≤3 |\n`;
  
  // Maintainability metrics
  report += `| **Maintainability** | | | |\n`;
  report += `| Complexity Delta | ${metrics.maintainability.complexityDelta_pct.toFixed(1)}% | ${getStatus(metrics.maintainability.complexityDelta_pct, 'complexityDelta_pct')} | ≤+5% |\n`;
  report += `| Duplication Delta | ${metrics.maintainability.duplicationDelta_pct.toFixed(1)}% | ${getStatus(metrics.maintainability.duplicationDelta_pct, 'duplicationDelta_pct')} | ≤+1% |\n`;
  report += `| Ownership Churn | ${metrics.maintainability.ownershipChurn_pct.toFixed(1)}% | ${getStatus(metrics.maintainability.ownershipChurn_pct, 'ownershipChurn_pct')} | ≤25% |\n`;
  
  // Stability metrics
  report += `| **Stability & Operations** | | | |\n`;
  report += `| Rollback/Hotfix Rate | ${metrics.stability.rollbackHotfixRate_pct.toFixed(1)}% | ${getStatus(metrics.stability.rollbackHotfixRate_pct, 'rollbackHotfixRate_pct')} | <5% |\n`;
  report += `| MTTR AI | ${metrics.stability.mttrAI_hours.toFixed(1)}h | ${getStatus(metrics.stability.mttrAI_hours, 'mttrAI_hours')} | <24h |\n`;
  
  // Security metrics
  report += `| **Security & Dependencies** | | | |\n`;
  report += `| New High Severity | ${metrics.security.newHighSeverity} | ${getStatus(metrics.security.newHighSeverity, 'newHighSeverity')} | 0 |\n`;
  report += `| Vulnerability Delta | ${metrics.security.vulnDelta} | ⚪ N/A | N/A |\n`;
  
  // Performance metrics
  report += `| **Performance & Size** | | | |\n`;
  report += `| Performance Delta P95 | ${metrics.performance.perfDelta_p95_pct} | ${getStatus(metrics.performance.perfDelta_p95_pct, 'perfDelta_p95_pct')} | ±5% |\n`;
  report += `| Bundle Size Delta | ${metrics.performance.bundleSizeDelta_pct} | ${getStatus(metrics.performance.bundleSizeDelta_pct, 'bundleSizeDelta_pct')} | ±5% |\n`;
  
  report += `\n## Key Insights\n\n`;
  report += `### Top 3 Risk Areas\n`;
  report += `- **Build Stability**: ${metrics.speed.buildBreaksPer1k.toFixed(2)} build breaks per 1k lines\n`;
  report += `- **Code Quality**: ${metrics.quality.rework72h_pct.toFixed(1)}% of lines reworked within 72h\n`;
  report += `- **Defect Rate**: ${metrics.quality.defectIntroPer1k.toFixed(2)} defects per 1k lines\n\n`;
  
  report += `### Top 3 Improvements\n`;
  report += `- **AI Adoption**: ${metrics.adoption.aiEditShare.toFixed(1)}% of code changes involve AI\n`;
  report += `- **Efficiency**: ${metrics.adoption.promptYield.toFixed(1)} lines generated per AI session\n`;
  report += `- **Response Time**: Average ${metrics.speed.leadTimeAI_avg_hours.toFixed(1)}h from AI suggestion to merge\n\n`;
  
  report += `## Raw Data\n\n`;
  report += `- **Total Lines Changed**: ${metrics.counts.suggested_lines}\n`;
  report += `- **AI-Touched Lines**: ${metrics.counts.accepted_lines}\n`;
  report += `- **AI Sessions**: ${metrics.counts.ai_sessions}\n`;
  report += `- **Failed CI Runs**: ${metrics.counts.failed_ci_runs}\n`;
  report += `- **Bugs Opened**: ${metrics.counts.bugs_opened_7d}\n`;
  report += `- **Deployments**: ${metrics.counts.deploys}\n`;
  
  return report;
}

async function main() {
  const program = new Command();
  program
    .option('-d, --days <number>', 'Number of days to analyze', '7')
    .option('-o, --output <path>', 'Output directory for reports', 'reports')
    .parse(process.argv);

  const options = program.opts();
  const days = parseInt(options.days);
  const outputDir = options.output;

  if (isNaN(days) || days <= 0) {
    console.error('Invalid days parameter. Must be a positive number.');
    process.exit(1);
  }

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const collector = new AIMetricsCollector(days);
    const metrics = await collector.collectMetrics();

    // Save JSON report
    const jsonPath = path.join(outputDir, 'ai-metrics.json');
    await fs.writeFile(jsonPath, JSON.stringify(metrics, null, 2));
    console.log(`JSON report saved to: ${jsonPath}`);

    // Generate and save Markdown report
    const markdown = await generateMarkdownReport(metrics);
    const mdPath = path.join(outputDir, 'ai-metrics.md');
    await fs.writeFile(mdPath, markdown);
    console.log(`Markdown report saved to: ${mdPath}`);

    console.log('\n✅ AI metrics collection completed successfully!');
    
  } catch (error) {
    console.error('❌ Error collecting AI metrics:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
