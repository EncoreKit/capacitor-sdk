#!/bin/bash
# scripts/release/publish-release.sh
# Interactive release script with semantic versioning for Capacitor SDK.
# Publishes to npm as the sole distribution channel.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Encore Capacitor SDK Release${NC}"
echo ""

# =============================================================================
# Step 1: Validate repository state
# =============================================================================
echo -e "${BLUE}Step 1: Checking repository state...${NC}"

CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}Error: Must be on main branch (currently on $CURRENT_BRANCH)${NC}"
    exit 1
fi

git fetch origin main --tags

LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
if [ "$LOCAL" != "$REMOTE" ]; then
    echo -e "${RED}Error: Local main is out of sync with remote${NC}"
    echo "   Run: git pull origin main"
    exit 1
fi

if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: You have uncommitted changes${NC}"
    echo "   Commit or stash your changes before releasing"
    exit 1
fi

if ! npm whoami &>/dev/null; then
    echo -e "${RED}Error: Not logged in to npm${NC}"
    echo "   Run: npm login"
    exit 1
fi

echo -e "${GREEN}Repository is clean and up to date${NC}"
echo ""

# =============================================================================
# Step 2: Detect current version from git tags
# =============================================================================
echo -e "${BLUE}Step 2: Detecting current version...${NC}"

CURRENT_VERSION=$(git tag -l "v*" --sort=-v:refname | head -n 1)
CURRENT_VERSION=${CURRENT_VERSION:-v0.0.0}
echo -e "   Current version: ${GREEN}$CURRENT_VERSION${NC}"

CURRENT_VERSION_STRIPPED="${CURRENT_VERSION#v}"
CURRENT_MAJOR=$(echo "$CURRENT_VERSION_STRIPPED" | cut -d'.' -f1)
CURRENT_MINOR=$(echo "$CURRENT_VERSION_STRIPPED" | cut -d'.' -f2)
CURRENT_PATCH=$(echo "$CURRENT_VERSION_STRIPPED" | cut -d'.' -f3)

echo ""

# =============================================================================
# Step 3: Prompt for new version
# =============================================================================
echo -e "${BLUE}Step 3: Enter the new version number${NC}"
echo ""
echo -e "   Current version: ${GREEN}$CURRENT_VERSION${NC}"
echo -e "   Shortcuts:       ${YELLOW}patch${NC} -> v${CURRENT_MAJOR}.${CURRENT_MINOR}.$((CURRENT_PATCH + 1))"
echo -e "                    ${YELLOW}minor${NC} -> v${CURRENT_MAJOR}.$((CURRENT_MINOR + 1)).0"
echo -e "                    ${YELLOW}major${NC} -> v$((CURRENT_MAJOR + 1)).0.0"
echo ""

read -p "Enter version (e.g. 1.2.0) or shortcut (patch/minor/major): " VERSION_INPUT

case $VERSION_INPUT in
    patch)
        NEW_MAJOR=$CURRENT_MAJOR
        NEW_MINOR=$CURRENT_MINOR
        NEW_PATCH=$((CURRENT_PATCH + 1))
        ;;
    minor)
        NEW_MAJOR=$CURRENT_MAJOR
        NEW_MINOR=$((CURRENT_MINOR + 1))
        NEW_PATCH=0
        ;;
    major)
        NEW_MAJOR=$((CURRENT_MAJOR + 1))
        NEW_MINOR=0
        NEW_PATCH=0
        ;;
    *)
        VERSION_INPUT="${VERSION_INPUT#v}"
        if ! echo "$VERSION_INPUT" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
            echo -e "${RED}Invalid format. Expected X.Y.Z (e.g. 1.2.0)${NC}"
            exit 1
        fi
        NEW_MAJOR=$(echo "$VERSION_INPUT" | cut -d'.' -f1)
        NEW_MINOR=$(echo "$VERSION_INPUT" | cut -d'.' -f2)
        NEW_PATCH=$(echo "$VERSION_INPUT" | cut -d'.' -f3)
        ;;
esac

NEW_VERSION="v${NEW_MAJOR}.${NEW_MINOR}.${NEW_PATCH}"
NEW_VERSION_NUMBER="${NEW_MAJOR}.${NEW_MINOR}.${NEW_PATCH}"

# =============================================================================
# Step 4: Validate new version > current version
# =============================================================================
echo ""
echo -e "${BLUE}Step 4: Validating version...${NC}"

CURRENT_WEIGHT=$(( CURRENT_MAJOR * 1000000 + CURRENT_MINOR * 1000 + CURRENT_PATCH ))
NEW_WEIGHT=$(( NEW_MAJOR * 1000000 + NEW_MINOR * 1000 + NEW_PATCH ))

if [ "$NEW_WEIGHT" -le "$CURRENT_WEIGHT" ]; then
    echo -e "${RED}New version $NEW_VERSION must be greater than current $CURRENT_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}Next version: $NEW_VERSION${NC}"
echo ""

# =============================================================================
# Step 5: Show changes since last release
# =============================================================================
echo -e "${BLUE}Step 5: Changes since $CURRENT_VERSION:${NC}"
echo ""

if [ "$CURRENT_VERSION" = "v0.0.0" ]; then
    git log --oneline | head -20
else
    git log --oneline "$CURRENT_VERSION"..HEAD | head -20
fi

echo ""

# =============================================================================
# Step 6: Confirm release details
# =============================================================================
echo -e "${YELLOW}Step 6: Confirm release details:${NC}"
echo ""
echo "   Current version: $CURRENT_VERSION"
echo "   New version:     $NEW_VERSION"
echo "   npm package:     @encorekit/capacitor@$NEW_VERSION_NUMBER"
echo ""
read -p "Proceed with release? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Release cancelled${NC}"
    exit 1
fi

echo ""

# =============================================================================
# Step 7: Update package.json version
# =============================================================================
echo -e "${BLUE}Step 7: Updating package.json version to $NEW_VERSION_NUMBER...${NC}"

npm version "$NEW_VERSION_NUMBER" --no-git-tag-version

echo -e "${GREEN}package.json version updated${NC}"
echo ""

# =============================================================================
# Step 8: Build TypeScript
# =============================================================================
echo -e "${BLUE}Step 8: Building TypeScript...${NC}"

npm run build

echo -e "${GREEN}Build complete${NC}"
echo ""

# =============================================================================
# Step 9: Commit version bump, tag, push
# =============================================================================
echo -e "${BLUE}Step 9: Committing version bump and tagging...${NC}"

git add package.json
[ -f package-lock.json ] && git add package-lock.json
git commit -m "Bump version to $NEW_VERSION_NUMBER"

git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"
git push origin main
git push origin "$NEW_VERSION"

echo -e "${GREEN}Version bump committed and tagged${NC}"
echo ""

# =============================================================================
# Step 10: Publish to npm
# =============================================================================
echo -e "${BLUE}Step 10: Publishing to npm...${NC}"

npm publish --access public

echo -e "${GREEN}Published to npm${NC}"
echo ""

# =============================================================================
# Done
# =============================================================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Release $NEW_VERSION published successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "   Verify: npm install @encorekit/capacitor@$NEW_VERSION_NUMBER"
echo "   https://www.npmjs.com/package/@encorekit/capacitor"
echo ""
