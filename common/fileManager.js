// fileManager.js
// 打开文件管理器选择文件夹并下载文件到选择的文件夹
async function openFolderManager(downloadUrl) {
	const systemInfo = plus.os.name; // 获取系统信息
	if (systemInfo === 'Android') {
		const Activity = plus.android.runtimeMainActivity(); // 获取当前Activity
		const Intent = plus.android.importClass('android.content.Intent'); // 导入Intent类

		const intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE); // 创建打开文件夹的Intent
		intent.addCategory(Intent.CATEGORY_DEFAULT); // 设置分类

		Activity.startActivityForResult(intent, 1); // 启动Activity，打开文件管理器

		Activity.onActivityResult = async (requestCode, resultCode, data) => {
			if (resultCode === Activity.RESULT_OK) { // 处理Activity返回的结果
				await handleActivityResult(data, downloadUrl);
			}
		};
	}
}

// 处理从文件管理器返回的结果
async function handleActivityResult(data, downloadUrl) {
	const Uri = data.getData(); // 获取返回的URI
	plus.android.importClass(Uri);

	const DocumentsContract = plus.android.importClass(
		'android.provider.DocumentsContract'); // 导入DocumentsContract类
	const docId = DocumentsContract.getTreeDocumentId(Uri); // 获取Document ID
	const [type, id] = docId.split(':'); // 分割Document ID为类型和ID

	if (id) {
		const folderPath = getFolderPath(type, id); // 获取文件夹路径

		console.log('选择的文件夹路径:', folderPath);

		await requestStoragePermissions(); // 请求存储权限
		await downloadFileToFolder(downloadUrl, folderPath); // 下载文件到选择的文件夹
	}
}

// 获取文件夹路径
function getFolderPath(type, id) {
	const Environment = plus.android.importClass('android.os.Environment'); // 导入Environment类
	const System = plus.android.importClass('java.lang.System'); // 导入System类

	if (type === 'primary') {
		return `${Environment.getExternalStorageDirectory()}/${id}`; // 返回主存储路径
	} else {
		return `${System.getenv('SECONDARY_STORAGE')}/${id}`; // 返回次存储路径
	}
}

// 请求读写权限
function requestStoragePermissions() {
	return new Promise((resolve, reject) => {
		const permissions = [
			'android.permission.READ_EXTERNAL_STORAGE',
			'android.permission.WRITE_EXTERNAL_STORAGE'
		];

		plus.android.requestPermissions(permissions, result => {
			if (result.granted) { // 如果权限授予
				console.log('存储权限已授予');
				resolve();
			} else {
				uni.showToast({
					title: '存储权限被拒绝',
					icon: 'none'
				});
				reject(new Error('存储权限被拒绝'));
			}
		});
	});
}

// 下载文件到指定文件夹
function downloadFileToFolder(url, folderPath) {
	return new Promise((resolve, reject) => {
		const fileName = url.substring(url.lastIndexOf('/') + 1); // 从URL中提取文件名
		const filePath = `file://${folderPath}/${fileName}`; // 构建文件路径

		const dtask = plus.downloader.createDownload(url, {
			filename: filePath
		}, (d, status) => {
			if (status === 200) { // 如果下载成功
				const fileSaveUrl = plus.io.convertLocalFileSystemURL(d.filename); // 转换为本地文件系统URL
				uni.showToast({
					title: '文件下载成功',
					icon: 'success'
				});
				resolve(fileSaveUrl);
			} else {
				plus.downloader.clear(); // 清除下载任务
				uni.showToast({
					title: '文件下载失败',
					icon: 'none'
				});
				reject(new Error('文件下载失败'));
			}
		});
		dtask.start(); // 开始下载任务
	});
}
// ========================= 获取文件路径 =======================
/**
 * 打开系统文件管理器选择文件并返回文件路径
 * @description uniapp 没有提供打开安卓文件管理器的api 必须使用 input 或 plus
 */
