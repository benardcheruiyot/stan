#!/bin/bash

# Deployment Validation Script
# This script helps validate that your deployment setup is correct

echo "🔍 Deployment Setup Validator"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

VALIDATION_ERRORS=0

# Check if GitHub Actions workflow exists
print_status "Checking GitHub Actions workflow..."
if [ -f ".github/workflows/deploy-to-ec2.yml" ]; then
    print_success "GitHub Actions workflow file exists"
else
    print_error "GitHub Actions workflow file not found"
    ((VALIDATION_ERRORS++))
fi

# Check package.json
print_status "Checking package.json..."
if [ -f "package.json" ]; then
    if grep -q "start.*backend/server.js" package.json; then
        print_success "Start script configured correctly"
    else
        print_warning "Start script may not be configured correctly"
    fi
    
    if grep -q "pm2" package.json; then
        print_success "PM2 scripts found in package.json"
    else
        print_warning "Consider adding PM2 scripts to package.json"
    fi
else
    print_error "package.json not found"
    ((VALIDATION_ERRORS++))
fi

# Check ecosystem.config.js
print_status "Checking PM2 ecosystem configuration..."
if [ -f "ecosystem.config.js" ]; then
    if grep -q "backend/server.js" ecosystem.config.js; then
        print_success "PM2 ecosystem configuration looks correct"
    else
        print_warning "PM2 ecosystem configuration may need review"
    fi
else
    print_error "ecosystem.config.js not found"
    ((VALIDATION_ERRORS++))
fi

# Check environment templates
print_status "Checking environment configuration..."
if [ -f ".env.production" ] || [ -f ".env.production.template" ] || [ -f ".env.example" ]; then
    print_success "Environment configuration files found"
    
    # Check for placeholder values
    for env_file in .env.production .env.production.template .env.example; do
        if [ -f "$env_file" ]; then
            if grep -q "your_.*_here\|YOUR_.*_HERE\|change_this" "$env_file"; then
                print_warning "$env_file contains placeholder values - update before deployment"
            fi
        fi
    done
else
    print_error "No environment configuration files found"
    ((VALIDATION_ERRORS++))
fi

# Check backend server.js
print_status "Checking application server..."
if [ -f "backend/server.js" ]; then
    if grep -q "/api/health" backend/server.js; then
        print_success "Health check endpoint found"
    else
        print_warning "Health check endpoint not found - deployment verification may fail"
    fi
    
    if grep -q "process.env.PORT" backend/server.js; then
        print_success "Port configuration uses environment variable"
    else
        print_warning "Port should be configurable via environment variable"
    fi
else
    print_error "backend/server.js not found"
    ((VALIDATION_ERRORS++))
fi

# Check for documentation
print_status "Checking documentation..."
DOC_FILES=(
    "GITHUB_ACTIONS_SETUP.md"
    "DEPLOYMENT_CHECKLIST.md"
    "README.md"
)

for doc_file in "${DOC_FILES[@]}"; do
    if [ -f "$doc_file" ]; then
        print_success "$doc_file exists"
    else
        print_warning "$doc_file not found - consider creating it"
    fi
done

# Check Node.js version compatibility
print_status "Checking Node.js compatibility..."
if [ -f "package.json" ]; then
    if grep -q '"engines"' package.json; then
        NODE_REQUIREMENT=$(grep -A 2 '"engines"' package.json | grep '"node"' | cut -d'"' -f4)
        print_success "Node.js version requirement specified: $NODE_REQUIREMENT"
    else
        print_warning "Consider specifying Node.js version requirement in package.json"
    fi
fi

# Check for security considerations
print_status "Checking security considerations..."
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        print_success "Environment files are in .gitignore"
    else
        print_error "Add .env* files to .gitignore to prevent committing secrets"
        ((VALIDATION_ERRORS++))
    fi
else
    print_warning ".gitignore file not found"
fi

# Check dependency security
print_status "Checking for dependency vulnerabilities..."
if command -v npm &> /dev/null; then
    print_status "Running npm audit..."
    if npm audit --audit-level high > /dev/null 2>&1; then
        print_success "No high-severity vulnerabilities found"
    else
        print_warning "High-severity vulnerabilities found - run 'npm audit' for details"
    fi
else
    print_warning "npm not found - cannot check for vulnerabilities"
fi

# Summary
echo ""
echo "======================================="
if [ $VALIDATION_ERRORS -eq 0 ]; then
    print_success "✅ All critical validations passed!"
    echo ""
    echo "Next steps:"
    echo "1. Configure GitHub repository secrets (EC2_SSH_PRIVATE_KEY, EC2_HOST)"
    echo "2. Set up your EC2 Ubuntu server"
    echo "3. Configure production environment variables"
    echo "4. Test deployment manually first"
    echo "5. Push to main branch to trigger automatic deployment"
else
    print_error "❌ $VALIDATION_ERRORS critical issues found!"
    echo ""
    echo "Please address the errors above before deploying."
fi

echo ""
echo "For detailed setup instructions, see:"
echo "- GITHUB_ACTIONS_SETUP.md"
echo "- DEPLOYMENT_CHECKLIST.md"