import { View, Text, Input, Textarea, Button, Picker, Radio, RadioGroup } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

// 优先级选项
const priorityOptions = [
  { label: '低', value: 'low', color: '#4cd964' },
  { label: '中', value: 'medium', color: '#ff9500' },
  { label: '高', value: 'high', color: '#ff3b30' }
];

// 截止日期选项
const dateOptions = [
  { label: '今天', value: 'today' },
  { label: '明天', value: 'tomorrow' },
  { label: '本周内', value: 'this_week' },
  { label: '自定义', value: 'custom' }
];

export default function AddPage() {
  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDateType, setDueDateType] = useState('today');
  const [customDate, setCustomDate] = useState('');
  
  // 计算实际截止日期
  const getDueDate = () => {
    const now = new Date();
    
    switch (dueDateType) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime(); // 今天结束
      case 'tomorrow':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime(); // 明天
      case 'this_week':
        // 本周日
        const day = now.getDay();
        const diff = day === 0 ? 0 : 7 - day; // 0是周日
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff).getTime();
      case 'custom':
        return customDate ? new Date(customDate).getTime() : null;
      default:
        return null;
    }
  };
  
  // 日期选择器变化
  const handleDatePickerChange = (e) => {
    setCustomDate(e.detail.value);
  };
  
  // 加载现有任务列表
  const [existingTodos, setExistingTodos] = useState([]);
  
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const storageResult = await Taro.getStorage({ key: 'todos' });
        if (storageResult.data) {
          setExistingTodos(storageResult.data);
        }
      } catch (error) {
        console.log('无本地存储数据');
      }
    };
    
    loadTodos();
  }, []);
  
  // 处理表单提交
  const handleSubmit = async () => {
    if (!title.trim()) {
      Taro.showToast({
        title: '请输入任务标题',
        icon: 'none'
      });
      return;
    }
    
    // 获取选择的优先级颜色
    const selectedPriority = priorityOptions.find(p => p.value === priority);
    
    const newTodo = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      priority: priority,
      priorityColor: selectedPriority?.color || '#ff9500',
      dueDate: getDueDate(),
      completed: false,
      createdAt: Date.now()
    };
    
    // 更新任务列表
    const updatedTodos = [newTodo, ...existingTodos];
    
    try {
      await Taro.setStorage({
        key: 'todos',
        data: updatedTodos
      });
      
      Taro.showToast({
        title: '添加成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          // 延迟跳转，让用户看到成功提示
          setTimeout(() => {
            // 重置表单
            setTitle('');
            setDescription('');
            setPriority('medium');
            setDueDateType('today');
            setCustomDate('');
            
            // 跳转到首页
            Taro.switchTab({
              url: '/pages/index/index'
            });
          }, 1500);
        }
      });
    } catch (error) {
      Taro.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
      console.error('保存失败:', error);
    }
  };
  
  // 重置表单
  const handleReset = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDateType('today');
    setCustomDate('');
  };
  
  // 返回首页
  const goToHome = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    });
  };
  
  // 格式化日期显示
  const formatDueDate = () => {
    const dueDate = getDueDate();
    if (!dueDate) return '未设置';
    
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <View className="add-container">
      {/* 头部 */}
      <View className="header">
        <Text className="title">添加新任务</Text>
        <Text className="subtitle">详细设置，让任务管理更轻松</Text>
      </View>
      
      {/* 表单区域 */}
      <View className="form">
        {/* 任务标题 */}
        <View className="form-group">
          <Text className="form-label required">任务标题</Text>
          <Input
            className="form-input"
            placeholder="请输入任务标题"
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={50}
          />
          <Text className="form-hint">简洁明了，不超过50字</Text>
        </View>
        
        {/* 任务描述 */}
        <View className="form-group">
          <Text className="form-label">任务描述</Text>
          <Textarea
            className="form-textarea"
            placeholder="详细描述任务内容、要求等（可选）"
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={200}
            autoHeight
          />
          <Text className="form-hint">可选，不超过200字</Text>
        </View>
        
        {/* 优先级 */}
        <View className="form-group">
          <Text className="form-label">优先级</Text>
          <View className="priority-options">
            {priorityOptions.map(option => (
              <View 
                key={option.value}
                className={`priority-option ${priority === option.value ? 'active' : ''}`}
                style={{
                  borderColor: priority === option.value ? option.color : '#e1e5e9',
                  backgroundColor: priority === option.value ? `${option.color}15` : '#fff'
                }}
                onClick={() => setPriority(option.value)}
              >
                <View 
                  className="priority-dot" 
                  style={{ backgroundColor: option.color }}
                />
                <Text 
                  className="priority-label"
                  style={{ color: priority === option.value ? option.color : '#333' }}
                >
                  {option.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* 截止日期 */}
        <View className="form-group">
          <Text className="form-label">截止日期</Text>
          <View className="date-options">
            {dateOptions.map(option => (
              <View 
                key={option.value}
                className={`date-option ${dueDateType === option.value ? 'active' : ''}`}
                onClick={() => setDueDateType(option.value)}
              >
                <Text className="date-label">{option.label}</Text>
              </View>
            ))}
          </View>
          
          {/* 自定义日期选择器 */}
          {dueDateType === 'custom' && (
            <View className="custom-date-picker">
              <Picker 
                mode="date" 
                value={customDate} 
                onChange={handleDatePickerChange}
                start={new Date().toISOString().split('T')[0]}
              >
                <View className="date-picker-btn">
                  <Text className="date-picker-text">
                    {customDate || '选择日期'}
                  </Text>
                  <Text className="date-picker-icon">📅</Text>
                </View>
              </Picker>
            </View>
          )}
          
          {/* 截止日期预览 */}
          <View className="due-date-preview">
            <Text className="preview-label">截止时间：</Text>
            <Text className="preview-value">{formatDueDate()}</Text>
          </View>
        </View>
        
        {/* 统计信息 */}
        <View className="stats-preview">
          <View className="stat-item">
            <Text className="stat-label">总任务数</Text>
            <Text className="stat-value">{existingTodos.length}</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-label">进行中</Text>
            <Text className="stat-value">
              {existingTodos.filter(todo => !todo.completed).length}
            </Text>
          </View>
          <View className="stat-item">
            <Text className="stat-label">已完成</Text>
            <Text className="stat-value">
              {existingTodos.filter(todo => todo.completed).length}
            </Text>
          </View>
        </View>
      </View>
      
      {/* 操作按钮 */}
      <View className="action-buttons">
        <Button className="action-btn cancel-btn" onClick={goToHome}>
          取消
        </Button>
        <Button className="action-btn reset-btn" onClick={handleReset}>
          重置
        </Button>
        <Button className="action-btn submit-btn" onClick={handleSubmit}>
          添加任务
        </Button>
      </View>
      
      {/* 底部提示 */}
      <View className="footer">
        <Text className="footer-text">
          提示：任务数据将自动保存到本地存储，无需担心丢失
        </Text>
      </View>
    </View>
  );
}