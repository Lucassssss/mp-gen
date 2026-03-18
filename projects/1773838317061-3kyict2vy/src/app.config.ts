export default defineAppConfig({
  pages: [
  'pages/index/index',
  'pages/history/index'
  ],
  window: {
      "navigationBarTitleText": "待办事项",
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
              "pagePath": "pages/history/index",
              "text": "已完成",
              "iconPath": "assets/completed.png",
              "selectedIconPath": "assets/completed-active.png"
          }
      ]
  }
});
