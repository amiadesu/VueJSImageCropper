<template>
    <div ref="root" id="root-div"
        :class="{'dragging-over': (isDragging === true), 'ignore-children': (waiting === true)}"
        @dragenter.prevent="onDragEnter"
        @dragleave.prevent="onDragLeave"
        @dragover.prevent
        @drop.prevent="onDrop"
    >
        <div v-if="waiting" class="waiting-wrapper">
            Processing data...
        </div>
        <section v-if="isDragging" class="dragndrop-wrapper">
            <section class="dragndrop-container">
                <section class="dragndrop-inner">
                    Release to drop files here.
                </section>
            </section>
        </section>
        <div class="app-section">
            <h1>Image cropper</h1>
            <div class="control-panel">
                <label for="image-upload" id="image-upload-wrapper"><span class="unselectable" id="upload-span">Upload an image</span></label>
                <input ref="imageUpload" type="file" accept="image/*" id="image-upload" style="display: none" @change="imageUploadProcess">
                <!-- <button id="crop-button" @click="downloadCropped">Crop</button> -->
                <button id="download-button" @click="downloadCropped" class="unselectable">Download</button>
                <button id="round-button" @click="roundResult" class="unselectable">Round corners</button>
                <a ref="downloader" style="display: none"></a>
            </div>
            <div class="cropper-wrapper">
                <div class="source-image-wrapper">
                    <vue-cropper
                        id="image-preview"
                        ref="cropper"
                        :src="imgSrc"
                        :aspect-ratio="0"
                        alt="Source Image"
                        preview="#result-preview"
                        @crop="getData"
                        @zoom="stopZoom"
                        class="unselectable"
                    >
                    </vue-cropper>
                </div>
                <div class="result-image-wrapper">
                    <div class="result-preview-wrapper unselectable">
                        <div v-show="hideRoundedResult" ref="resultPreview" id="result-preview"></div>
                        <div v-show="!hideRoundedResult" ref="roundedPreview" id="rounded-result-preview">
                            <img ref="roundedPreviewImg" :src="cropImg">
                        </div>
                    </div>
                </div>
            </div>
            <div class="options-panel">
                <div class="flex-column">
                    <div class="flex-row">
                        <label for="x-offset-input" class="unselectable">X offset (px) </label>
                        <input type="number" v-model="xOffsetVal" id="x-offset-input" @change="setData" >
                    </div>
                    <div class="flex-row">
                        <label for="y-offset-input" class="unselectable">Y offset (px) </label>
                        <input type="number" v-model="yOffsetVal" id="y-offset-input" @change="setData" >
                    </div>
                </div>
                <div class="flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" id="link-button" @click="setAspectRatio">
                        <path v-if="linked" d="M208 352h-64a96 96 0 010-192h64M304 160h64a96 96 0 010 192h-64M163.29 256h187.42" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="36"/>
                        <path v-else d="M208 352h-64a96 96 0 010-192h64M304 160h64a96 96 0 010 192h-64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="36"/>
                    </svg>
                    <div class="flex-column">
                        <div class="flex-row">
                            <label for="width-input" class="unselectable">Width (px) </label>
                            <input type="number" v-model="widthVal" id="width-input" class="little-margin-left" @change="setData" >
                        </div>
                        <div class="flex-row">
                            <label for="height-input" class="unselectable">Height (px) </label>
                            <input type="number" v-model="heightVal" id="height-input" @change="setData" >
                        </div>
                    </div>
                </div>
                <div class="flex-row">
                    <label for="height-input" class="unselectable">Rotate (deg) </label>
                    <input type="number" v-model="rotationVal" id="rotation-input" @change="setData" >
                </div>
                <div class="flex-column flip-buttons">
                    <button class="options-panel-button unselectable" @click="flipX">Flip X</button>
                    <button class="options-panel-button unselectable" @click="flipY">Flip Y</button>
                </div>
            </div>
            <div class="options-panel bottom">
                <div class="flex-row">
                    <label for="crop-type-dropdown" class="unselectable">Round corners using </label>
                    <select name="crop-type" id="crop-type-dropdown" v-model="cropType">
                        <option selected value="circles">Circles</option>
                        <option value="ellipses">Ellipses</option>
                    </select>
                </div>
                <div class="flex-row">
                    <label for="radius-input" class="unselectable">Amount (%): </label>
                    <input type="number" min="0" max="50" step="0.1" v-model="radiusValue" id="radius-input">
                </div>
                <div class="checkboxes">
                    <label for="restrictions-checkbox" class="unselectable"><span>Enable size restrictions? </span></label>
                    <input type="checkbox" v-model="restrictionsAreEnabled" id="restrictions-checkbox" @change="zoomChecker">
                </div>
            </div>
            <canvas ref="roundedCanvas" style="display: none;"></canvas>
        </div>
    </div>
