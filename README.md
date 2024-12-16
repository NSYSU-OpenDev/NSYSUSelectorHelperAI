# 中山大學選課助手 React TypeScript 版
## 進入網頁
https://CelleryLin.github.io/selector_helper/

## 回饋表單：
https://forms.gle/gFBZDgkSbj85zukP6

## 使用須知：
這是實驗版，利用 Transformer 與 LLM 實現 Retrival-Augmented Generation。

> [NOTE]
> 由於需要顯存，因此需要 Host Backend 以及使用 GPU 進行推論。

## 更新內容：
* 人工智慧對話排課系統 (Beta)
* 檢索重新排序 (Beta)

## 主要功能：
* 課表動態更新
* 一鍵加入必修課
* 更強大的篩選器以及智慧搜尋
* 本學期學程搜尋
* 顯示衝堂
* 自動填課目前已經上線測試中！
* 一鍵登記選課 (其實沒有一鍵啦)
* Local Storage 關閉瀏覽器自動儲存選課資料

## 本地端運行：

### 後端

#### 建立 venv 環境
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 啟動後端 (<root>/)
```bash
cd .. # 回到根目錄 (若你在 backend 資料夾)
python backend/app.py
```

### 前端

#### 安裝套件
```bash
cd frontend
yarn
```

#### 啟動前端 (<root>/frontend/)
```bash
yarn dev
```

## 已知問題：
* Safari 瀏覽器有可能會出現渲染問題，有任何選染錯誤請聯絡我，並註記您的瀏覽器版本。(如果願意擔當測試者，請在表單說想當 IOS 前端測試，不勝感激)

## 錯誤回報 & 聯絡：
* 總負責人：yochen0123@gmail.com
