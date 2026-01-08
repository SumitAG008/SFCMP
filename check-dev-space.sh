#!/bin/bash
echo "=== Dev Space Type Check ==="
echo ""

# Check CDS
if command -v cds &> /dev/null; then
    echo "✅ CDS installed: $(cds --version)"
else
    echo "❌ CDS not found"
fi

# Check MTA
if command -v mbt &> /dev/null; then
    echo "✅ MTA Build Tool installed: $(mbt --version)"
else
    echo "❌ MTA Build Tool not found"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Check CF CLI
if command -v cf &> /dev/null; then
    echo "✅ Cloud Foundry CLI: $(cf --version)"
else
    echo "❌ CF CLI not found"
fi

# Check project structure
echo ""
echo "=== Project Structure ==="
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    if grep -q "@sap/cds" package.json; then
        echo "✅ CAP dependencies found"
    fi
else
    echo "❌ package.json not found"
fi

if [ -f "mta.yaml" ]; then
    echo "✅ mta.yaml found"
else
    echo "⚠️  mta.yaml not found (may use manifest.yml)"
fi

if [ -d "srv" ]; then
    echo "✅ srv/ folder found"
else
    echo "❌ srv/ folder not found"
fi

if [ -d "db" ]; then
    echo "✅ db/ folder found"
else
    echo "❌ db/ folder not found"
fi

echo ""
echo "=== Conclusion ==="
if command -v cds &> /dev/null && [ -f "package.json" ] && [ -d "srv" ]; then
    echo "✅ You're using: Full Stack Cloud Application (or compatible)"
    echo "✅ Perfect for CAP development!"
else
    echo "⚠️  You may need: Full Stack Cloud Application dev space"
    echo "⚠️  Or install missing tools manually"
fi