async function openFileManager() {
	const systemInfo = plus.os.name; // 获取系统信息
	if (systemInfo === 'Android') {
		try {
			// 获取当前 Activity 实例
			const Activity = plus.android.runtimeMainActivity();
			// 导入 Android 的 Intent 类
			const Intent = plus.android.importClass('android.content.Intent');
			// 创建一个新的 Intent 实例，用于选择文件
			const intent = new Intent(Intent.ACTION_GET_CONTENT);
			intent.setType('*/*'); // 设置类型为所有文件
			intent.addCategory(Intent.CATEGORY_OPENABLE); // 只显示可打开的文件（不包括隐藏文件）
			// 启动系统的文件管理器
			Activity.startActivityForResult(intent, 1);

			// 等待文件选择结果
			const result = await new Promise((resolve) => {
				Activity.onActivityResult = (requestCode, resultCode, data) => {
					if (requestCode === 1 && resultCode === Activity.RESULT_OK) {
						resolve(data); // 返回文件选择结果
					} else {
						resolve(null); // 没有选择文件或操作取消
					}
				};
			});

			if (result) {
				const filePath = await handleFileActivityResult(Activity, result);
				// console.log('文件路径：', filePath);
				return filePath;
			}
		} catch (error) {
			console.error('打开文件管理器时发生错误:', error);
		}
	}
	console.log('当前手机的系统是', platform);
	return null;
}

/**
 * 处理文件管理器返回结果
 * @param {Object} activity 安卓的实例
 * @param {Object} data 文件选择结果数据
 */
async function handleFileActivityResult(Activity, data) {
	try {
		const Uri = data.getData(); // 获取文件的 URI
		plus.android.importClass(Uri);
		const DocumentsContract = plus.android.importClass('android.provider.DocumentsContract');

		if (DocumentsContract.isDocumentUri(Activity, Uri)) {
			// 如果是 Document 类型的 URI
			return await handleDocumentUri(Activity, Uri);
		} else if ('content' === Uri.getScheme()) {
			// 如果 URI 的 scheme 是 content
			return await getDataColumn(Activity, Uri);
		} else if ('file' === Uri.getScheme()) {
			// 如果 URI 的 scheme 是 file
			return Uri.getPath();
		}
	} catch (error) {
		console.error('处理文件管理器返回结果时发生错误:', error);
	}
	return null;
}

/**
 * 处理 Document URI
 * @param {Object} activity 安卓的实例
 * @param {Object} uri 文件 URI
 */
async function handleDocumentUri(Activity, Uri) {
	const DocumentsContract = plus.android.importClass('android.provider.DocumentsContract');
	const DocId = DocumentsContract.getDocumentId(Uri); // 获取 Document ID
	const [Type, Id] = DocId.split(':'); // 分割出类型和 ID
	const authority = Uri.getAuthority(); // 获取 URI 的 authority 部分

	if (authority === 'com.android.providers.media.documents') {
		// 处理媒体文件 URI
		return await handleMediaDocument(Activity, Type, Id);
	} else if (authority === 'com.android.providers.downloads.documents') {
		// 处理下载文件 URI
		return await handleDownloadsDocument(Activity, DocId);
	} else if (authority === 'com.android.externalstorage.documents') {
		// 处理外部存储文件 URI
		return handleExternalStorageDocument(Type, Id);
	}
	return null;
}

/**
 * 处理媒体文件
 * @param {Object} activity 安卓的实例
 * @param {String} type 文件类型（image, video, audio）
 * @param {String} id 文件 ID
 */
async function handleMediaDocument(Activity, Type, Id) {
	const MediaStore = plus.android.importClass('android.provider.MediaStore');
	let contentUri = null;

	// 根据文件类型设置 contentUri
	switch (Type) {
		case 'image':
			contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
			break;
		case 'video':
			contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
			break;
		case 'audio':
			contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
			break;
	}
	const selection = '_id=?'; // 查询条件
	const selectionArgs = [Id]; // 查询参数
	return await getDataColumn(Activity, contentUri, selection, selectionArgs);
}

/**
 * 处理下载文件
 * @param {Object} activity 安卓的实例
 * @param {String} docId 文件 ID
 */
async function handleDownloadsDocument(Activity, DocId) {
	const ContentUris = plus.android.importClass('android.content.ContentUris');
	const Uri = plus.android.importClass('android.net.Uri');
	const contentUri = ContentUris.withAppendedId(Uri.parse('content://downloads/public_downloads'), parseInt(
		DocId));
	return await getDataColumn(Activity, contentUri);
}

/**
 * 处理外部存储文件
 * @param {String} type 文件类型（primary 或其他）
 * @param {String} id 文件 ID
 */
function handleExternalStorageDocument(Type, Id) {
	const Environment = plus.android.importClass('android.os.Environment');
	if ('primary' === Type) {
		// 处理主存储
		return `${Environment.getExternalStorageDirectory()}/${Id}`;
	} else {
		const System = plus.android.importClass('java.lang.System');
		// 处理非主存储
		return `${System.getenv('SECONDARY_STORAGE')}/${Id}`;
	}
}

