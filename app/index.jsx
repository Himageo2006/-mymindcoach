// This screen is never shown to the user.
// All routing logic lives in app/_layout.jsx.
// router.replace() fires from AppStack's useEffect before this renders.
import { View } from 'react-native';
import { LightColors } from '../src/constants/colors';

export default function Index() {
  return <View style={{ flex: 1, backgroundColor: LightColors.primary }} />;
}
