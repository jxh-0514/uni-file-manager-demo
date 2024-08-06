<template>
	<view class="btns-box">
		<uv-button style="margin: 10px" type="primary" :customStyle="customStyle" @click="openBtn">开启</uv-button>
		<uv-button style="margin: 10px" type="primary" :customStyle="customStyle" @click="closeBtn">关闭</uv-button>
		<uv-button style="margin: 10px" type="primary" :customStyle="customStyle" @click="addList">添加</uv-button>
		<uv-button style="margin: 10px" type="primary" :customStyle="customStyle" @click="downBtn">下载</uv-button>
		<uv-button style="margin: 10px" type="primary" :customStyle="customStyle" @click="seeBtn">查看文件</uv-button>
		<!-- <uv-button style="margin: 10px" type="primary" :customStyle="customStyle" @click="viewCatalogBtn">打开文件所在位置</uv-button> -->
		<uv-button style="margin: 10px" type="primary" :customStyle="customStyle" @click="downlocBtn">下载到指定位置</uv-button>
		<uv-button style="margin: 10px" type="primary" :customStyle="customStyle" @click="readFolderBtn">读取文件夹下的文件</uv-button>
		<uv-button style="margin: 10px" type="primary" :customStyle="customStyle" @click="filePathBtn">返回文件绝对路径</uv-button>
	</view>
	<view class="list">
		<view v-for="(item, index) in list" :key="index">{{ item.name || item }}</view>
	</view>
	<uv-popup ref="popup" mode="bottom" round="16rpx">
		<uv-list>
			<uv-list-item v-for="(item, index) in fileList" :key="index" :title="item.filePath">
				<template #footer>
					<uv-icon class="mr-10" name="edit-pen" size="24" @click="editFileBtn(item)"></uv-icon>
					<uv-icon name="trash" size="24" @click="delFileBtn(item)"></uv-icon>
				</template>
			</uv-list-item>
		</uv-list>
	</uv-popup>
</template>

<script setup>
import FileManager from '@/common/fileManager.js'
// 原生插件(某手持机扫描rfid标签)
// #ifdef APP-PLUS
const assetPlugin = uni.requireNativePlugin('uniplugin_module')
// #endif

// 响应式变量
const list = ref([])
const fileList = ref([])
const popup = ref(null)
const customStyle = { minWidth: '160rpx' }
const fileUrl = 'https://cloud.nmlog.com/f/YZiP/test-uni-file.txt'

// 关闭功能
const closeBtn = () => {
	assetPlugin.close()
	console.log('关闭')
}
// 开启功能并监听数据
const openBtn = () => {
	list.value = []
	// params 强度 读取时间
	assetPlugin.open(30, 300, (data) => {
		list.value.push(data)
	})
	console.log('开启')
}
// 添加测试数据到列表
const addList = () => {
	list.value.push('12')
}
// 下载配置文件
const downBtn = async () => {
	try {
		const downloadRes = await uni.downloadFile({ url: fileUrl })
		const saveRes = await uni.saveFile({ tempFilePath: downloadRes.tempFilePath })
		uni.showToast({
			title: '保存成功',
			icon: 'success',
			mask: true
		})
	} catch (error) {
		uni.showToast({
			title: `操作失败: ${error.errMsg}`,
			icon: 'none',
			mask: true
		})
	}
}

// 查看本地文件列表
const seeBtn = () => {
	uni.getSavedFileList({
		success: (res) => {
			fileList.value = res.fileList
			popup.value.open()
		}
	})
}

// 打开文件进行编辑
const editFileBtn = (item) => {
	uni.navigateTo({ url: '/pages/file?filePath=' + item.filePath })
	console.log('编辑', item)
	// uni.openDocument({
	// 	filePath: item.filePath,
	// 	success: () => {
	// 		console.log('打开文档成功')
	// 	}
	// })
}
// 删除文件
const delFileBtn = (item) => {
	uni.showModal({
		title: '提示',
		content: '确定删除该文件吗？',
		success: (res) => {
			if (res.confirm) {
				uni.removeSavedFile({
					filePath: item.filePath,
					success: () => {
						uni.showToast({
							title: '删除成功',
							icon: 'success',
							mask: true
						})
						// 删除文件后，更新文件列表
						fileList.value = fileList.value.filter((file) => file.filePath !== item.filePath)
					}
				})
			}
		}
	})
}
// 打开文件所在位置(不可用)
const viewCatalogBtn = () => {
	const path = '/storage/emulated/0/newFile/file3/1.key'
	FileManager.openFileWithPath(path)
}
// 下载到指定位置
const downlocBtn = () => {
	FileManager.openFolderManager(fileUrl) // 选择文件夹并下载
}
// 读取文件夹下的文件
async function readFolderBtn() {
	const folderPath = '/storage/emulated/0/newFile'
	const arr = await FileManager.listFilesInFolder(folderPath)
	list.value = arr
}
// 返回文件绝对路径
async function filePathBtn() {
	const arr = []
	const filePath = await FileManager.openFileManager()
	arr.push({ name: filePath })
	list.value = arr
	console.log('选择的文件路径---', filePath)
}
</script>

<style scoped>
.btns-box {
	display: flex;
	flex-wrap: wrap;
}
.list {
	width: 100%;
	height: 200px;
	border: 1px solid #000;
	overflow: hidden;
	overflow-y: scroll;
}
.mr-10 {
	margin-right: 20rpx;
}
</style>
