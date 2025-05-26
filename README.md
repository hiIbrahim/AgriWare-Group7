# AgriWare WMS

**Modern Warehouse Management System for Agricultural Products**

---

## 🚀 Quick Start

**1. Navigate to the correct folder:**

```bash
cd "AgriWare WMS"
```
> ⚠️ **Do NOT use the `AGRIWARE-GROUP 7` folder.**  
> That folder contains old, unstructured, and incomplete files which are not maintained.
> It is only for reference and should not be used for development.
> It paved our way to the current project structure.
>
> The `AgriWare WMS` folder contains the complete, production-ready codebase.
> It has a clean structure, all features integrated, and is ready to run.
> The real, production-ready project is in `AgriWare WMS`.

---

**2. Run the Application:**

- **Recommended (VS Code):**
  - Open `index.html` in VS Code.
  - Right-click and select **"Open with Live Server"**.

- **Or use Python’s HTTP server:**
  ```bash
  python -m http.server 8000
  ```
  Then visit: [http://localhost:8000](http://localhost:8000)

---

## 📂 Project Structure

```
AgriWare WMS/
├── index.html                # Entry point (landing page)
├── admin/                    # Admin dashboard & management
├── worker/                   # Worker interface (tasks, scanner, shift log)
├── shared/                   # Shared components (auth, scripts, styles, partials)
├── assets/                   # Images, icons, and static assets
├── final-farm-module/        # Farm module (optional/extension)
├── orders/                   # Order management pages and scripts
├── extract_file.py           # Script to extract file structure
├── all_filenames.txt         # List of all filenames in the project
└── ...                       # Other supporting files and folders
```

## 🔑 Key Features

- **Role-based access:** Admin, Staff, Worker
- **Inventory management:** Add, edit, and track products
- **Order management:** Create and monitor orders
- **Supplier management:** Manage supplier info and performance
- **Responsive UI:** Works on desktop and mobile
- **Modern, modular codebase:** Clean structure for easy maintenance
- **Farming Module:** Track crop cycles, harvest yields, and soil conditions. Integrated with warehouse inventory.

---

## 🛠 Dependencies

- Pure **HTML**, **CSS**, **JavaScript** (no frameworks)
- [Bootstrap 5](https://getbootstrap.com/) (CDN)
- [Font Awesome](https://fontawesome.com/) (CDN)
- [Select2](https://select2.org/) (CDN, for enhanced select fields)
- Works in all modern browsers

---

## ❓ Support

For issues or questions, please contact: bscs23143@itu.edu.pk

---

## ⚠️ Important Notes

- **Only use the `AgriWare WMS` folder.**  
  The `AGRIWARE-GROUP 7` folder is deprecated and not maintained.
- All features and pages are fully integrated in `AgriWare WMS`.
- Start from index.html for the best experience.

---

## 💡 Why This Matters

- **Clear folder structure:** No confusion between old and new code.
- **Easy to run:** Just open index.html with Live Server or any static server.
- **Production-ready:** All features are tested and integrated in `AgriWare WMS`.

---

**Enjoy using AgriWare WMS!**
