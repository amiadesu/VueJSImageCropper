<template>
    <div class="main">
        <div
        class="dropzone-container"
        @dragover="dragover"
        @dragleave="dragleave"
        @drop="drop"
        >
        <input
            type="file"
            multiple
            name="file"
            id="fileInput"
            class="hidden-input"
            @change="onChange"
            ref="file"
            accept=".pdf, .jpg, .jpeg, .png"
        />

        <label for="fileInput" class="file-label">
            <div v-if="isDragging">Release to drop files here.</div>
            <div v-else>Drop files here or <u>click here</u> to upload.</div>
        </label>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
        isDragging: false,
        files: [],
        };
    },
    methods: {
        onChange() {
            this.files.push(...this.$refs.file.files);
        },
        dragover(e) {
        e.preventDefault();
            this.isDragging = true;
        },
        dragleave() {
            this.isDragging = false;
        },
        drop(e) {
            e.preventDefault();
            this.$refs.file.files = e.dataTransfer.files;
            this.onChange();
            this.isDragging = false;
        },
    },
};  
</script>