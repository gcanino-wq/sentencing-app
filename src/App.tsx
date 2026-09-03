import { Compare } from './screens/Compare';
import { Matters } from './screens/Matters';
import { Result } from './screens/Result';
import { StatuteSearch } from './screens/StatuteSearch';
import { Wizard } from './screens/Wizard';
import { Worksheets } from './screens/Worksheets';
import { useCase } from './state/useCase';

export function App() {
  const controller = useCase();

  switch (controller.screen) {
    case 'matters':
      return <Matters controller={controller} />;
    case 'search':
      return <StatuteSearch controller={controller} />;
    case 'wizard':
      return <Wizard controller={controller} />;
    case 'worksheet':
      return <Worksheets controller={controller} />;
    case 'result':
      return <Result controller={controller} />;
    case 'compare':
      return <Compare controller={controller} />;
  }
}
