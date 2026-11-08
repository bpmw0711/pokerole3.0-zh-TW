# Android 外殼（WebView）

把網站 `https://bpmw0711.github.io/pokerole3.0-zh-TW/` 包成 APK，內容跟網頁同步（每次開啟都讀線上版）。
專案原始碼來自 [ZhangShengFan/Pakr](https://github.com/ZhangShengFan/Pakr)（MIT，見 LICENSE），只取 Android 專案與建置流程，沒有用它的 Cloudflare 前端。

發佈：到 Actions → Build APK → Run workflow，填版本號，完成後 Releases 會多一個 `v<版本>`，附 arm64-v8a 與 armeabi-v7a 兩個 APK（絕大多數手機用 arm64-v8a）。
網頁內容更新不需要重發 APK；只有改圖示、名稱、外殼程式時才要。
