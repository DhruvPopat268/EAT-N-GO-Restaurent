export const playNotificationSound = (soundType: 'new-order' | 'order-ready' | 'order-cancelled' = 'new-order') => {
  const timestamp = new Date().toLocaleString();
  console.log(`🎵 [${timestamp}] Attempting to play sound: ${soundType}`);
  
  try {
    const soundFiles = {
      'new-order': '/sounds/new-order.mpeg',
      'order-ready': '/sounds/order-ready.mp3',
      'order-cancelled': '/sounds/order-cancelled.mp3'
    };

    const soundFile = soundFiles[soundType];
    console.log(`📁 [${timestamp}] Sound file path: ${soundFile}`);
    
    const audio = new Audio(soundFile);
    audio.volume = 0.7;
    console.log(`🔊 [${timestamp}] Audio object created, volume set to: ${audio.volume}`);
    
    audio.play()
      .then(() => {
        console.log(`✅ [${timestamp}] Sound played successfully: ${soundType}`);
      })
      .catch(error => {
        console.warn(`⚠️ [${timestamp}] Could not play notification sound:`, error);
      });
  } catch (error) {
    console.warn(`❌ [${timestamp}] Sound playback failed:`, error);
  }
};