</template>

<script>
import { ref, defineComponent, onMounted, h, withCtx } from 'vue';
import VueCropper from "../additional/VueCropper.js"
import 'cropperjs/dist/cropper.css';
import { getFileName, clamp } from "../additional/extraFunctions.js";

export default defineComponent({
    name: "ImageCropperApp",
    components: {
        VueCropper
    },
    data() {
        return {
            imgSrc: "example.png",
            cropImg: "",
            data: null,
            xOffsetVal: 0,
            yOffsetVal: 0,
            widthVal: 0,
            heightVal: 0,
            rotationVal: 0,
            scaleX: 1,
            scaleY: 1,
            imgName: "example",
            hideRoundedResult: true,
            radiusValue: 0,
            cropType: "circles",
            radius: "0px",
            aspectRatio: 0,
            linked: false,
            hardCodedLimit: 16384,
            absoluteLimit: 163840,
            restrictionsAreEnabled: true,
            isDragging: false,
            draggedFile: null,
            waiting: false
        }
    },
    methods: {
        imageUploadProcess(e) {
            const file = e.target.files[0];
            this.imgName = getFileName(file.name);
    
            if (file.type.indexOf('image/') === -1) {
                alert('Please select an image file');
                return;
            }
    
            if (typeof FileReader === 'function') {
                const reader = new FileReader();
        
                reader.onload = (event) => {
                    this.imgSrc = event.target.result;
                    // rebuild cropperjs with the updated source
                    this.$refs.cropper.replace(event.target.result);
                    this.hideRoundedResult = true;
                };
        
                reader.readAsDataURL(file);
            } else {
                alert('Sorry, FileReader API not supported');
            }
        },
        stopZoom(e) {
            let zoomingIn = e.detail.ratio < e.detail.oldRatio;

            if (this.restrictionsAreEnabled && (this.widthVal > this.hardCodedLimit || this.heightVal > this.hardCodedLimit) && zoomingIn) {
                e.preventDefault();
            } else if ((this.widthVal > this.absoluteLimit || this.heightVal > this.absoluteLimit) && zoomingIn) {
                e.preventDefault();
            }
        },
        zoomChecker(e) {
            if (this.restrictionsAreEnabled && (this.widthVal > this.hardCodedLimit || this.heightVal > this.hardCodedLimit)) {
                this.$refs.cropper.zoomTo(0.1); // Need to calculate an actual value...
            }
        },
        setData() {
            this.rotationVal %= 360;
            this.$refs.cropper.setData({
                y: this.yOffsetVal,
                x: this.xOffsetVal,
                rotate: this.rotationVal,
                width: this.widthVal,
                height: this.heightVal,
                scaleX: this.scaleX,
                scaleY: this.scaleY
            });
        },
        getData() {
            this.hideRoundedResult = true;
            const data = this.$refs.cropper.getData(true);
            // console.log(data);
            this.yOffsetVal = data.y;
            this.xOffsetVal = data.x;
            this.rotationVal = data.rotate % 360;
            this.widthVal = data.width;
            this.heightVal = data.height;
        },
        downloadCropped() {
            if (!this.validateImage()) return;
            if (this.hideRoundedResult) {
                this.cropImg = this.$refs.cropper.getCroppedCanvas({
                    maxHeight: this.hardCodedLimit,
                    maxWidth: this.hardCodedLimit
                }).toDataURL();
                if (this.cropImg === "data:,") return;
                this.$refs.downloader.href = this.cropImg;
                this.$refs.downloader.download = `${this.imgName}-modified.png`;
                this.$refs.downloader.click();
            } else {
                this.cropImg = this.$refs.cropper.getCroppedCanvas({
                    maxHeight: this.hardCodedLimit,
                    maxWidth: this.hardCodedLimit
                }).toDataURL();
                if (this.cropImg === "data:,") return;
                this.cropImg = this.saveRounded();
                this.$refs.downloader.href = this.cropImg;
                this.$refs.downloader.download = `${this.imgName}-modified.png`;
                this.$refs.downloader.click();
            }
        },
        saveRounded() {
            this.waiting = true;
            const w = this.widthVal;
            const h = this.heightVal;
            const canvas = this.$refs.roundedCanvas;
            canvas.width = w;
            canvas.height = h;
            const context = canvas.getContext("2d");
            if (this.cropType === "ellipses") {
                const xr = w * this.radiusValue / 100;
                const yr = h *this.radiusValue / 100;
                context.beginPath();
                context.ellipse(xr, yr, xr, yr, 0, Math.PI, -Math.PI/2);
                context.ellipse(w - xr, yr, xr, yr, 0, -Math.PI/2, 0);
                context.ellipse(w - xr, h - yr, xr, yr, 0, 0, Math.PI / 2);
                context.ellipse(xr, h - yr, xr, yr, 0, Math.PI / 2, Math.PI);
                context.moveTo(xr, 0);
                context.lineTo(w - xr, 0);
                context.moveTo(xr, h);
                context.lineTo(w - xr, h);
                context.moveTo(0, yr);
                context.lineTo(0, h - yr);
                context.moveTo(w, yr);
                context.lineTo(w, h - yr);
            } else {
                const r = Math.min(w, h) * this.radiusValue / 100;
                context.beginPath();
                context.roundRect(0, 0, w, h, [r]);
                context.closePath();
            }
            context.clip();
            context.drawImage(this.$refs.cropper.getCroppedCanvas({
                maxHeight: this.hardCodedLimit,
                maxWidth: this.hardCodedLimit
            }), 0, 0);
            this.waiting = false;
            return canvas.toDataURL();
        },
        roundResult() {
            if (!this.validateImage()) return;
            this.hideRoundedResult = false;
            this.cropImg = this.saveRounded();
        },
        setAspectRatio() {
            if (!this.linked) {
                this.aspectRatio = this.widthVal / this.heightVal;
                this.linked = true;
            } else {
                this.aspectRatio = 0;
                this.linked = false;
            }
            const options = {
                y: this.yOffsetVal,
                x: this.xOffsetVal,
                width: this.widthVal,
                height: this.heightVal
            };
            this.$refs.cropper.setAspectRatio(this.aspectRatio).setData(options);
        },
        validateImage() {
            const data = this.$refs.cropper.getData();
            const maxValue = Math.max(data.width, data.height);
            if (maxValue > this.hardCodedLimit) {
                alert("Image cannot be bigger than " + this.hardCodedLimit + "px by any side!");
                // this.$refs.cropper.reset();
                return false;
            }
            return true;
        },
        flipX() {
            this.scaleX = -this.scaleX;
            this.setData();
        },
        flipY() {
            this.scaleY = -this.scaleY;
            this.setData();
        },
        onChange() {
            const file = this.$refs.imageUpload.files[0];
            this.imgName = getFileName(file.name);
    
            if (file.type.indexOf('image/') === -1) {
                alert('Please select an image file');
                return;
            }
    
            if (typeof FileReader === 'function') {
                const reader = new FileReader();
        
                reader.onload = (event) => {
                    this.imgSrc = event.target.result;
                    // rebuild cropperjs with the updated source
                    this.$refs.cropper.replace(event.target.result);
                    this.hideRoundedResult = true;
                };
        
                reader.readAsDataURL(file);
            } else {
                alert('Sorry, FileReader API not supported');
            }
        },
        onDragEnter(e) {
            if (e.dataTransfer.types.indexOf('Files') === -1) {
                return;
            }
            this.isDragging = true;
        },
        onDragLeave(e) {
            if (e.target !== this.$refs.root) return;
            this.isDragging = false;
        },
        onDrop(e) {
            if (e.dataTransfer.files.length === 0) {
                this.isDragging = false;
                return;
            }
            if (!e.dataTransfer.files[0].type.match(/^(image\/.*)$/)) {
                this.isDragging = false;
                alert("Only image files are allowed!");
                return;
            }
            this.$refs.imageUpload.files = e.dataTransfer.files;
            this.onChange();
            this.isDragging = false;
        },
    },
    setup() {
        // const roundedCanvas = ref(null);

        // onMounted(() => {
        //     console.log(roundedCanvas.value);
        //     roundedCanvas.value.getContext('2d', { willReadFrequently: true });
        // })
        return {};
    },
});
</script>

