import { View, Text, Input, Button, Checkbox, ScrollView, SwipeAction } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
}

export default function IndexPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  // 从本地存储加载数据
  useEffect(() => {
    const savedTodos = Taro.getStorageSync('todos');
    if (savedTodos) {
      setTodos(savedTodos);
    }
  }, []);

  // 更新统计数据
  useEffect(() => {
    setStats({
      total: todos.length,
      completed: todos.filter(t => t.completed).length
    });
  }, [todos]);

  // 保存到本地存储
  const saveTodos = (newTodos: TodoItem[]) => {
    setTodos(newTodos);
    Taro.setStorageSync('todos', newTodos);
  };

  // 添加待办事项
  const addTodo = () => {
    if (!inputValue.trim()) {
      Taro.showToast({ title: '请输入待办事项', icon: 'none' });
      return;
    }
    
    const newTodo: TodoItem = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now()
    };
    
    saveTodos([...todos, newTodo]);
    setInputValue('');
    Taro.showToast({ title: '添加成功', icon: 'success' });
  };

  // 切换完成状态
  const toggleTodo = (id: number) => {
    const newTodos = todos.map(todo => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    saveTodos(newTodos);
  };

  // 删除待办事项
  const deleteTodo = (id: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个待办事项吗？',
      success: (res) => {
        if (res.confirm) {
          const newTodos = todos.filter(todo => todo.id !== id);
          saveTodos(newTodos);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  // 获取未完成的事项
  const activeTodos = todos.filter(todo => !todo.completed);

  return (
    <View className="page">
      {/* 顶部统计卡片 */}
      <View className="header">
        <Text className="title">待办事项</Text>
        <View className="stats">
          <View className="stat-item">
            <Text className="stat-num">{stats.completed}</Text>
            <Text className="stat-label">已完成</Text>
          </View>
          <View className="stat-divider"></View>
          <View className="stat-item">
            <Text className="stat-num">{stats.total}</Text>
            <Text className="stat-label">总计</Text>
          </View>
          <View className="stat-divider"></View>
          <View className="stat-item">
            <Text className="stat-num">{stats.total - stats.completed}</Text>
            <Text className="stat-label">待完成</Text>
          </View>
        </View>
      </View>

      {/* 添加区域 */}
      <View className="add-section">
        <View className="add-box">
          <Input
            className="add-input"
            placeholder="输入新的待办事项..."
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={addTodo}
          />
          <Button className="add-btn" onClick={addTodo}>添加</Button>
        </View>
      </View>

      {/* 待办列表 */}
      <ScrollView className="content" scrollY>
        {activeTodos.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📝</Text>
            <Text className="empty-text">暂无待办事项</Text>
            <Text className="empty-hint">添加一个新的待办事项开始吧</Text>
          </View>
        ) : (
          <View className="todo-list">
            {activeTodos.map(todo => (
              <View className="todo-item" key={todo.id}>
                <View className="todo-content" onClick={() => toggleTodo(todo.id)}>
                  <View className={`checkbox ${todo.completed ? 'checked' : ''}`}>
                    {todo.completed && <Text className="check-icon">✓</Text>}
                  </View>
                  <Text className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                    {todo.text}
                  </Text>
                </View>
                <View className="todo-actions">
                  <Button 
                    className="action-btn complete-btn" 
                    onClick={() => toggleTodo(todo.id)}
                  >
                    ✓
                  </Button>
                  <Button 
                    className="action-btn delete-btn" 
                    onClick={() => deleteTodo(todo.id)}
                  >
                    ✕
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 底部提示 */}
      {activeTodos.length > 0 && (
        <View className="footer-tip">
          <Text>向左滑动或点击按钮操作</Text>
        </View>
      )}
    </View>
  );
}
