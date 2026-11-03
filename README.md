# Smart Inventory System & Stock Optimization

A beginner-friendly full-stack web project using HTML, CSS, JavaScript, Node.js and Express.

## Features
- Dashboard with total products, units, inventory value and low-stock count
- Add, edit, delete and search inventory products
- Automatic stock status: Healthy, Low stock or Reorder now
- Stock optimization recommendation based on average daily sales, supplier lead time and safety stock
- Responsive layout for desktop and mobile

## Requirements
- Node.js 18+ (or a recent LTS version)
- Internet connection for the optional Google Fonts import in `style.css`

## Run the project
1. Extract the ZIP file.
2. Open the extracted `smart_inventory_system` folder in VS Code.
3. Open a terminal in that folder.
4. Run: `npm install`
5. Run: `npm start`
6. Open `http://localhost:3000` in your browser.

## Stock optimization logic
- Safety stock = average daily sales × 2 days
- Reorder point = (average daily sales × supplier lead time) + safety stock
- Target stock = average daily sales × (lead time + 14 days) + safety stock
- Suggested order = max(0, target stock − current quantity)

This is a student/demo project. Inventory data is stored in server memory and resets when the server restarts. For a production version, add a database (such as SQLite or MongoDB), authentication, input validation and audit logs.
