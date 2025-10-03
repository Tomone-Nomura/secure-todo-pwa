# セキュアTODO PWAアプリ

位置情報と認証機能を組み合わせたプライバシー保護型TODOアプリ

## 🎯 機能

### 実装済み
- ✅ TODOの作成・編集・削除
- ✅ カテゴリ分け（学校/仕事/個人/その他）
- ✅ 詳細の折りたたみ表示
- ✅ LocalStorageでのデータ永続化
- ✅ プライバシーレベル制御（3段階）
- ✅ パスワード認証
- ✅ 個人モード
- ✅ 手動位置設定

### 開発中
- ⏳ GPS自動位置取得
- ⏳ PWA対応
- ⏳ 生体認証（Web Authentication API）

## 🔐 プライバシーレベル

1. **Minimal（外出先）**: カテゴリごとのタスク数のみ表示
2. **Moderate（学校/職場）**: 該当カテゴリのタスク詳細を表示
3. **Full（自宅/個人モード）**: すべてのタスク詳細を表示

## 💻 セットアップ
```bash
# リポジトリをクローン
git clone https://github.com/Tomone-Nomura/secure-todo-pwa.git

# プロジェクトフォルダに移動
cd secure-todo-pwa

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm start
