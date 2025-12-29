export enum Screen {
  INPUT = 'INPUT',
  PROGRESS = 'PROGRESS',
  RESULT = 'RESULT',
  RECORD = 'RECORD',
  ERROR = 'ERROR'
}

export interface NavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}