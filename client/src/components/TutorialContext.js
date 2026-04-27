import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Joyride, STATUS } from 'react-joyride';

const TutorialContext = createContext();


export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};

export const TutorialProvider = ({ children }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [tabSwitchers, setTabSwitchers] = useState({});

  const registerTabSwitcher = useCallback((context, switcherFn) => {
    setTabSwitchers(prev => ({ ...prev, [context]: switcherFn }));
  }, []);

  const unregisterTabSwitcher = useCallback((context) => {
    setTabSwitchers(prev => {
      const newSwitchers = { ...prev };
      delete newSwitchers[context];
      return newSwitchers;
    });
  }, []);

  const startTutorial = useCallback((tutorialSteps) => {
    setSteps(tutorialSteps);
    setRun(true);
  }, []);

  const stopTutorial = useCallback(() => {
    setRun(false);
  }, []);

  const restartTutorial = useCallback((tutorialSteps) => {
  // Сначала останавливаем текущий туториал
  setRun(false);
  
  // Небольшая задержка для полного размонтирования
  setTimeout(() => {
    setSteps(tutorialSteps);
    setRun(true);
  }, 100);
}, []);

  const handleJoyrideCallback = (data) => {
    const { status, index, type, action, lifecycle } = data;
    
    console.log('Joyride callback:', { status, index, type, action, lifecycle });
    
    // Переключаем вкладку ПЕРЕД показом шага
    if (type === 'step:before' && steps[index]) {
      const step = steps[index];
      if (step.tabKey) {
        const context = step.tabContext || 'main';
        const switcher = tabSwitchers[context];
        if (switcher) {
          switcher(step.tabKey);
          // Небольшая задержка для анимации переключения
          // Joyride автоматически подождет, пока элемент не станет видимым
        }
      }
    }
    
    // Обрабатываем завершение или пропуск тура
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
    }
  };

  const contextValue = React.useMemo(() => ({
    startTutorial, 
    stopTutorial, 
    restartTutorial, 
    registerTabSwitcher,
    unregisterTabSwitcher,
    run 
  }), [startTutorial, stopTutorial, restartTutorial, registerTabSwitcher, unregisterTabSwitcher, run]);

return (
  <TutorialContext.Provider value={contextValue}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        disableScrolling={false}
        spotlightClicks={false}
        disableOverlayClose={false}
        hideCloseButton={false}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#0d6efd',
            zIndex: 10000,
          },
          spotlight: {
            borderRadius: '8px',
          },
          tooltip: {
            borderRadius: '8px',
            fontSize: '16px',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonNext: {
            backgroundColor: '#0d6efd',
            borderRadius: '4px',
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#6c757d',
            marginRight: '10px',
          },
          buttonSkip: {
            color: '#6c757d',
          },
        }}
        locale={{
          back: 'Назад',
          close: 'Закрыть',
          last: 'Завершить',
          next: 'Далее',
          skip: 'Пропустить',
        }}
      />
    </TutorialContext.Provider>
  );
};