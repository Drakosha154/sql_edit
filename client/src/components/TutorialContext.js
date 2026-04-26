import React, { createContext, useContext, useState, useCallback } from 'react';
import Joyride, { STATUS } from 'react-joyride';

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
  const [stepIndex, setStepIndex] = useState(0);

  const startTutorial = useCallback((tutorialSteps) => {
    setSteps(tutorialSteps);
    setStepIndex(0);
    setRun(true);
  }, []);

  const stopTutorial = useCallback(() => {
    setRun(false);
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      setStepIndex(0);
    } else if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  return (
    <TutorialContext.Provider value={{ startTutorial, stopTutorial, run }}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
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