<style>
:root {
    --text-color: #111;

    --button-text-color: #eee;
    --idle-button-color: #7E60BF;
    --hover-button-color: #614C9C;
    --active-button-color: #433878;

    --dragndrop-background-color-1: rgba(215, 215, 215, 0.8);
    --dragndrop-background-color-2: #F1C9F8;
    --dragndrop-background-color-3: #FFF0FF;
    --dragndrop-border-color: #A375D1;
}

* {
    color: var(--text-color);
}

button, #upload-span {
    font-size: 1.1rem;
    color: var(--button-text-color);
}

#root-div {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}

.app-section {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 0px 20px 20px 20px;
    margin: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}

h1 {
    font-size: 2rem;
    margin-top: 0.5rem;
    margin-bottom: -0.5rem;
    font-weight: 600;
}

.cropper-wrapper {
    width: 90%;
    height: 400px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
}
/* Need to bo something about borders... */
.source-image-wrapper {
    width: 100%;
    height: 100%;
    /* border: 5px solid gray; */
    padding: 0;
    display: block;
}

.result-image-wrapper {
    width: 100%;
    height: 400px;
    /* border: 5px solid gray; */
    padding: 0;
    display: block;
    display: flex;
    align-items: center;
    justify-content: center;
}

.result-preview-wrapper {
    width: 100% !important;
    height: 100% !important;
    display: flex;
    align-items: center;
    justify-content: center;
}

