import { View, Text, Input, Button, Checkbox, SwipeAction } from '@tarojs/components';
import { useState, useEffect } from 'react';
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // 加载本地存储的数据
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (e) {
        console.error('Failed to parse todos:', e);
      }
    }
  }, []);

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // 添加待办
  const addTodo = () => {
    if (!inputValue.trim()) return;
    
    const newTodo: TodoItem = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    
    setTodos([newTodo, ...todos]);
    setInputValue('');
  };

  // 切换完成状态
  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  // 删除待办
  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 开始编辑
  const startEdit = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  // 保存编辑
  const saveEdit = (id: number) => {
    if (!editText.trim()) return;
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, text: editText.trim() } : todo
    ));
    setEditingId(null);
    setEditText('');
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <View className="page">
      {/* 头部 */}
      <View className="header">
        <Text className="title">待办事项</Text>
        <Text className="subtitle">{activeTodos.length} 项待完成</Text>
      </View>

      {/* 输入区域 */}
      <View className="input-section">
        <View className="input-wrapper">
          <Input 
            className="todo-input"
            placeholder="添加新的待办..."
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={addTodo}
          />
          <Button 
            className="add-btn"
            onClick={addTodo}
            disabled={!inputValue.trim()}
          >
            添加
          </Button>
        </View>
      </View>

      {/* 待办列表 */}
      <View className="todo-list">
        {activeTodos.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📝</Text>
            <Text className="empty-text">暂无待办事项</Text>
            <Text className="empty-hint">添加一个新的待办开始吧</Text>
          </View>
        ) : (
          activeTodos.map(todo => (
            <View key={todo.id} className="todo-item">
              {editingId === todo.id ? (
                <View className="edit-mode">
                  <Input 
                    className="edit-input"
                    value={editText}
                    onInput={(e) => setEditText(e.detail.value)}
                    onConfirm={() => saveEdit(todo.id)}
                    autoFocus
                  />
                  <View className="edit-actions">
                    <Text className="save-btn" onClick={() => saveEdit(todo.id)}>保存</Text>
                    <Text className="cancel-btn" onClick={cancelEdit}>取消</Text>
                  </View>
                </View>
              ) : (
                <>
                  <View className="checkbox-wrapper" onClick={() => toggleTodo(todo.id)}>
                    <View className="checkbox">
                      <View className="checkbox-inner"></View>
                    </View>
                  </View>
                  <View className="todo-content">
                    <Text className="todo-text">{todo.text}</Text>
                    <Text className="todo-date">{new Date(todo.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View className="todo-actions">
                    <Text className="edit-btn" onClick={() => startEdit(todo)}>编辑</Text>
                    <Text className="delete-btn" onClick={() => deleteTodo(todo.id)}>删除</Text>
                  </View>
                </>
              )}
            </View>
          ))
        )}

        {/* 已完成统计 */}
        {completedTodos.length > 0 && (
          <View className="completed-summary">
            <Text className="summary-icon">✅</Text>
            <Text className="summary-text">已完成 {completedTodos.length} 项</Text>
          </View>
        )}
      </View>
    </View>
  );
}