/**
 * uri 转路径转换
 * @param {Object} activity 安卓的实例
 * @param {Object} uri 文件 URI
 * @param {String} [selection=null] 查询条件
 * @param {Array} [selectionArgs=null] 查询参数
 * @returns {Promise<String|null>} 文件路径
 */
async function getDataColumn(activity, uri, selection = null, selectionArgs = null) {
	try {
		plus.android.importClass(activity.getContentResolver());
		const cursor = await new Promise((resolve) => {
			const cr = activity.getContentResolver().query(uri, ['_data'], selection, selectionArgs, null);
			plus.android.importClass(cr);
			resolve(cr);
		});

		if (cursor && cursor.moveToFirst()) {
			const column_index = cursor.getColumnIndexOrThrow('_data');
			const result = cursor.getString(column_index);
			cursor.close();

			await new Promise((resolve) => {
				uni.getFileInfo({
					filePath: result,
					success: (res) => {
						console.log(res);
						resolve();
					}
				});
			});

			return result;
		}
	} catch (error) {
		console.error('uri 转路径转换时发生错误:', error);
	}
	return null;
}


// ========================== 读取文件夹下的列表 ========================
// 解析文件夹路径
function resolveLocalFileSystemURL(folderPath) {
	return new Promise((resolve, reject) => {
		// 解析本地文件系统URL
		plus.io.resolveLocalFileSystemURL(
			folderPath,
			(entry) => resolve(entry), // 成功时解析entry
			(error) => reject(new Error(`无法解析文件夹路径 [${folderPath}]: ${error.message}`)) // 失败时返回错误
		);
	});
}
// 读取目录
function readEntries(directoryReader) {
	return new Promise((resolve, reject) => {
		// 读取目录下的条目
		directoryReader.readEntries(
			(entries) => resolve(entries), // 成功时解析entries
			(error) => reject(new Error(`读取文件夹失败: ${error.message}`)) // 失败时返回错误
		);
	});
}

// 获取当前文件夹下所有文件和子文件夹
async function listFilesInFolder(folderPath) {
	const result = []
	async function recursiveListFiles(folderPath) {
		try {
			const entry = await resolveLocalFileSystemURL(folderPath); // 解析文件夹路径
			if (entry.isDirectory) { // 判断是否是目录
				const directoryReader = entry.createReader(); // 创建目录读取器
				const entries = await readEntries(directoryReader); // 读取目录中的条目
				for (const entry of entries) { // 遍历所有条目
					// if (entry.isFile) {
					// 	// 输出文件路径
					// 	console.log('文件: ' + entry.fullPath);
					// } else if (entry.isDirectory) {
					// 	// 输出文件夹路径
					// 	console.log('文件夹: ' + entry.fullPath);
					// 	// await listFilesInFolder(entry.fullPath); // 递归获取子文件夹内容
					// }
					result.push({
						fullPath: entry.fullPath, // 路径
						isFile: entry.isFile, // 是否文件
						isDirectory: entry.isDirectory, // 是否文件夹
						name: entry.name // 文件/夹名
					});
				}
			} else {
				console.error(`路径不是一个文件夹 [${folderPath}]`);
			}
		} catch (error) {
			// 捕获并输出错误信息
			console.error(error.message);
		}
	}
	await recursiveListFiles(folderPath);
	return result
}
// ======================== 打开文件所在位置 ===========================
async function openFileWithPath(filePath) {
	try {
		// 获取当前的 Android 主活动对象
		const main = plus.android.runtimeMainActivity();

		// 导入需要的 Android 类
		const Intent = plus.android.importClass('android.content.Intent');
		const File = plus.android.importClass('java.io.File');
		const Uri = plus.android.importClass('android.net.Uri');
		// const MimeTypeMap = plus.android.importClass('android.webkit.MimeTypeMap');

		// 创建文件实例
		const file = new File(filePath);

		if (file.exists()) {
			// 获取文件的父目录路径
			const parentDir = file.getParentFile().getAbsolutePath();
			const parentDirFile = new File(parentDir);

			// 创建一个新的 Intent 实例，表示浏览文件的操作
			const intent = new Intent(Intent.ACTION_VIEW);
			intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
			// 设置 Intent 的数据和类型
			const uri = Uri.fromFile(parentDirFile);
			intent.setDataAndType(uri, "resource/folder");

			// 启动文件管理器
			main.startActivity(intent);
			console.log('文件夹已打开:', parentDir);
		} else {
			console.error('文件不存在:', filePath);
		}
	} catch (error) {
		console.error('打开文件时发生错误:', error);
	}
}

export default {
	openFolderManager,
	openFileManager,
	listFilesInFolder,
	openFileWithPath
}