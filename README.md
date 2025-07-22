# MERN CRUD Frontend

React + Vite 前端專案，使用 Bootstrap、SweetAlert2、React Icons。

## 功能特色

- ✅ 完整的 CRUD 操作（新增、讀取、更新、刪除）
- ✅ Bootstrap Modal 表單
- ✅ SweetAlert2 提示視窗
- ✅ React Icons 圖示
- ✅ Google Fonts（Noto Sans TC、Roboto）
- ✅ 錯誤處理與載入狀態
- ✅ 響應式設計

## 本地開發

```bash
npm install
npm run dev
```

## 環境變數

建立 `.env` 檔案：

```env
VITE_API_URL=http://localhost:5000
```

## 部署到 Render

1. 在 Render 建立 **Static Site**
2. 連接 GitHub 倉庫
3. 設定環境變數：
   - `VITE_API_URL`: 你的 Render 後端網址
4. Build Command: `npm run build`
5. Publish Directory: `dist`

## 技術棧

- React 18
- Vite
- Bootstrap 5
- SweetAlert2
- React Icons
- Axios