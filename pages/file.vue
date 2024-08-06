<template>
	<uv-textarea v-model="value" autoHeight placeholder="请输入内容"></uv-textarea>
	<uv-button type="primary" @click="saveBtn">保存</uv-button>
</template>

<script setup>
import * as File from '@/common/file.js'
const value = ref('')
const filePath = ref('') // 文件路径

onLoad((options) => {
	filePath.value = options.filePath
	File.getFileContextAsync(options.filePath).then((res) => {
		value.value = res.result
	})
})

const saveBtn = () => {
	File.writeContextToFileAsync(filePath.value, value.value).then((res) => {
		uni.showToast({
			title: '保存成功'
		})
	})
}
</script>

<style scoped></style>
