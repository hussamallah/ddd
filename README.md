# Core TypeScript Engine with Next.js 14+ App

A comprehensive TypeScript engine with Next.js 14+ application, featuring AI-powered development tools and metrics tracking.

## Features

- **Core TypeScript Engine**: Robust, type-safe backend engine
- **Next.js 14+ Frontend**: Modern React-based web application
- **AI Engineering Metrics**: Comprehensive tracking of AI-assisted development performance
- **Workspace Architecture**: Monorepo structure with shared packages

## AI Engineering Metrics

Track and optimize your AI-assisted development workflow with comprehensive metrics collection.

### Quick Start

```bash
# Install dependencies
npm install

# Run metrics collection for last 7 days
npm run ai:metrics

# Run for custom time period
npm run ai:metrics -- --days 30 --output custom-reports
```

### Environment Configuration

Set these environment variables to enable GitHub integration:

```bash
export GITHUB_TOKEN="your_github_personal_access_token"
export OWNER="your_github_username"  # Optional: auto-detected from git remote
export REPO="your_repository_name"   # Optional: auto-detected from git remote
```

**Required GitHub Token Permissions:**
- `repo` - Full repository access
- `workflow` - GitHub Actions access
- `issues` - Read issues and PRs
- `pull_requests` - Read PR data

### Metrics Collected

#### Adoption & Yield
- **Acceptance Rate**: Ratio of accepted to suggested lines
- **Backlog Clearance**: Net change in AI-suggested work
- **AI Edit Share**: Percentage of code changes involving AI
- **Prompt Yield**: Lines generated per AI session

#### Speed & Flow
- **Lead Time AI**: Time from AI suggestion to merge
- **Build Breaks per 1k**: Failed CI runs per 1000 lines

#### Quality & Defects
- **Rework within 72h**: Percentage of lines re-touched
- **Defect Introduction Rate**: Bugs per 1000 lines
- **Test Pass Delta**: Change in test success rate
- **Type/Lint Errors**: Code quality issues per 1000 lines

#### Maintainability
- **Complexity Delta**: Change in code complexity
- **Duplication Delta**: Change in code duplication
- **Ownership Churn**: Files changed outside owners

#### Stability & Operations
- **Rollback/Hotfix Rate**: Emergency fixes percentage
- **MTTR AI**: Mean time to repair AI-related issues

#### Security & Dependencies
- **New High Severity Findings**: Security vulnerabilities
- **Vulnerability Delta**: Net change in security issues

#### Performance & Size
- **Performance Delta**: P95 latency/throughput changes
- **Bundle Size Delta**: Frontend/server size changes

### Output Files

The tool generates two report formats:

1. **`ai-metrics.json`**: Raw data in structured JSON format
2. **`ai-metrics.md`**: Human-readable report with traffic-light indicators

### GitHub Actions Integration

Automated metrics collection runs:
- **Nightly** at 2 AM UTC
- **On push** to main branch
- **Manually** via workflow dispatch

Weekly summaries are automatically posted to:
- Recent merged PRs
- Repository README with status badge

### Customization

Extend the metrics collection by:
- Adding new metric categories
- Integrating with additional tools (APM, SAST, etc.)
- Customizing target bands and thresholds
- Adding team-specific KPIs

### Troubleshooting

**Common Issues:**
- **Missing GitHub Token**: Ensure `GITHUB_TOKEN` is set with proper permissions
- **Repository Detection**: Check git remote configuration
- **Rate Limiting**: GitHub API has rate limits; consider using GitHub Apps for higher limits

**Debug Mode:**
```bash
DEBUG=* npm run ai:metrics
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
├── apps/
│   └── web-app/          # Next.js frontend application
├── packages/
│   └── core-engine/      # TypeScript core engine
├── tools/
│   └── ai-metrics.ts     # AI metrics collection tool
├── .github/
│   └── workflows/        # GitHub Actions workflows
└── reports/              # Generated metrics reports
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
