export default defineAppConfig({
  pages: [
  'pages/index/index',
  'pages/done/index'
  ],
  window: {
      "navigationBarTitleText": "我的待办",
      "navigationBarBackgroundColor": "#ffffff",
      "backgroundColor": "#f5f5f5"
  }
,
  tabBar: {
      "color": "#999999",
      "selectedColor": "#1890ff",
      "backgroundColor": "#ffffff",
      "list": [
          {
              "pagePath": "pages/index/index",
              "text": "待办",
              "iconPath": "assets/todo.png",
              "selectedIconPath": "assets/todo-active.png"
          },
          {
              "pagePath": "pages/done/index",
              "text": "已完成",
              "iconPath": "assets/done.png",
              "selectedIconPath": "assets/done-active.png"
          }
      ]
  }
});
