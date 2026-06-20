import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';

import App from './App';
import { PlaybackService } from './src/services/player';

// registerRootComponent chama AppRegistry.registerComponent('main', () => App)
// e cuida tanto do Expo Go quanto de builds nativos
registerRootComponent(App);

// Precisa ser registrado fora do ciclo de vida do React — é o que mantém
// o áudio e os controles na tela de bloqueio vivos com o app em segundo plano
TrackPlayer.registerPlaybackService(() => PlaybackService);
