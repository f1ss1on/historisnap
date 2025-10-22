<template>
  <div class="media-modal-overlay" @click="handleOverlayClick">
    <div class="media-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ media?.description || 'Historical Media' }}</h3>
        <button @click="$emit('close')" class="close-button">
          ✕
        </button>
      </div>
      
      <div class="modal-body">
        <div v-if="media?.type === 'image'" class="image-container">
          <img 
            :src="media.url" 
            :alt="media.description"
            class="modal-image"
            @load="handleImageLoad"
            @error="handleImageError"
          />
        </div>
        
        <div v-else-if="media?.type === 'audio'" class="audio-container">
          <audio 
            :src="media.url" 
            controls 
            preload="metadata"
            class="modal-audio"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
        
        <div v-else-if="media?.type === 'video'" class="video-container">
          <video 
            :src="media.url" 
            controls 
            preload="metadata"
            class="modal-video"
          >
            Your browser does not support the video element.
          </video>
        </div>
        
        <div v-else class="error-state">
          <div class="error-icon">❌</div>
          <p>Unable to display media content</p>
        </div>
        
        <div v-if="media" class="media-info">
          <div class="info-row">
            <span class="info-label">Type:</span>
            <span class="info-value">{{ media.type || 'Unknown' }}</span>
          </div>
          <div v-if="media.width && media.height" class="info-row">
            <span class="info-label">Dimensions:</span>
            <span class="info-value">{{ media.width }} × {{ media.height }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Source:</span>
            <a :href="media.url" target="_blank" class="info-link">
              View Original
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  media: {
    type: Object,
    default: null
  }
})

defineEmits(['close'])

const imageLoaded = ref(false)
const imageError = ref(false)

const handleOverlayClick = () => {
  // Close when clicking outside the modal
  // The @click.stop on the modal prevents this when clicking inside
}

const handleImageLoad = () => {
  imageLoaded.value = true
  imageError.value = false
}

const handleImageError = () => {
  imageError.value = true
  imageLoaded.value = false
}
</script>

<style lang="scss" scoped>
.media-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.media-modal {
  background: white;
  border-radius: $border-radius-lg;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: $shadow-xl;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: $light-color;
  
  h3 {
    margin: 0;
    color: $dark-color;
    font-size: 1.25rem;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: $spacing-xs;
    border-radius: $border-radius;
    transition: $transition-base;
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }
}

.modal-body {
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  overflow: auto;
}

.image-container,
.audio-container,
.video-container {
  display: flex;
  justify-content: center;
  align-items: center;
  
  .modal-image {
    max-width: 100%;
    max-height: 60vh;
    height: auto;
    border-radius: $border-radius;
    box-shadow: $shadow-md;
  }
  
  .modal-audio {
    width: 100%;
    max-width: 600px;
  }
  
  .modal-video {
    max-width: 100%;
    max-height: 60vh;
    border-radius: $border-radius;
  }
}

.error-state {
  text-align: center;
  padding: $spacing-xl;
  color: $muted-color;
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: $spacing-md;
  }
}

.media-info {
  background: $light-color;
  border-radius: $border-radius;
  padding: $spacing-md;
  
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .info-label {
      font-weight: 500;
      color: $muted-color;
    }
    
    .info-value {
      color: $dark-color;
    }
    
    .info-link {
      color: $primary-color;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@media (max-width: $breakpoint-md) {
  .media-modal {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: $spacing-md;
    
    h3 {
      font-size: 1.125rem;
    }
  }
  
  .modal-body {
    padding: $spacing-md;
  }
  
  .image-container .modal-image {
    max-height: 50vh;
  }
}
</style>