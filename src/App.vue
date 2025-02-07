<template>
  <ImageCropperApp />
</template>

<script>
import { defineComponent } from "vue";
import ImageCropperApp from "./components/ImageCropperApp.vue";

export default defineComponent({
  name: "App",
  components: {
    ImageCropperApp,
  },
});
</script>
<style>
:root {
  --background-color: #FFF0FF;
}
body {
  padding: 0;
  margin: 0;
  background-color: var(--background-color);
  display: flex;
  align-content: center;
}
#app {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
}
</style>
