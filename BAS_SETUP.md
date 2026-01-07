# SAP Business Application Studio Setup Guide

## Dev Space Configuration

Based on your screenshot, here's what you should select:

### ✅ Recommended Selection: "Full-Stack Cloud Application"

**Why this option?**
- Best suited for SAP CAP (Cloud Application Programming) projects
- Includes all necessary tools for backend (CAP) and frontend (UI5) development
- Supports MTA (Multi-Target Application) deployment
- Perfect for your SuccessFactors Compensation Extension

### Alternative: "SAP Fiori Dev Space" (if Full-Stack not available)

If "Full-Stack Cloud Application" is not visible, select **"SAP Fiori Dev Space"** and ensure these extensions are enabled:

#### ✅ Required Extensions (Predefined - should be auto-selected):
- ✅ **Basic Tools** - For build and deployment
- ✅ **MTA Tools** - For Multi-Target Application development
- ✅ **Fiori Freestyle Tools** - For UI5 frontend development
- ✅ **HTML5 Runner** - For local testing

#### ✅ Additional Extensions to Enable:
- ✅ **CDS Graphical Modeler** - For visualizing your CAP data models
- ✅ **Application Frontend Service CLI** - For frontend deployment

### Dev Space Name
- Use: **"OCOMP"** (as shown in your screenshot) or **"sf-compensation"**

## After Creating Dev Space

1. **Clone Your GitHub Repository**:
   ```bash
   git clone https://github.com/SumitAG008/SFCMP.git
   cd SFCMP
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development**:
   ```bash
   npm start
   ```
