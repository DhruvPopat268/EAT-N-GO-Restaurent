let currentSoundInterval: NodeJS.Timeout | null = null;

export const playNotificationSound = (soundType: 'new-order' | 'order-ready' | 'order-cancelled' = 'new-order') => {
  const timestamp = new Date().toLocaleString();
  console.log(`🎵 [${timestamp}] Attempting to play sound: ${soundType}`);
  
  // Clear any existing sound loop
  if (currentSoundInterval) {
    clearInterval(currentSoundInterval);
    currentSoundInterval = null;
  }
  
  try {
    const soundFiles = {
      'new-order': '/sounds/new-order.mpeg',
      'order-ready': '/sounds/order-ready.mp3',
      'order-cancelled': '/sounds/order-cancelled.mp3'
    };

    const soundFile = soundFiles[soundType];
    console.log(`📁 [${timestamp}] Sound file path: ${soundFile}`);
    
    let playCount = 0;
    const maxPlays = 3; // Ring 3 times
    
    const playSound = () => {
      if (playCount >= maxPlays) {
        if (currentSoundInterval) {
          clearInterval(currentSoundInterval);
          currentSoundInterval = null;
        }
        return;
      }
      
      const audio = new Audio(soundFile);
      audio.volume = 1.0; // 100% volume
      console.log(`🔊 [${timestamp}] Playing sound ${playCount + 1}/${maxPlays}, volume: ${audio.volume}`);
      
      audio.play()
        .then(() => {
          console.log(`✅ [${timestamp}] Sound ${playCount + 1} played successfully: ${soundType}`);
        })
        .catch(error => {
          console.warn(`⚠️ [${timestamp}] Could not play notification sound:`, error);
        });
      
      playCount++;
    };
    
    // Play first sound immediately
    playSound();
    
    // Set interval to play remaining sounds with 1-second delay
    if (maxPlays > 1) {
      currentSoundInterval = setInterval(playSound, 1000); // 1 second delay
    }
    
  } catch (error) {
    console.warn(`❌ [${timestamp}] Sound playback failed:`, error);
  }
};

// Function to stop current sound loop
export const stopNotificationSound = () => {
  if (currentSoundInterval) {
    clearInterval(currentSoundInterval);
    currentSoundInterval = null;
    console.log('🔇 Notification sound loop stopped');
  }
};