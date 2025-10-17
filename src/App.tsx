import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// 型定義
interface Todo {
  id: number;
  title: string;
  detail: string;
  category: '個人' | '学校' | '仕事' | 'その他';
  createdAt: string;
  showDetail?: boolean;
}

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: 'home' | 'school' | 'work';
}

type LocationStatus = 'home' | 'school' | 'work' | 'outside';
type PageType = 'main' | 'add-task' | 'locations' | 'account' | 'settings';

// ヘルパー関数：Haversine式で距離計算
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('main');
  const [menuOpen, setMenuOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputTitle, setInputTitle] = useState('');
  const [inputDetail, setInputDetail] = useState('');
  const [category, setCategory] = useState<Todo['category']>('その他');
  const [editingTodo, setEditingTodo] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDetail, setEditDetail] = useState('');
  const [editCategory, setEditCategory] = useState<Todo['category']>('その他');
  
  // 生体認証・プライベートモード関連
  const [privateMode, setPrivateMode] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  
  // 位置情報関連
  const [registeredLocations, setRegisteredLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('outside');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState<Location['type']>('home');
  const [newLocationRadius, setNewLocationRadius] = useState(150);
  const [debugMode, setDebugMode] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // LocalStorage から読み込み
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    const savedBiometric = localStorage.getItem('biometricEnabled');
    const savedLocations = localStorage.getItem('locations');

    if (savedTodos) setTodos(JSON.parse(savedTodos));
    if (savedBiometric) setBiometricEnabled(JSON.parse(savedBiometric));
    if (savedLocations) {
      setRegisteredLocations(JSON.parse(savedLocations));
    } else {
      // デフォルトでJAISTを学校として追加
      const jaist: Location = {
        id: Date.now(),
        name: 'JAIST（北陸先端科学技術大学院大学）',
        latitude: 36.4507,
        longitude: 136.5933,
        radius: 200,
        type: 'school'
      };
      setRegisteredLocations([jaist]);
      localStorage.setItem('locations', JSON.stringify([jaist]));
    }
  }, []);

  // データをLocalStorageに保存
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem('todos', JSON.stringify(todos));
    }
  }, [todos]);

  useEffect(() => {
    if (registeredLocations.length > 0) {
      localStorage.setItem('locations', JSON.stringify(registeredLocations));
    }
  }, [registeredLocations]);

  useEffect(() => {
    localStorage.setItem('biometricEnabled', JSON.stringify(biometricEnabled));
  }, [biometricEnabled]);

  // 生体認証の実行
  const performBiometricAuth = async (action: string = 'authenticate'): Promise<boolean> => {
    if (!('credentials' in navigator)) {
      alert('このブラウザは生体認証に対応していません');
      return false;
    }

    setAuthenticating(true);
    try {
      // Web Authentication APIのシミュレーション
      // 実際の実装では、適切なWebAuthn実装が必要
      const result = window.confirm(`${action}のために生体認証を実行しますか？\n（これはシミュレーションです）`);
      
      if (result) {
        // 実際の実装では、ここでWebAuthn APIを使用
        console.log('生体認証成功');
        return true;
      }
      return false;
    } catch (error) {
      console.error('生体認証エラー:', error);
      return false;
    } finally {
      setAuthenticating(false);
    }
  };

  // 生体認証を有効化
  const enableBiometric = async () => {
    const success = await performBiometricAuth('生体認証を設定');
    if (success) {
      setBiometricEnabled(true);
      alert('生体認証を有効化しました');
    }
  };

  // プライベートモードの切り替え
  const togglePrivateMode = async () => {
    if (!privateMode) {
      if (biometricEnabled) {
        const success = await performBiometricAuth('プライベートモードを有効化');
        if (success) {
          setPrivateMode(true);
        }
      } else {
        alert('先に生体認証を設定してください');
        setCurrentPage('settings');
      }
    } else {
      setPrivateMode(false);
    }
  };

  // TODO追加
  const addTodo = () => {
    if (inputTitle.trim()) {
      const newTodo: Todo = {
        id: Date.now(),
        title: inputTitle,
        detail: inputDetail,
        category,
        createdAt: new Date().toISOString(),
        showDetail: false
      };
      setTodos([...todos, newTodo]);
      setInputTitle('');
      setInputDetail('');
      alert('タスクを追加しました');
      setCurrentPage('main');
    }
  };

  // TODO編集開始
  const startEdit = (todo: Todo) => {
    setEditingTodo(todo.id);
    setEditTitle(todo.title);
    setEditDetail(todo.detail);
    setEditCategory(todo.category);
  };

  // TODO編集確定
  const saveEdit = () => {
    if (editTitle.trim() && editingTodo) {
      setTodos(todos.map(todo => 
        todo.id === editingTodo 
          ? { ...todo, title: editTitle, detail: editDetail, category: editCategory }
          : todo
      ));
      setEditingTodo(null);
      setEditTitle('');
      setEditDetail('');
    }
  };

  // TODO削除
  const deleteTodo = (id: number) => {
    if (window.confirm('このタスクを削除しますか？')) {
      setTodos(todos.filter(todo => todo.id !== id));
    }
  };

  // 詳細表示切り替え
  const toggleDetail = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, showDetail: !todo.showDetail } : todo
    ));
  };

  // タスクが表示可能かチェック
  const isTaskVisible = (todo: Todo): boolean => {
    if (privateMode) return true;

    switch (locationStatus) {
      case 'home':
        return true;
      case 'school':
        return todo.category === '学校' || todo.category === 'その他';
      case 'work':
        return todo.category === '仕事' || todo.category === 'その他';
      case 'outside':
        return todo.category === 'その他';
      default:
        return todo.category === 'その他';
    }
  };

  // 非表示タスク数を計算
  const getHiddenTasksCount = () => {
    const counts: { [key: string]: number } = {
      '個人': 0,
      '学校': 0,
      '仕事': 0,
      'その他': 0
    };

    todos.forEach(todo => {
      if (!isTaskVisible(todo)) {
        counts[todo.category]++;
      }
    });

    return counts;
  };

  // 位置情報の更新処理
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    setCurrentLocation({ lat: latitude, lon: longitude });
    setGpsAccuracy(accuracy);

    let status: LocationStatus = 'outside';
    for (const loc of registeredLocations) {
      const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
      if (distance <= loc.radius) {
        status = loc.type as LocationStatus;
        break;
      }
    }
    setLocationStatus(status);
  }, [registeredLocations]);

  // 位置情報の監視を開始
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        (error) => {
          console.error('位置情報の取得に失敗:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [handlePositionUpdate]);

  // 現在地を場所として登録（認証必要）
  const registerCurrentLocation = async () => {
    if (!currentLocation || !newLocationName) {
      alert('場所の名前を入力してください');
      return;
    }

    if (biometricEnabled) {
      const success = await performBiometricAuth('場所を登録');
      if (!success) return;
    } else {
      alert('先に生体認証を設定してください');
      setCurrentPage('settings');
      return;
    }

    const newLocation: Location = {
      id: Date.now(),
      name: newLocationName,
      latitude: currentLocation.lat,
      longitude: currentLocation.lon,
      radius: newLocationRadius,
      type: newLocationType
    };
    setRegisteredLocations([...registeredLocations, newLocation]);
    setNewLocationName('');
    setNewLocationRadius(150);
    alert(`${newLocationName}を登録しました`);
  };

  // 場所を削除（認証必要）
  const deleteLocation = async (id: number) => {
    if (biometricEnabled) {
      const success = await performBiometricAuth('場所を削除');
      if (!success) return;
    } else {
      alert('先に生体認証を設定してください');
      setCurrentPage('settings');
      return;
    }

    setRegisteredLocations(registeredLocations.filter(loc => loc.id !== id));
    alert('場所を削除しました');
  };

  // 位置ステータステキスト
  const getLocationStatusText = () => {
    switch (locationStatus) {
      case 'home': return '自宅';
      case 'school': return '学校';
      case 'work': return '仕事場';
      case 'outside': return '外出中';
      default: return '外出中';
    }
  };

  const hiddenCounts = getHiddenTasksCount();
  const hasHiddenTasks = Object.values(hiddenCounts).some(count => count > 0);

  return (
    <div className="App">
      {/* ハンバーガーメニュー - 左上に配置 */}
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="メニュー">
        <span className="menu-icon"></span>
        <span className="menu-icon"></span>
        <span className="menu-icon"></span>
      </button>

      {/* サイドメニュー */}
      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <button className="close-menu" onClick={() => setMenuOpen(false)}>×</button>
        </div>
        <nav className="menu-nav">
          <button 
            className={currentPage === 'main' ? 'active' : ''} 
            onClick={() => {setCurrentPage('main'); setMenuOpen(false)}}
          >
            タスク一覧
          </button>
          <button 
            className={currentPage === 'add-task' ? 'active' : ''} 
            onClick={() => {setCurrentPage('add-task'); setMenuOpen(false)}}
          >
            タスク追加
          </button>
          <button 
            className={currentPage === 'locations' ? 'active' : ''} 
            onClick={() => {setCurrentPage('locations'); setMenuOpen(false)}}
          >
            位置情報管理
          </button>
          <button 
            className={currentPage === 'account' ? 'active' : ''} 
            onClick={() => {setCurrentPage('account'); setMenuOpen(false)}}
          >
            アカウント
          </button>
          <button 
            className={currentPage === 'settings' ? 'active' : ''} 
            onClick={() => {setCurrentPage('settings'); setMenuOpen(false)}}
          >
            設定
          </button>
        </nav>
      </div>

      {/* メインコンテンツ */}
      <div className="main-content">
        <header className="App-header">
          <h1>Secure TODO PWA</h1>
          
          {/* ステータスバー */}
          <div className="status-bar">
            <span className="location-status">📍 {getLocationStatusText()}</span>
            {privateMode && <span className="private-mode-badge">🔓 プライベートモード</span>}
            <button onClick={() => setDebugMode(!debugMode)} className="debug-toggle">
              GPS表示
            </button>
          </div>

          {/* GPS情報 */}
          {debugMode && currentLocation && (
            <div className="debug-info">
              <h4>GPS情報</h4>
              <p>緯度: {currentLocation.lat.toFixed(6)}</p>
              <p>経度: {currentLocation.lon.toFixed(6)}</p>
              <p>精度: {gpsAccuracy ? `${gpsAccuracy.toFixed(1)}m` : '不明'}</p>
              <p>ステータス: {locationStatus}</p>
            </div>
          )}

          {/* プライベートモードボタン */}
          <button onClick={togglePrivateMode} className="private-mode-btn">
            {privateMode ? '🔓 プライベートモード解除' : '🔒 プライベートモード'}
          </button>

          {/* ページコンテンツ */}
          {currentPage === 'main' && (
            <div className="page-content">
              {/* 非表示タスク数 */}
              {hasHiddenTasks && !privateMode && (
                <div className="hidden-tasks-info">
                  <h4>表示されていないタスク:</h4>
                  {Object.entries(hiddenCounts).map(([cat, count]) => 
                    count > 0 && (
                      <span key={cat} className="hidden-count">
                        {cat}: {count}件
                      </span>
                    )
                  )}
                </div>
              )}

              {/* タスク一覧 */}
              <div className="todo-list">
                {todos.filter(isTaskVisible).map(todo => {
                  const isEditing = editingTodo === todo.id;
                  
                  if (isEditing) {
                    return (
                      <div key={todo.id} className="todo-item todo-editing">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="タスク名"
                          className="edit-input"
                        />
                        <textarea
                          value={editDetail}
                          onChange={(e) => setEditDetail(e.target.value)}
                          placeholder="詳細"
                          className="edit-textarea"
                          rows={2}
                        />
                        <select 
                          value={editCategory} 
                          onChange={(e) => setEditCategory(e.target.value as Todo['category'])}
                          className="edit-select"
                        >
                          <option value="個人">個人</option>
                          <option value="学校">学校</option>
                          <option value="仕事">仕事</option>
                          <option value="その他">その他</option>
                        </select>
                        <button onClick={saveEdit} className="btn-save">保存</button>
                        <button onClick={() => setEditingTodo(null)} className="btn-cancel">キャンセル</button>
                      </div>
                    );
                  }

                  return (
                    <div key={todo.id} className={`todo-item category-${todo.category}`}>
                      <div className="todo-main">
                        <span className="todo-title">
                          [{todo.category}] {todo.title}
                        </span>
                        <div className="todo-actions">
                          {todo.detail && (
                            <button 
                              onClick={() => toggleDetail(todo.id)} 
                              className="btn-detail"
                            >
                              {todo.showDetail ? '詳細を隠す' : '詳細'}
                            </button>
                          )}
                          <button onClick={() => startEdit(todo)} className="btn-edit">編集</button>
                          <button onClick={() => deleteTodo(todo.id)} className="btn-delete">削除</button>
                        </div>
                      </div>
                      {todo.showDetail && todo.detail && (
                        <div className="todo-detail">
                          {todo.detail}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentPage === 'add-task' && (
            <div className="page-content">
              <h2>タスク追加</h2>
              <div className="todo-input">
                <input
                  type="text"
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                  placeholder="タスク名を入力..."
                />
                <textarea
                  value={inputDetail}
                  onChange={(e) => setInputDetail(e.target.value)}
                  placeholder="詳細（任意）"
                  rows={3}
                />
                <select value={category} onChange={(e) => setCategory(e.target.value as Todo['category'])}>
                  <option value="個人">個人</option>
                  <option value="学校">学校</option>
                  <option value="仕事">仕事</option>
                  <option value="その他">その他</option>
                </select>
                <button onClick={addTodo} className="btn-add">追加</button>
              </div>
            </div>
          )}

          {currentPage === 'locations' && (
            <div className="page-content">
              <h2>位置情報管理</h2>
              
              {currentLocation && (
                <div className="location-form">
                  <h3>現在地を登録</h3>
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="場所の名前"
                  />
                  <select
                    value={newLocationType}
                    onChange={(e) => setNewLocationType(e.target.value as Location['type'])}
                  >
                    <option value="home">自宅</option>
                    <option value="school">学校</option>
                    <option value="work">仕事場</option>
                  </select>
                  <input
                    type="number"
                    value={newLocationRadius}
                    onChange={(e) => setNewLocationRadius(Number(e.target.value))}
                    placeholder="半径（メートル）"
                    min="50"
                    max="500"
                  />
                  <button onClick={registerCurrentLocation}>登録（要認証）</button>
                </div>
              )}

              <div className="registered-locations">
                <h3>登録済みの場所</h3>
                {registeredLocations.map(loc => (
                  <div key={loc.id} className="location-item">
                    <span>
                      {loc.name} ({loc.type === 'home' ? '自宅' : loc.type === 'school' ? '学校' : '仕事場'}) 
                      - 半径{loc.radius}m
                    </span>
                    <button onClick={() => deleteLocation(loc.id)} className="btn-delete">
                      削除（要認証）
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentPage === 'account' && (
            <div className="page-content">
              <h2>アカウント</h2>
              <div className="account-info">
                <p>将来的にアカウント機能を実装予定</p>
                <p>ユーザー名: ゲスト</p>
                <p>メールアドレス: 未設定</p>
                <p>プラン: フリープラン</p>
              </div>
            </div>
          )}

          {currentPage === 'settings' && (
            <div className="page-content">
              <h2>設定</h2>
              <div className="settings-section">
                <h3>生体認証</h3>
                {!biometricEnabled ? (
                  <button onClick={enableBiometric} className="btn-primary">
                    生体認証を有効にする
                  </button>
                ) : (
                  <p>✅ 生体認証が有効です</p>
                )}
                <p className="note">
                  注：現在はシミュレーション機能です。
                  実際の実装にはWebAuthn APIが必要です。
                </p>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* メニューオーバーレイ */}
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default App;