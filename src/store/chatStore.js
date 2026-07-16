import { reactive } from 'vue';

export const chatStore = reactive({
  isChatbotMode: false,
  chatbotLocations: [],
  
  setLocations(locations) {
    this.chatbotLocations = locations;
    this.isChatbotMode = locations && locations.length > 0;
  },
  
  clearLocations() {
    this.chatbotLocations = [];
    this.isChatbotMode = false;
  }
});
