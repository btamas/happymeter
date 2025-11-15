#!/bin/bash
#
# Test CI workflows locally using act
# https://github.com/nektos/act
#
# Usage:
#   ./test-ci.sh              # Run all jobs (dry run)
#   ./test-ci.sh lint         # Run lint job
#   ./test-ci.sh test         # Run all test jobs
#   ./test-ci.sh build        # Run all build jobs
#   ./test-ci.sh --list       # List all jobs
#

set -e

ACT=/opt/homebrew/bin/act

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== HappyMeter CI Testing with act ===${NC}"
echo ""

case "${1:-}" in
  --list|-l)
    echo -e "${YELLOW}Available jobs:${NC}"
    $ACT -l
    ;;

  lint)
    echo -e "${GREEN}Running lint job...${NC}"
    $ACT -j lint
    ;;

  format)
    echo -e "${GREEN}Running format check job...${NC}"
    $ACT -j format
    ;;

  test)
    echo -e "${GREEN}Running all test jobs...${NC}"
    $ACT -j test-backend -j test-frontend
    ;;

  test-backend)
    echo -e "${GREEN}Running backend tests...${NC}"
    $ACT -j test-backend
    ;;

  test-frontend)
    echo -e "${GREEN}Running frontend tests...${NC}"
    $ACT -j test-frontend
    ;;

  build)
    echo -e "${GREEN}Running all build jobs...${NC}"
    $ACT -j build-backend -j build-frontend
    ;;

  build-backend)
    echo -e "${GREEN}Running backend build...${NC}"
    $ACT -j build-backend
    ;;

  build-frontend)
    echo -e "${GREEN}Running frontend build...${NC}"
    $ACT -j build-frontend
    ;;

  security)
    echo -e "${GREEN}Running security audit...${NC}"
    $ACT -j security-audit
    ;;

  type-check)
    echo -e "${GREEN}Running TypeScript type check...${NC}"
    $ACT -j type-check
    ;;

  all)
    echo -e "${GREEN}Running all CI jobs (this may take a while)...${NC}"
    $ACT
    ;;

  --dryrun|--dry-run)
    echo -e "${YELLOW}Dry run of all jobs:${NC}"
    $ACT --dryrun
    ;;

  --help|-h|"")
    echo "Test GitHub Actions workflows locally using act"
    echo ""
    echo "Usage:"
    echo "  ./test-ci.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  --list, -l       List all available jobs"
    echo "  lint             Run linting job"
    echo "  format           Run format check job"
    echo "  test             Run all test jobs (backend + frontend)"
    echo "  test-backend     Run backend tests only"
    echo "  test-frontend    Run frontend tests only"
    echo "  build            Run all build jobs (backend + frontend)"
    echo "  build-backend    Run backend build only"
    echo "  build-frontend   Run frontend build only"
    echo "  security         Run security audit"
    echo "  type-check       Run TypeScript type checking"
    echo "  all              Run all CI jobs"
    echo "  --dryrun         Dry run (show what would happen)"
    echo "  --help, -h       Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./test-ci.sh --list              # See all jobs"
    echo "  ./test-ci.sh lint                # Test linting"
    echo "  ./test-ci.sh test                # Run all tests"
    echo "  ./test-ci.sh build-backend       # Build backend"
    echo ""
    echo "Notes:"
    echo "  - First run will download Docker images (may be slow)"
    echo "  - Act runs workflows in Docker containers"
    echo "  - Some jobs may behave differently than on GitHub"
    echo "  - CodeQL job is not supported by act"
    ;;

  *)
    echo -e "${YELLOW}Unknown command: $1${NC}"
    echo "Run './test-ci.sh --help' for usage information"
    exit 1
    ;;
esac
