import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import { setCookie, getCookie } from '../utils/cookies';

export default function Home() {
  // 游戏状态
  const [gameSize, setGameSize] = useState(15); // 默认15x15格子
  const [speed, setSpeed] = useState(150); // 默认速度，值越小越快
  const [snake, setSnake] = useState([{ x: 7, y: 7 }]); // 蛇的初始位置
  const [food, setFood] = useState({ x: 3, y: 3 }); // 食物的初始位置
  const [direction, setDirection] = useState('RIGHT'); // 初始方向
  const [gameOver, setGameOver] = useState(false); // 游戏结束状态
  const [score, setScore] = useState(0); // 分数
  const [isPaused, setIsPaused] = useState(false); // 暂停状态
  const [showSettings, setShowSettings] = useState(false); // 设置面板显示状态
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 }); // 触摸开始位置
  const [gameTime, setGameTime] = useState(0); // 游戏时间（秒）
  const [gameStartTime, setGameStartTime] = useState(null); // 游戏开始时间
  const [debugInfo, setDebugInfo] = useState({ lastKey: '', lastTouch: '', hasFocus: false }); // 调试信息
  const [showDebug, setShowDebug] = useState(false); // 是否显示调试信息
  
  const gameAreaRef = useRef(null);
  const gameLoopRef = useRef(null);

  // 响应式调整游戏区域大小
  useEffect(() => {
    const handleResize = () => {
      if (gameAreaRef.current) {
        const isMobile = window.innerWidth <= 768;
        const size = isMobile 
          ? Math.min(window.innerWidth - 40, window.innerHeight - 200) 
          : Math.min(window.innerWidth * 0.6, window.innerHeight - 150);
        
        gameAreaRef.current.style.width = `${size}px`;
        gameAreaRef.current.style.height = `${size}px`;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 生成随机食物位置
  const generateFood = () => {
    const newFood = {
      x: Math.floor(Math.random() * gameSize),
      y: Math.floor(Math.random() * gameSize)
    };

    // 确保食物不会出现在蛇身上
    if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      return generateFood();
    }

    return newFood;
  };

  // 游戏初始化
  useEffect(() => {
    resetGame();
  }, [gameSize]);
  
  // 添加game-active类到body，防止移动设备上的滚动问题
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('game-active');
      
      return () => {
        document.body.classList.remove('game-active');
      };
    }
  }, []);
  
  // 确保游戏区域获得焦点，以便键盘事件能被正确捕获
  useEffect(() => {
    if (gameAreaRef.current) {
      gameAreaRef.current.focus();
    }
  }, []);
  
  // 在游戏重置时也确保游戏区域获得焦点
  useEffect(() => {
    if (!gameOver && gameAreaRef.current) {
      gameAreaRef.current.focus();
    }
  }, [gameOver]);
  
  // 在游戏活动时给body添加game-active类，防止移动设备上的滚动问题
  useEffect(() => {
    document.body.classList.add('game-active');
    
    return () => {
      document.body.classList.remove('game-active');
    };
  }, []);
  
  // 游戏时间计时器
  useEffect(() => {
    let timer;
    if (!gameOver && !isPaused && gameStartTime) {
      timer = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
        setGameTime(elapsedSeconds);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameOver, isPaused, gameStartTime]);

  // 重置游戏
  const resetGame = () => {
    setSnake([{ x: Math.floor(gameSize / 2), y: Math.floor(gameSize / 2) }]);
    setFood(generateFood());
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setGameTime(0);
    setGameStartTime(Date.now());
    
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    gameLoopRef.current = setInterval(moveSnake, speed);
    
    // 确保游戏区域获得焦点
    setTimeout(() => {
      if (gameAreaRef.current) {
        gameAreaRef.current.focus();
      }
    }, 100);
  };

  // 游戏主循环
  const moveSnake = () => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      // 获取蛇头位置
      const head = { ...prevSnake[0] };
      
      // 根据方向移动蛇头
      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
        default:
          break;
      }

      // 检查是否撞墙
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= gameSize ||
        head.y >= gameSize
      ) {
        setGameOver(true);
        clearInterval(gameLoopRef.current);
        return prevSnake;
      }

      // 检查是否撞到自己
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        clearInterval(gameLoopRef.current);
        return prevSnake;
      }

      // 创建新的蛇身
      const newSnake = [head, ...prevSnake];
      
      // 检查是否吃到食物
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 1;
        setScore(newScore);
        setFood(generateFood());
      } else {
        // 如果没吃到食物，移除尾部
        newSnake.pop();
      }

      return newSnake;
    });
  };

  // 更新游戏速度
  useEffect(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    if (!gameOver) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [speed, gameOver]);
  
  // 游戏结束时保存记录
  useEffect(() => {
    if (gameOver && score > 0) {
      const timestamp = new Date().toISOString();
      const gameRecord = {
        score,
        time: gameTime,
        date: timestamp
      };
      
      // 从Cookie中获取现有记录
      const existingRecords = getCookie('snakeGameRecords') || '[]';
      const records = JSON.parse(existingRecords);
      
      // 添加新记录
      records.push(gameRecord);
      
      // 只保留最近的10条记录
      const limitedRecords = records.slice(-10);
      
      // 保存回Cookie
      setCookie('snakeGameRecords', JSON.stringify(limitedRecords), 30); // 保存30天
    }
  }, [gameOver, score, gameTime]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 更新调试信息
      setDebugInfo(prev => ({
        ...prev,
        lastKey: `${e.key} (code: ${e.keyCode})`,
        hasFocus: document.activeElement === gameAreaRef.current
      }));
      
      // 检测特殊组合键（Ctrl+D）切换调试模式
      if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setShowDebug(prev => !prev);
        return;
      }
      
      // 始终阻止游戏控制按键的默认行为
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', ' '].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation(); // 阻止事件冒泡
      }
      
      // 即使游戏结束，也允许空格键重新开始游戏
      if (e.key === ' ') {
        if (gameOver) {
          resetGame();
          return;
        } else {
          setIsPaused(prev => !prev);
          return;
        }
      }
      
      if (gameOver || isPaused) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        default:
          break;
      }
    };

    // 添加键盘事件监听到window对象，确保全局捕获
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    if (gameAreaRef.current) {
      gameAreaRef.current.addEventListener('keydown', handleKeyDown, { capture: true });
    }
    
    // 添加焦点变化监听
    const handleFocusChange = () => {
      setDebugInfo(prev => ({
        ...prev,
        hasFocus: document.activeElement === gameAreaRef.current
      }));
    };
    
    document.addEventListener('focusin', handleFocusChange);
    document.addEventListener('focusout', handleFocusChange);
    
    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (gameAreaRef.current) {
        gameAreaRef.current.removeEventListener('keydown', handleKeyDown, { capture: true });
      }
      document.removeEventListener('focusin', handleFocusChange);
      document.removeEventListener('focusout', handleFocusChange);
    };
  }, [direction, gameOver, isPaused, resetGame, setShowDebug]);

  // 触摸控制（移动设备）
  const handleTouchStart = (e) => {
    // 始终阻止默认行为，防止滚动
    e.preventDefault();
    e.stopPropagation();
    
    // 更新调试信息
    setDebugInfo(prev => ({
      ...prev,
      lastTouch: `start: (${e.touches[0]?.clientX || 'none'}, ${e.touches[0]?.clientY || 'none'})`,
      hasFocus: document.activeElement === gameAreaRef.current
    }));
    
    // 如果游戏结束或暂停，则不处理
    if (gameOver) {
      // 如果游戏结束，点击重新开始
      resetGame();
      return;
    }
    
    if (isPaused) {
      setIsPaused(false);
      return;
    }
    
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
    
    // 确保游戏区域获得焦点
    if (gameAreaRef.current) {
      gameAreaRef.current.focus();
    }
  };

  const handleTouchMove = (e) => {
    // 始终阻止默认行为，防止滚动
    e.preventDefault();
    e.stopPropagation();
    
    // 更新调试信息
    setDebugInfo(prev => ({
      ...prev,
      lastTouch: `move: (${e.touches[0]?.clientX || 'none'}, ${e.touches[0]?.clientY || 'none'})`,
      hasFocus: document.activeElement === gameAreaRef.current
    }));
    
    // 如果没有起始触摸点或游戏结束或暂停，则不处理
    if (!touchStart || gameOver || isPaused) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // 确定主要的移动方向，降低灵敏度阈值以提高响应性
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平移动
      if (deltaX > 20 && direction !== 'LEFT') {
        setDirection('RIGHT');
        // 更新触摸起点，使连续滑动更流畅
        setTouchStart({
          x: touch.clientX,
          y: touch.clientY
        });
      } else if (deltaX < -20 && direction !== 'RIGHT') {
        setDirection('LEFT');
        // 更新触摸起点，使连续滑动更流畅
        setTouchStart({
          x: touch.clientX,
          y: touch.clientY
        });
      }
    } else {
      // 垂直移动
      if (deltaY > 20 && direction !== 'UP') {
        setDirection('DOWN');
        // 更新触摸起点，使连续滑动更流畅
        setTouchStart({
          x: touch.clientX,
          y: touch.clientY
        });
      } else if (deltaY < -20 && direction !== 'DOWN') {
        setDirection('UP');
        // 更新触摸起点，使连续滑动更流畅
        setTouchStart({
          x: touch.clientX,
          y: touch.clientY
        });
      }
    }
  };

  const handleTouchEnd = (e) => {
    // 阻止默认行为
    e.preventDefault();
    e.stopPropagation();
    
    // 更新调试信息
    setDebugInfo(prev => ({
      ...prev,
      lastTouch: `end: (${e.changedTouches[0]?.clientX || 'none'}, ${e.changedTouches[0]?.clientY || 'none'})`,
      hasFocus: document.activeElement === gameAreaRef.current
    }));
    
    setTouchStart(null);
  };

  // 方向按钮控制
  const handleDirectionClick = (newDirection) => {
    if (gameOver) return;
    
    switch (newDirection) {
      case 'UP':
        if (direction !== 'DOWN') setDirection('UP');
        break;
      case 'DOWN':
        if (direction !== 'UP') setDirection('DOWN');
        break;
      case 'LEFT':
        if (direction !== 'RIGHT') setDirection('LEFT');
        break;
      case 'RIGHT':
        if (direction !== 'LEFT') setDirection('RIGHT');
        break;
      default:
        break;
    }
  };

  // 更改游戏设置
  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setGameSize(newSize);
  };

  const handleSpeedChange = (e) => {
    const newSpeed = parseInt(e.target.value, 10);
    setSpeed(newSpeed);
  };

  // 渲染游戏网格
  const renderGrid = () => {
    const grid = [];
    const cellSize = `calc(100% / ${gameSize})`;

    for (let y = 0; y < gameSize; y++) {
      for (let x = 0; x < gameSize; x++) {
        const isSnake = snake.some(segment => segment.x === x && segment.y === y);
        const isHead = snake[0].x === x && snake[0].y === y;
        const isFood = food.x === x && food.y === y;
        
        let cellClass = styles.cell;
        if (isHead) {
          cellClass = `${styles.cell} ${styles.snakeHead}`;
        } else if (isSnake) {
          cellClass = `${styles.cell} ${styles.snake}`;
        } else if (isFood) {
          cellClass = `${styles.cell} ${styles.food}`;
        }

        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={{
              width: cellSize,
              height: cellSize,
              left: `calc(${x} * ${cellSize})`,
              top: `calc(${y} * ${cellSize})`,
            }}
          />
        );
      }
    }

    return grid;
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>贪吃蛇游戏</title>
        <meta name="description" content="响应式贪吃蛇游戏" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>贪吃蛇游戏</h1>
        
        <div className={styles.gameInfo}>
          <div className={styles.gameStats}>
            <div className={styles.gameTime}>
              时间: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}
            </div>
            <div className={styles.score}>分数: {score}</div>
          </div>
          <div>
            <Link href="/leaderboard">
              <button 
                className={styles.leaderboardButton} 
                aria-label="排行榜"
              >
                🏆
              </button>
            </Link>
            <button 
              className={styles.settingsButton} 
              onClick={() => setShowSettings(!showSettings)}
              aria-label="设置"
            >
              ⚙️
            </button>
          </div>
        </div>

        {showSettings && (
          <div className={styles.settingsPanel}>
            <div className={styles.settingItem}>
              <label htmlFor="gameSize">游戏大小: {gameSize}x{gameSize}</label>
              <input
                id="gameSize"
                type="range"
                min="10"
                max="25"
                value={gameSize}
                onChange={handleSizeChange}
              />
            </div>
            <div className={styles.settingItem}>
              <label htmlFor="gameSpeed">游戏速度: {Math.round(1000 / speed)}级</label>
              <input
                id="gameSpeed"
                type="range"
                min="50"
                max="300"
                step="10"
                value={speed}
                onChange={handleSpeedChange}
                // 速度反向，值越小越快
                style={{ direction: 'rtl' }}
              />
            </div>
          </div>
        )}

        <div 
          className={styles.gameArea} 
          ref={gameAreaRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          tabIndex="0" /* 使div可以接收键盘焦点 */
          role="button" /* 为了可访问性 */
          aria-label="游戏区域"
        >
          {renderGrid()}
          
          {gameOver && (
            <div className={styles.gameOverlay}>
              <div className={styles.gameOverMessage}>
                游戏结束!
                <div>最终分数: {score}</div>
                <div>游戏时间: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</div>
                <button onClick={resetGame}>重新开始</button>
                <Link href="/leaderboard">
                  <button style={{ marginLeft: '10px', backgroundColor: 'var(--accent-secondary)' }}>查看排行榜</button>
                </Link>
              </div>
            </div>
          )}
          
          {isPaused && !gameOver && (
            <div className={styles.gameOverlay}>
              <div className={styles.pauseMessage}>
                游戏暂停
                <button onClick={() => setIsPaused(false)}>继续</button>
              </div>
            </div>
          )}
          
          {/* 调试信息 */}
          {showDebug && (
            <div className={styles.debugInfo}>
              <p>最后按键: {debugInfo.lastKey}</p>
              <p>最后触摸: {debugInfo.lastTouch}</p>
              <p>游戏区域焦点: {debugInfo.hasFocus ? '是' : '否'}</p>
              <p>方向: {direction}</p>
              <button 
                className={styles.debugToggle} 
                onClick={() => setShowDebug(false)}
              >
                关闭调试
              </button>
            </div>
          )}
          
          {/* 开启调试按钮 */}
          {!showDebug && (
            <button 
              className={styles.debugButton} 
              onClick={() => setShowDebug(true)}
            >
              调试
            </button>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <button 
              className={styles.controlButton} 
              onClick={() => handleDirectionClick('UP')}
              onTouchStart={(e) => {
                e.preventDefault(); // 阻止默认行为
                handleDirectionClick('UP');
              }}
              aria-label="向上"
              type="button"
            >
              ↑
            </button>
          </div>
          <div className={styles.controlRow}>
            <button 
              className={styles.controlButton} 
              onClick={() => handleDirectionClick('LEFT')}
              onTouchStart={(e) => {
                e.preventDefault(); // 阻止默认行为
                handleDirectionClick('LEFT');
              }}
              aria-label="向左"
              type="button"
            >
              ←
            </button>
            <button 
              className={styles.controlButton} 
              onClick={() => handleDirectionClick('DOWN')}
              onTouchStart={(e) => {
                e.preventDefault(); // 阻止默认行为
                handleDirectionClick('DOWN');
              }}
              aria-label="向下"
              type="button"
            >
              ↓
            </button>
            <button 
              className={styles.controlButton} 
              onClick={() => handleDirectionClick('RIGHT')}
              onTouchStart={(e) => {
                e.preventDefault(); // 阻止默认行为
                handleDirectionClick('RIGHT');
              }}
              aria-label="向右"
              type="button"
            >
              →
            </button>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>贪吃蛇游戏 - 响应式设计</p>
      </footer>
    </div>
  );
}