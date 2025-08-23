// Example configuration file for AI Metrics tool
// Copy this file to ai-metrics.config.ts and customize as needed

export const config = {
  // GitHub configuration
  github: {
    // These can be overridden with environment variables
    owner: process.env.OWNER || 'your-username',
    repo: process.env.REPO || 'your-repo-name',
    token: process.env.GITHUB_TOKEN || 'your-github-token'
  },

  // Metrics configuration
  metrics: {
    // Target bands for different metrics
    targets: {
      acceptanceRate: { min: 0.6, max: 1.2 },
      buildBreaksPer1k: { max: 0.5 },
      rework72h_pct: { max: 15 },
      defectIntroPer1k: { max: 0.8 },
      testPassDelta_pct: { min: 0 },
      typeLintPer1k: { max: 3 },
      complexityDelta_pct: { max: 5 },
      duplicationDelta_pct: { max: 1 },
      ownershipChurn_pct: { max: 25 },
      rollbackHotfixRate_pct: { max: 5 },
      mttrAI_hours: { max: 24 },
      newHighSeverity: { max: 0 },
      perfDelta_p95_pct: { min: -5, max: 5 },
      bundleSizeDelta_pct: { min: -5, max: 5 }
    },

    // AI detection keywords
    aiKeywords: [
      'ai', 'agent', 'cursor', 'copilot', 'generated',
      'assisted', 'suggested', 'auto', 'machine'
    ],

    // File extensions to analyze
    fileExtensions: [
      '.ts', '.tsx', '.js', '.jsx', '.py', '.java',
      '.cpp', '.c', '.go', '.rs', '.php', '.rb'
    ],

    // Exclude patterns
    excludePatterns: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.min.js',
      '*.bundle.js'
    ]
  },

  // Output configuration
  output: {
    defaultDays: 7,
    defaultOutputDir: 'reports',
    formats: ['json', 'md'],
    includeCharts: false, // Set to true if you want to generate charts
    includeTrends: true   // Include trend analysis
  },

  // Integration configuration
  integrations: {
    // CI/CD systems
    ci: {
      githubActions: true,
      jenkins: false,
      gitlabCI: false,
      circleCI: false
    },

    // Security scanning
    security: {
      snyk: false,
      dependabot: true,
      codeql: true,
      sonarqube: false
    },

    // Performance monitoring
    performance: {
      newRelic: false,
      datadog: false,
      prometheus: false,
      custom: false
    }
  },

  // Custom metrics
  customMetrics: {
    // Add your own metric definitions here
    // Example:
    // teamVelocity: {
    //   description: 'Lines of code per developer per day',
    //   calculation: 'totalLines / (devCount * days)',
    //   target: { min: 50, max: 200 }
    // }
  }
};

export default config;