#image-preview, #image-preview > img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    padding: 0;
    margin: 0;
    object-fit: contain;
}

#rounded-result-preview {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

#rounded-result-preview > img {
    max-width: 100%;
    max-height: 100%;
    display: block;
    object-fit: contain;
}

#result-preview {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

#image-upload-wrapper {
    height: 100%;
    width: 250px;
    margin: 0;
    padding: 0;
    background-color: var(--idle-button-color);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: none;
    border-radius: 10px;
}

#image-upload-wrapper:hover {
    background-color: var(--hover-button-color);
}

#image-upload-wrapper:active {
    background-color: var(--active-button-color);
}

#image-upload-wrapper > span {
    margin: 0;
    padding: 0;
}

.control-panel {
    width: 90%;
    height: 35px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 2rem;
}

.control-panel > button {
    height: 100%;
    width: 250px;
    background-color: var(--idle-button-color);
    cursor: pointer;
    border: none;
    border-radius: 10px;
}

.control-panel > button:hover {
    background-color: var(--hover-button-color);
}

.control-panel > button:active {
    background-color: var(--active-button-color);
}

#radius-input {
    margin: 0;
}

.options-panel {
    width: 90%;
    height: 75px;
    border: 2px solid black;
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 2rem;
    border-radius: 10px;
}

.options-panel-button {
    width: 150px;
    height: 25px;
    padding-top: 0;
    padding-bottom: 0;
    background-color: var(--idle-button-color);
    cursor: pointer;
    border: none;
    border-radius: 5px;
}

.options-panel-button:hover {
    background-color: var(--hover-button-color);
}

.options-panel-button:active {
    background-color: var(--active-button-color);
}

#link-button {
    width: 45px;
    height: 20px;
    padding: 0;
    margin: 0;
    background-color: var(--idle-button-color);
    border-radius: 45px;
}

#link-button path {
    color: var(--button-text-color);
}

#link-button:hover {
    background-color: var(--hover-button-color);
}

