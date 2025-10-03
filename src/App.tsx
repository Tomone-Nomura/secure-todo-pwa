import React, { useState, useEffect } from 'react';
import './App.css';

interface Todo {
  id: number;
  text: string;
  description: string;
  completed: boolean;
  category: '学校' | '仕事' | '個人' | 'その他';
  createdAt: Date;
}

type PrivacyLevel = 'minimal' | 'moderate' | 'full';
type LocationContext = '外出先' | '学校' | '職場' | '自宅';

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Todo['category']>('個人');
  const [filterCategory, setFilterCategory] = useState<'すべて' | Todo['category']>('すべて');
  
  // プライバシー関連の状態
  const [currentLocation, setCurrentLocation] = useState<LocationContext>('外出先');
  const [isPersonalMode, setIsPersonalMode] = useState(false);
  const [useAutoLocation, setUseAutoLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [showManualLocationSelect, setShowManualLocationSelect] = useState(false);
  
  // セキュリティ関連
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [hasSetPassword, setHasSetPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [authAction, setAuthAction] = useState<'personal' | 'manual' | ''>('');
  
  // 詳細表示の開閉を管理
  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const savedPassword = localStorage.getItem('appPassword');
    if (savedPassword) {
      setHasSetPassword(true);
    }
  }, []);

  // 認証処理
  const authenticate = (action: 'personal' | 'manual') => {
    setAuthAction(action);
    setShowPasswordDialog(true);
  };

  const authenticateWithPassword = () => {
    const savedPassword = localStorage.getItem('appPassword');
    
    if (!savedPassword && password) {
      localStorage.setItem('appPassword', password);
      setHasSetPassword(true);
      setIsAuthenticated(true);
      executeAuthAction(authAction);
      setShowPasswordDialog(false);
      setPassword('');
    } else if (savedPassword === password) {
      setIsAuthenticated(true);
      executeAuthAction(authAction);
      setShowPasswordDialog(false);
      setPassword('');
    } else {
      alert('パスワードが間違っています');
    }
  };

  const executeAuthAction = (action: string) => {
    if (action === 'personal') {
      setIsPersonalMode(true);
    } else if (action === 'manual') {
      setShowManualLocationSelect(true);
    }
  };

  const getPrivacyLevel = (): PrivacyLevel => {
    if (isPersonalMode || currentLocation === '自宅') return 'full';
    if (currentLocation === '学校' || currentLocation === '職場') return 'moderate';
    return 'minimal';
  };

  // 詳細の表示切り替え
  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedTodos);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTodos(newExpanded);
  };

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: input,
        description: description,
        completed: false,
        category: selectedCategory,
        createdAt: new Date()
      }]);
      setInput('');
      setDescription('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const getCategoryColor = (category: Todo['category']) => {
    switch(category) {
      case '学校': return '#ff6b6b';
      case '仕事': return '#4ecdc4';
      case '個人': return '#45b7d1';
      case 'その他': return '#96ceb4';
    }
  };

  const filteredTodos = filterCategory === 'すべて' 
    ? todos 
    : todos.filter(todo => todo.category === filterCategory);

  const getCategoryCounts = () => {
    const counts = {
      '学校': todos.filter(t => t.category === '学校').length,
      '仕事': todos.filter(t => t.category === '仕事').length,
      '個人': todos.filter(t => t.category === '個人').length,
      'その他': todos.filter(t => t.category === 'その他').length,
    };
    return counts;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>セキュアTODO</h1>
        
        {/* 位置情報コントロール */}
        <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#2a2f37', borderRadius: '8px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '20px' }}>
              <input
                type="checkbox"
                checked={useAutoLocation}
                onChange={(e) => setUseAutoLocation(e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              GPS自動取得
            </label>
            
            <button
              onClick={() => authenticate('manual')}
              style={{
                padding: '5px 10px',
                marginRight: '10px',
                backgroundColor: '#96ceb4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              手動設定
            </button>
            
            {showManualLocationSelect && (
              <select
                value={currentLocation}
                onChange={(e) => {
                  setCurrentLocation(e.target.value as LocationContext);
                  setShowManualLocationSelect(false);
                }}
                style={{ marginLeft: '10px', padding: '5px' }}
              >
                <option value="外出先">外出先</option>
                <option value="学校">学校</option>
                <option value="職場">職場</option>
                <option value="自宅">自宅</option>
              </select>
            )}
            
            <button
              onClick={() => {
                if (!isPersonalMode) {
                  authenticate('personal');
                } else {
                  setIsPersonalMode(false);
                }
              }}
              style={{
                padding: '5px 10px',
                backgroundColor: isPersonalMode ? '#ff6b6b' : '#4ecdc4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isPersonalMode ? '個人モード解除' : '個人モード'}
            </button>
          </div>
        </div>

        {/* プライバシーレベル表示 */}
        <div style={{ marginBottom: '20px', fontSize: '14px' }}>
          現在地: {currentLocation} | プライバシーレベル: {getPrivacyLevel()} 
          {isPersonalMode && ' 🔓'}
        </div>

        {/* フィルター */}
        <div style={{ margin: '20px 0' }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            style={{
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px'
            }}
          >
            <option value="すべて">すべて表示</option>
            <option value="学校">学校のみ</option>
            <option value="仕事">仕事のみ</option>
            <option value="個人">個人のみ</option>
            <option value="その他">その他のみ</option>
          </select>
        </div>

        {/* タスク入力エリア */}
        <div style={{ margin: '20px 0', maxWidth: '600px' }}>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Todo['category'])}
              style={{
                padding: '10px',
                fontSize: '16px',
                borderRadius: '4px',
                marginRight: '10px',
                backgroundColor: getCategoryColor(selectedCategory),
                color: 'white',
                border: 'none'
              }}
            >
              <option value="学校">学校</option>
              <option value="仕事">仕事</option>
              <option value="個人">個人</option>
              <option value="その他">その他</option>
            </select>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && addTodo()}
              placeholder="タスク名"
              style={{
                padding: '10px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                flex: 1
              }}
            />
          </div>
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="詳細（任意）"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              marginBottom: '10px',
              minHeight: '60px',
              resize: 'vertical'
            }}
          />
          
          <button
            onClick={addTodo}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#61dafb',
              color: '#282c34',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            追加
          </button>
        </div>

        {/* タスクリスト表示 */}
        <div style={{ minHeight: '300px', width: '100%', maxWidth: '600px' }}>
          {getPrivacyLevel() === 'minimal' ? (
            <div style={{ padding: '20px', backgroundColor: '#3a3f47', borderRadius: '8px' }}>
              <h3>タスク概要</h3>
              {Object.entries(getCategoryCounts()).map(([category, count]) => (
                count > 0 && (
                  <div key={category} style={{ margin: '10px 0' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: getCategoryColor(category as Todo['category']),
                      color: 'white',
                      marginRight: '10px'
                    }}>
                      {category}
                    </span>
                    {count}件
                  </div>
                )
              ))}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {filteredTodos.map(todo => {
                const shouldShowDetails = 
                  getPrivacyLevel() === 'full' || 
                  (getPrivacyLevel() === 'moderate' && 
                    ((currentLocation === '学校' && todo.category === '学校') ||
                     (currentLocation === '職場' && todo.category === '仕事')));

                return (
                  <li key={todo.id} style={{
                    margin: '10px 0',
                    padding: '10px',
                    backgroundColor: '#3a3f47',
                    borderRadius: '4px',
                    borderLeft: `5px solid ${getCategoryColor(todo.category)}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        style={{ marginRight: '10px' }}
                      />
                      
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: getCategoryColor(todo.category),
                        color: 'white',
                        fontSize: '12px',
                        marginRight: '10px'
                      }}>
                        {todo.category}
                      </span>
                      
                      <div style={{ 
                        flex: 1,
                        textDecoration: todo.completed ? 'line-through' : 'none',
                        opacity: todo.completed ? 0.6 : 1
                      }}>
                        {shouldShowDetails ? todo.text : `${todo.category}のタスク`}
                      </div>

                      {/* 詳細表示ボタン */}
                      {shouldShowDetails && todo.description && (
                        <button
                          onClick={() => toggleExpanded(todo.id)}
                          style={{
                            padding: '5px 10px',
                            marginRight: '10px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {expandedTodos.has(todo.id) ? '詳細を隠す' : '詳細'}
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        削除
                      </button>
                    </div>
                    
                    {/* 折りたたみ式の詳細表示 */}
                    {shouldShowDetails && expandedTodos.has(todo.id) && todo.description && (
                      <div style={{ 
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: '#2a2f37',
                        borderRadius: '4px',
                        fontSize: '14px',
                        whiteSpace: 'pre-wrap',  // 改行を保持
                        lineHeight: '1.5'
                      }}>
                        {todo.description}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          
          {/* 統計情報 */}
          <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.8 }}>
            全タスク: {todos.length} | 
            完了: {todos.filter(t => t.completed).length} | 
            未完了: {todos.filter(t => !t.completed).length}
          </div>
        </div>

        {/* パスワードダイアログ */}
        {showPasswordDialog && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#2a2f37',
            padding: '20px',
            borderRadius: '8px',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            <h3>{hasSetPassword ? 'パスワード入力' : 'パスワード設定'}</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && authenticateWithPassword()}
              placeholder={hasSetPassword ? 'パスワード' : '新しいパスワード'}
              style={{ 
                padding: '10px', 
                fontSize: '16px', 
                width: '200px',
                marginBottom: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
            <div style={{ marginTop: '10px' }}>
              <button 
                onClick={authenticateWithPassword}
                style={{
                  padding: '8px 16px',
                  marginRight: '10px',
                  backgroundColor: '#4ecdc4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                OK
              </button>
              <button 
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPassword('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;