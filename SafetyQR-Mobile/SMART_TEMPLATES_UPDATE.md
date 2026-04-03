# 🛡️ Safety QR - Smart Setup Update

## 🌟 What's New: Smart Templates
Now when a user scans a new QR from the app, they get a **Smart Category Selection** screen instead of a boring form.

### 5 Categories Added:
1.  👶 **Child Safety** (Optimized for Kids)
2.  👩 **Women Safety** (Personal Protection)
3.  👴 **Senior Citizen** (Medical & Caretaker info)
4.  🚗 **Vehicle Safety** (Accident & Owner info)
5.  🐾 **Pet Safety** (Lost & Found for pets)

### 🚀 How it Works:
1.  **Select Category**: User taps a card (e.g., "Vehicle Safety").
2.  **Auto-Form**: The form changes labels dynamically:
    *   *Child* -> "Child Name", "Parent's No"
    *   *Vehicle* -> "Vehicle Number", "Owner Name"
    *   *Pet* -> "Pet Name", "Vet's No"
3.  **One-Click Activate**: Saves the structure and activates immediately.

### 📱 User Experience:
- Visual Icons for each category 🎨
- Color-coded cards (Red for Child, Green for Vehicle, etc.)
- Helper text to guide the user ("Select protection type...")

---

## 🔧 Technical Details
- **Dynamic State**: `selectedTemplate` controls the UI.
- **Flexible Form**: Inputs reuse same state variables but display different labels based on template.
- **Database**: Saves `template_id` in `additional_data` for future reference (to show correct icon/labels in View Mode).

---

## ✅ Test Steps
1.  App Reload (`r`).
2.  Scan Unactivated QR.
3.  See the **Grid of 5 Options**.
4.  Select one (e.g. Pet Safety).
5.  Verify form asks for "Pet Name" etc.
6.  Go Back -> Select "Violence Safety".
7.  Verify form asks for "Vehicle Number".