#link-button:active {
    background-color: var(--active-button-color);
}

.dragging-over * {
    pointer-events: none;
}

.dragndrop-wrapper {
    position: absolute;
    height: 100%;
    width: 100%;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background-color: var(--dragndrop-background-color-1);
}

.dragndrop-container {
    width: 95%;
    height: 95%;
    margin: 0;
    padding: 0;
    border-radius: 2rem;
    background-color: var(--dragndrop-background-color-2);
    display: flex;
    align-items: center;
    justify-content: center;

}

.dragndrop-inner {
    width: 97.5%;
    height: 95%;
    margin: 0;
    padding: 0;
    border-radius: 2rem;
    background-color: var(--dragndrop-background-color-3);
    border: 4px dashed var(--dragndrop-border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
}

.waiting-wrapper {
    position: absolute;
    height: 100%;
    width: 100%;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background-color: var(--dragndrop-background-color-1);

}





.flex-column {
    text-align: center;
    display: flex;
    align-content: center;
    flex-direction: column;
    row-gap: 0.5rem;
}

.flex-row {
    text-align: center;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    column-gap: 0.5rem;
}

.center-vertically {
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: 0.5rem;
}

.unselectable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.checkboxes label {
    display: inline-block;
    padding-right: 5px;
    white-space: nowrap;
}

.checkboxes input {
    vertical-align: middle;
    margin-bottom: 1px;
}

.checkboxes label span {
    vertical-align: middle;
}

.ignore-children * {
    pointer-events: none;
}

@media only screen and (max-width: 1250px) {
    .options-panel {
        width: 100%;
    }
}

@media only screen and (max-width: 1150px) {
    .app-section {
        padding: 0px 5px 5px 5px;
    }

    .options-panel {
        gap: 1rem;
    }
}

@media only screen and (max-width: 1050px) {
    .options-panel {
        height: 150px;
        display: grid;
        grid-template-rows: 1fr 1fr;
        grid-template-columns: 1fr 1fr;
        row-gap: 0.5rem;
        column-gap: 0.5rem;
    }

    .options-panel.bottom {
        display: grid;
        grid-template: 
            "a b"
            "c c";
    }

    .checkboxes {
        grid-area: c;
        justify-self: center;
    }

    .flex-row {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .little-margin-left {
        margin-left: 0.25rem;
    }

    .flip-buttons {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row !important;
        column-gap: 0.5rem;
    }
}

@media only screen and (max-width: 650px) {
    .flex-row input {
        width: 100px;
    }

    .flip-buttons {
        width: 200px;
        justify-self: center;
    }

    #link-button {
        width: 35px;
    }

    #image-upload-wrapper {
        width: 200px;
    }

    .control-panel {
        width: 100%;
        gap: 1rem;
    }

    .control-panel > button {
        width: 200px;
    }
}

@media only screen and (max-width: 500px) {
    .options-panel {
        row-gap: 0;
        column-gap: 0.3rem;
        padding: 3px;

        grid-template-rows: 1fr 1fr;
        grid-template-columns: 3fr 4fr;
    }

    .flex-row {
        width: max-content;
        justify-self: center;
    }

    .flex-column {
        width: max-content;
        justify-self: center;
    }

    .flex-row input {
        width: 70px;
    }

    .flip-buttons {
        width: 160px;
        justify-self: center;
    }

    #image-upload-wrapper {
        height: 40px;
    }

    #image-upload-wrapper > #upload-span {
        font-size: 1rem;
    }

    .control-panel > button {
        height: 40px;
        font-size: 1rem;
    }
}

@media only screen and (max-width: 430px) {
    .options-panel * {
        font-size: 0.8rem;
    }
    .flex-row {
        width: max-content;
        justify-self: center;
    }

    .flex-column {
        width: max-content;
        justify-self: center;
    }
    
    .flex-row input {
        width: 70px;
    }

    .flip-buttons {
        width: 160px;
        justify-self: center;
    }

    #image-upload-wrapper > #upload-span {
        font-size: 0.8rem;
    }

    .control-panel > button {
        font-size: 0.8rem;
    }
}
</style>