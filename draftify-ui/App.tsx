import React, { useState } from 'react';
import { Screen } from './types';
import { InputScreen } from './screens/InputScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ResultScreen } from './screens/ResultScreen';
import { RecordScreen } from './screens/RecordScreen';
import { ErrorScreen } from './screens/ErrorScreen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.INPUT);

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.INPUT:
        return <InputScreen onNavigate={setCurrentScreen} />;
      case Screen.PROGRESS:
        return <ProgressScreen onNavigate={setCurrentScreen} />;
      case Screen.RESULT:
        return <ResultScreen onNavigate={setCurrentScreen} />;
      case Screen.RECORD:
        return <RecordScreen onNavigate={setCurrentScreen} />;
      case Screen.ERROR:
        return <ErrorScreen onNavigate={setCurrentScreen} />;
      default:
        return <InputScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <>
      {renderScreen()}
    </>
  );
};

export default App;