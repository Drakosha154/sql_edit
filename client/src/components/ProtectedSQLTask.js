import React, { useState, useEffect, useRef } from 'react';
import { useWindowActivity } from '../hooks/useWindowActivity';

export const ProtectedSQLTask = ({
  taskId,
  initialCode,
  onSubmit
}) => {
  const [code, setCode] = useState(initialCode || '');
  const [copyCount, setCopyCount] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [startTime] = useState(Date.now());
  const textareaRef = useRef(null);
  const { isWindowActive } = useWindowActivity();

  // Отслеживание копирования
  useEffect(() => {
    const handleCopy = (e) => {
      if (textareaRef.current && textareaRef.current.contains(e.target)) {
        setCopyCount(prev => prev + 1);
        console.warn('Копирование запрещено!');
        e.preventDefault();
      }
    };

    // Отслеживание вставки
    const handlePaste = (e) => {
      if (textareaRef.current && textareaRef.current.contains(e.target)) {
        setPasteCount(prev => prev + 1);
        console.warn('Вставка запрещена!');
        e.preventDefault();
      }
    };

    // Отслеживание переключения вкладок
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
      }
    };

    // Отслеживание перехвата буфера обмена
    const handleCut = (e) => {
      if (textareaRef.current && textareaRef.current.contains(e.target)) {
        console.warn('Вырезание запрещено!');
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Запрет контекстного меню
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (textareaRef.current && textareaRef.current.contains(e.target)) {
        e.preventDefault();
        console.warn('Контекстное меню отключено');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const handleSubmit = async () => {
    const metadata = {
      isWindowActive,
      copyCount,
      pasteCount,
      timeSpent: Math.floor((Date.now() - startTime) / 1000),
      tabSwitches
    };

    await onSubmit(code, metadata);
  };

  return (
    <div className="sql-task-container">
      <div className="activity-indicator">
        <span>Статус: {isWindowActive ? '✅ Активен' : '⚠️ Неактивен'}</span>
        {copyCount > 0 && <span> | Копирования: {copyCount}</span>}
        {pasteCount > 0 && <span> | Вставки: {pasteCount}</span>}
        {tabSwitches > 0 && <span> | Смена вкладок: {tabSwitches}</span>}
      </div>
      
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="sql-editor"
        placeholder="Введите ваш SQL запрос здесь..."
        rows={10}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      
      <div className="task-controls">
        <button 
          onClick={handleSubmit}
          disabled={!isWindowActive}
          className="submit-btn"
        >
          {!isWindowActive ? 'Ожидание активности...' : 'Отправить решение'}
        </button>
        
        <div className="honesty-score">
          <p>Статистика решения:</p>
          <ul>
            <li>Время: {Math.floor((Date.now() - startTime) / 1000)} сек</li>
            <li>Копирования: {copyCount}</li>
            <li>Вставки: {pasteCount}</li>
            <li>Смены вкладок: {tabSwitches}</li>
          </ul>
        </div>
      </div>
      
      {!isWindowActive && (
        <div className="warning">
          ⚠️ Внимание! Окно неактивно более 5 секунд. Активность отслеживается.
        </div>
      )}
      
      {(copyCount > 0 || pasteCount > 0) && (
        <div className="copy-warning">
          ⚠️ Обнаружены попытки копирования/вставки. Это может повлиять на оценку решения.
        </div>
      )}
    </div>
  );
};