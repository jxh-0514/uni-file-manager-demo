import App from './App'
import uvUI from '@/uni_modules/uv-ui-tools'
import { Request } from '@/common/http.js'
import * as Pinia from 'pinia';
import { createSSRApp } from 'vue'
export function createApp() {
	const app = createSSRApp(App)
	app.use(Pinia.createPinia())
	// 引入请求封装
	Request(app)
	
	return {
		app,Pinia
	}
}