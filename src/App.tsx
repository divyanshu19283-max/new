import { CareProvider, useCare } from '@/store/CareContext';
import { Landing } from '@/Landing';
import { PersonMode } from '@/person/PersonMode';
import { DeviceMode } from '@/person/DeviceMode';
import { CaregiverMode } from '@/caregiver/CaregiverMode';

function Router() {
  const { mode } = useCare();
  switch (mode) {
    case 'person': return <PersonMode />;
    case 'device': return <DeviceMode />;
    case 'caregiver': return <CaregiverMode />;
    default: return <Landing />;
  }
}

export default function App() {
  return (
    <CareProvider>
      <Router />
    </CareProvider>
  );
}
